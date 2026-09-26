"""Exercise raw HTTP paths against the disposable local reference adapter."""
import http.client
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time

repo = Path.cwd()
print('HTTP boundary fixture: starting reference store', flush=True)
with tempfile.TemporaryDirectory(prefix='tribunal-store-boundary-') as tmp:
    root = Path(tmp)
    (root/'store').mkdir()
    token = root / 'token'
    token.write_text('synthetic-local-test-token')
    with socket.socket() as available:
        available.bind(('127.0.0.1', 0))
        port = available.getsockname()[1]
    env = {k: v for k, v in os.environ.items() if k in ('PATH','HOME','TMPDIR','LANG')}
    env.update(TRIBUNAL_STORE_ROOT=str(root/'store'), TRIBUNAL_STORE_TOKEN_FILE=str(token), TRIBUNAL_STORE_TENANT='fixture', TRIBUNAL_STORE_PORT=str(port))
    with (root/'server.log').open('w+') as log:
        proc = subprocess.Popen([os.environ['KUJO_BIN'], 'run', str(repo/'src/bridges/immutable_http_store_server.kujo'), '--interpreter'],env=env,stdout=log,stderr=subprocess.STDOUT)
        def request(method, path, body=None, extra=None):
            conn = http.client.HTTPConnection('127.0.0.1',port,timeout=2)
            headers={'Authorization':'Bearer synthetic-local-test-token','X-Tribunal-Tenant':'fixture','X-Tribunal-Region':'local'}
            headers.update(extra or {})
            try:
                conn.request(method,path,body,headers)
                response=conn.getresponse(); response.read(); return response.status
            finally: conn.close()
        try:
            deadline=time.monotonic()+10
            last_status=None
            while True:
                try:
                    last_status=request('GET','/healthz')
                    if last_status == 200: break
                except OSError:
                    pass
                if proc.poll() is not None or time.monotonic() >= deadline:
                    log.seek(0); raise AssertionError(f'server readiness failed (status={last_status}): '+log.read())
                # Readiness polling only; no workload race depends on elapsed sleep.
                time.sleep(.05)
            print('HTTP boundary fixture: store ready', flush=True)
            version='a'*64
            tenants=root/'store/tenants'
            stage=tenants/'fixture/staging/run'/version
            stage.mkdir(parents=True)
            sentinel=tenants/'other/sentinel'; sentinel.parent.mkdir(); sentinel.write_text('preserve')
            cases=[('DELETE','/runs/../versions/../staging'),('GET','/runs/../current'),('GET','/runs/run/versions/../artifacts/record.json'),('GET','/runs/run/versions/../artifacts/record.json/chunks/0'),('GET','/runs/run/versions/'+('z'*64)),('PUT','/runs/run/versions/'+('z'*64)+'/artifacts/record.json')]
            failures=[]
            for method,path in cases:
                code=request(method,path)
                if code != 400: failures.append(f'{method} {path}: {code}')
            if not sentinel.exists(): failures.append('tenant sentinel removed')
            if request('DELETE',f'/runs/run/versions/{version}/staging') != 204: failures.append('valid cleanup rejected')
            if stage.exists(): failures.append('valid staging not removed')
            # Finalization must require one valid compare-and-swap condition.
            for number, condition in enumerate([{}, {'If-Match':'bad'}, {'If-None-Match':'*','If-Match':'b'*64}]):
                run_id=f'condition-{number}'
                local_stage=tenants/'fixture/staging'/run_id/version
                local_stage.mkdir(parents=True); (local_stage/'record.json').write_text('{}')
                metadata={'schemaVersion':'1.0.0','runId':run_id,'exportedAt':'fixture','manifestSha256':version,'keyId':'b'*32,'artifactCount':1,'artifacts':['record.json']}
                code=request('POST',f'/runs/{run_id}/versions',json.dumps(metadata),condition)
                if code != 400: failures.append(f'bad finalization condition {number}: {code}')
                if (tenants/'fixture/indexes'/f'{run_id}.json').exists(): failures.append(f'bad condition {number} published an index')
            run_id='valid-condition'
            local_stage=tenants/'fixture/staging'/run_id/version
            local_stage.mkdir(parents=True); (local_stage/'record.json').write_text('{}')
            metadata={'schemaVersion':'1.0.0','runId':run_id,'exportedAt':'fixture','manifestSha256':version,'keyId':'b'*32,'artifactCount':1,'artifacts':['record.json']}
            if request('POST',f'/runs/{run_id}/versions',json.dumps(metadata),{'If-None-Match':'*'}) != 201: failures.append('valid conditional publication rejected')
            if request('POST',f'/runs/{run_id}/versions',json.dumps(metadata),{'If-Match':'c'*64}) != 412: failures.append('stale conditional update accepted')
            print(json.dumps({'checks':len(cases)+11,'failures':failures}))
            if failures:
                log.seek(0); print(log.read()); raise SystemExit(1)
        finally:
            proc.terminate()
            try: proc.wait(timeout=5)
            except subprocess.TimeoutExpired: proc.kill(); proc.wait()

