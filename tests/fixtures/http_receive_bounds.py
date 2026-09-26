"""Exercise the supported runtime's receive bound used by Tribunal's adapters."""
import http.server
import json
import os
import pathlib
import subprocess
import tempfile
import threading

LIMIT = 8 * 1024 * 1024


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def do_GET(self):
        self.connection.settimeout(10)
        size = LIMIT if self.path == '/exact' else LIMIT + 1
        self.send_response(200)
        if self.path != '/unannounced-overflow':
            self.send_header('Content-Length', str(size))
        self.end_headers()
        try:
            while size:
                chunk = b'x' * min(size, 65536)
                self.wfile.write(chunk)
                size -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            # The client closes rejected responses without consuming the body.
            pass


def main():
    binary = os.environ['KUJO_BIN']
    with http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with tempfile.TemporaryDirectory(prefix='tribunal-receive-') as tmp:
                probe = pathlib.Path(tmp) / 'probe.kujo'
                probe.write_text('''base := env_or("RECEIVE_TEST_URL", "")
for path in ["/exact", "/announced-overflow", "/unannounced-overflow"] {
    result := http_request(base + path, {"method": "GET", "timeout": 10})
    match result {
        case Ok(value): { print(to_json({"path": path, "ok": true, "bytes": len(value["_body"]), "error": ""})) }
        case Err(error): { print(to_json({"path": path, "ok": false, "bytes": 0, "error": to_string(error)})) }
    }
}
''')
                env = {**os.environ, 'TRIBUNAL_HOME': str(pathlib.Path.cwd()), 'RECEIVE_TEST_URL': f'http://127.0.0.1:{server.server_port}'}
                result = subprocess.run([binary, 'run', str(probe), '--interpreter'],
                                        env=env, capture_output=True, text=True, timeout=40)
                assert result.returncode == 0, result.stdout + result.stderr
                records = [json.loads(line) for line in result.stdout.splitlines()]
                assert len(records) == 3, records
                assert records[0]['ok'] and records[0]['bytes'] == LIMIT, records[0]
                for record in records[1:]:
                    assert not record['ok'] and record['bytes'] == 0, record
                    assert 'maximum network body size' in record['error'], record
                print(json.dumps({'passed': 3, 'receiveLimitBytes': LIMIT, 'cases': records}))
        finally:
            server.shutdown()
            thread.join(timeout=5)
            assert not thread.is_alive()


if __name__ == '__main__':
    main()
