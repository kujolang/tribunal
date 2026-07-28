# Launch Checklist

Current launch scope: `technical preview`. Tribunal has strong local/offline evidence and Workcell proof for this batch, but production-ready or enterprise-ready deployment remains unproven because live provider, managed identity, shared storage, independent review, target platform, and full release evidence are not complete.

## Local Gates

- [x] CLI version checked with `./bin/tribunal version`.
- [x] Doctor checked with `./bin/tribunal doctor --json`.
- [x] Runtime check executed with `$KUJO_BIN check tribunal.kujo`.
- [x] Offline tests executed with `$KUJO_BIN run tests/tribunal_tests.kujo --interpreter`.
- [x] CLI integration executed with `$KUJO_BIN run tests/cli_integration.kujo --interpreter`.
- [x] Schema gate executed with `$KUJO_BIN run scripts/schema_gate.kujo --interpreter`.
- [x] Formatting checked with `git diff --check`.
- [ ] Full release gate for all scripts/tests rerun at this exact batch commit.
- [x] Workcell proof checked with `workcell run --file docs/workcell-launch-gate.json --repo . --no-pull`.
- [ ] Live provider and organization-specific deployment certification.

## Workcell Proof Notes

Workcell proof passed after building `kujolang/workcell-base:local` with `DOCKER_BUILDKIT=0`, using the Colima Workcell Docker host, and setting `TMPDIR` to a path under `/Users/robertdevore/2026/Kujolang/kujo-repos/.workcell-host-tmp` so the disposable worktree mount was visible inside the Colima VM.

Resume command:

```bash
export DOCKER_HOST=unix:///Users/robertdevore/.colima/kujo-workcell/docker.sock
export DOCKER_CONFIG=/tmp/kujo-next-batch-docker-config
export TMPDIR=/Users/robertdevore/2026/Kujolang/kujo-repos/.workcell-host-tmp
workcell run --file docs/workcell-launch-gate.json --repo . --no-pull
workcell verify --run .workcell/runs/<run-id> --json
```

## Forbidden Launch Actions

Publishing, tagging, hosted service deployment, live credentials, signing/notarizing, branch-protection changes, force-pushes, and production/enterprise claims without target proof remain out of scope.