# Corrupt the continuation shard only after the first page reaches the collector.
# This is synchronized on the POST, not on timing or a background writer.
from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import TCPServer
from unittest.mock import patch
import threading

class LoopbackHTTPServer(HTTPServer):
    def server_bind(self):
        # HTTPServer normally reverse-resolves the bound address. This fixture
        # needs only a numeric loopback address; DNS can stall hosted macOS.
        TCPServer.server_bind(self)
        self.server_name, self.server_port = self.server_address[:2]

print('HTTP boundary fixture: starting telemetry collector', flush=True)
with tempfile.TemporaryDirectory(prefix='tribunal-telemetry-boundary-') as tmp:
    root = Path(tmp)
    storage = root / 'runs'
    pages = storage / '.index/pages'
    pages.mkdir(parents=True)
    def write_json(path, value):
        path.write_text(json.dumps(value))
    entries = [{'runId':f'run-{i:03}', 'manifestSha256':'a'*64,
                'manifest':{'runId':f'run-{i:03}', 'status':'completed','panelId':'fixture'}}
               for i in range(101)]
    # Metadata filename is the public storage index contract.
    write_json(storage/'.index/runs.json', {'schemaVersion':'1.0.0','generation':1,
               'updatedAt':'fixture','runCount':101,'pageCount':2,'pageSize':100})
    write_json(pages/'00000001.json', {'schemaVersion':'1.0.0','page':1,'entries':entries[:1]})
    write_json(pages/'00000002.json', {'schemaVersion':'1.0.0','page':2,'entries':entries[1:]})
    for entry in entries:
        run = storage / entry['runId']; run.mkdir()
        (run / 'events.jsonl').write_text('{}\n')
    received = []
    class Collector(BaseHTTPRequestHandler):
        def do_POST(self):
            received.append(json.loads(self.rfile.read(int(self.headers['Content-Length']))))
            (pages/'00000001.json').write_text('{}')
            self.send_response(200); self.end_headers(); self.wfile.write(b'{}')
        def log_message(self, *args):
            pass
    # Keep fixture startup independent of the host's reverse-DNS configuration.
    with patch('socket.getfqdn', side_effect=AssertionError('fixture must not resolve DNS')):
        collector_server=LoopbackHTTPServer(('127.0.0.1',0),Collector)
    with collector_server as server:
        thread=threading.Thread(target=server.serve_forever,daemon=True); thread.start()
        env=os.environ.copy(); env.pop('KUJO',None)
        try:
            print('HTTP boundary fixture: invoking telemetry export', flush=True)
            proc=subprocess.run([str(repo/'bin/tribunal'),'telemetry-export','--storage-dir',str(storage),
                 '--collector','http','--destination',f'http://127.0.0.1:{server.server_port}', '--json'],
                 env=env,capture_output=True,text=True,timeout=20)
            assert len(received)==1 and received[0]['runsProcessed']==100, proc.stdout+proc.stderr
            assert proc.returncode==1 and json.loads(proc.stdout).get('ok') is False and 'Run-index page is invalid' in json.loads(proc.stdout).get('error',''), proc.stdout+proc.stderr
            print(json.dumps({'telemetryContinuation':'rejected','pagesSent':len(received)}))
        finally:
            server.shutdown(); thread.join(timeout=5)
