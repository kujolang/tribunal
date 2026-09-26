# Two independent processes publish distinct immutable versions of one run.
import os, pathlib, subprocess, tempfile, json, concurrent.futures
repo=pathlib.Path.cwd(); binary=os.environ.get('KUJO_BIN', str(repo.parent/'kujo/target/release/kujo'))
with tempfile.TemporaryDirectory(prefix='tribunal-store-race-') as tmp:
 root=pathlib.Path(tmp); env={**os.environ,'TRIBUNAL_HOME':str(repo),'KUJO_BIN':binary,'RACE_ROOT':tmp}
 prep=root/'prepare.kujo'; prep.write_text('''from src.common import ensure_dir
from src.integrity import generate_keys, seal
root := env_or("RACE_ROOT", "")
priv := join_path(root, "private.pem"); pub := join_path(root, "public.pem")
if generate_keys(priv, pub, 2048)["ok"] != true { exit(1) }
for name in ["a", "b"] {
 storage := join_path(root, name); run := join_path(storage, "fixture"); ensure_dir(run)
 write_file(join_path(run, "record.json"), "{}")
 write_file(join_path(run, "payload.txt"), repeat(name, 8388608))
 result := seal(storage, "fixture", priv, pub)
 if result["ok"] != true { print(to_json(result)); exit(1) }
}
''')
 subprocess.run([binary,'run',str(prep),'--interpreter'],env=env,check=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=60)
 worker=root/'worker.kujo';worker.write_text('''from src.artifact_store import publish_local
root := env_or("RACE_ROOT", ""); name := env_or("RACE_NAME", "")
write_file(join_path(root, name + ".ready"), "", true)
started := current_timestamp()
while file_exists(join_path(root, "go")) == false { if current_timestamp() - started > 10000 { exit(2) }; sleep(5) }
print(to_json(publish_local(join_path(root, name), "fixture", join_path(root, "store"), env_or("RACE_EXPECTED", ""))))
''')
 procs=[subprocess.Popen([binary,'run',str(worker),'--interpreter'],env={**env,'RACE_NAME':name},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True) for name in ['a','b']]
 import time
 deadline=time.monotonic()+10
 try:
  while not all((root/(n+'.ready')).exists() for n in ['a','b']):
   if time.monotonic()>deadline: raise TimeoutError('worker readiness')
   time.sleep(.005)
  (root/'go').touch()
  results=[]
  for p in procs:
   out,_=p.communicate(timeout=60)
   if p.returncode: raise RuntimeError(out)
   results.append(json.loads(out.strip().splitlines()[-1]))
  index=json.loads((root/'store/indexes/fixture.json').read_text())
  assert sum(r['ok'] for r in results)==1, results
  assert len(index['versions'])==1
  assert len(list((root/'store/objects/fixture').iterdir()))==1
  loser = ['a','b'][next(i for i,r in enumerate(results) if not r['ok'])]
  follow=subprocess.run([binary,'run',str(worker),'--interpreter'],env={**env,'RACE_NAME':loser,'RACE_EXPECTED':index['currentVersion']},capture_output=True,text=True,timeout=60)
  assert follow.returncode==0, follow.stdout+follow.stderr
  updated=json.loads(follow.stdout.strip().splitlines()[-1]); assert updated['ok'], updated
  assert len(updated['index']['versions'])==2, updated
  import hashlib
  versions=[{'version':hashlib.sha256(str(i).encode()).hexdigest(),'publishedAt':'fixture','keyId':'a'*32,'path':'fixture'} for i in range(10000)]
  full={'schemaVersion':'1.0.0','runId':'fixture','currentVersion':versions[-1]['version'],'versions':versions}
  index_path=root/'store/indexes/fixture.json'; index_path.write_text(json.dumps(full)); original=index_path.read_bytes()
  limited=subprocess.run([binary,'run',str(worker),'--interpreter'],env={**env,'RACE_NAME':loser,'RACE_EXPECTED':full['currentVersion']},capture_output=True,text=True,timeout=60)
  assert limited.returncode==0, limited.stdout+limited.stderr
  refusal=json.loads(limited.stdout.strip().splitlines()[-1]); assert not refusal['ok'] and 'safety limit' in refusal['error'], refusal
  assert index_path.read_bytes()==original
  print(json.dumps({'versionLimitRefused':True,'conditionalRetryHistory':2,'successfulWriters':sum(r['ok'] for r in results),'historyEntries':len(index['versions']),'objectVersions':len(list((root/'store/objects/fixture').iterdir())),'results':results}))
 finally:
  for p in procs:
   if p.poll() is None: p.kill(); p.wait()
