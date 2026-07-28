# Launch Checklist

Current launch scope: `technical preview`. Tribunal has strong local/offline evidence, but this batch does not prove production-ready or enterprise-ready deployment because live provider, managed identity, shared storage, independent review, target platform, and Workcell proof are not complete.

## Local Gates

- [x] CLI version checked with `./bin/tribunal version`.
- [x] Doctor checked with `./bin/tribunal doctor --json`.
- [x] Runtime check executed with `$KUJO_BIN check tribunal.kujo`.
- [x] Offline tests executed with `$KUJO_BIN run tests/tribunal_tests.kujo --interpreter`.
- [x] CLI integration executed with `$KUJO_BIN run tests/cli_integration.kujo --interpreter`.
- [x] Schema gate executed with `$KUJO_BIN run scripts/schema_gate.kujo --interpreter`.
- [x] Formatting checked with `git diff --check`.
- [ ] Full release gate for all scripts/tests rerun at this exact batch commit.
- [ ] Workcell proof checked with `workcell run --file docs/workcell-launch-gate.json --repo .`.
- [ ] Live provider and organization-specific deployment certification.

## Current External Blocker

Workcell proof is blocked by the local Docker image build/pull path. The Workcell base image could not be fetched from Docker Hub because `auth.docker.io` timed out.

Closest equivalent proof: Tribunal local/offline CLI, runtime, test, and schema gates.

Safe resume command:

```bash
cd /Users/robertdevore/2026/Kujolang/kujo-repos/workcell
DOCKER_HOST=unix:///Users/robertdevore/.colima/kujo-workcell/docker.sock docker build --tag kujolang/workcell-base:local docker/
cd /Users/robertdevore/2026/Kujolang/kujo-repos/tribunal
workcell run --file docs/workcell-launch-gate.json --repo .
```

## Forbidden Launch Actions

Publishing, tagging, hosted service deployment, live credentials, signing/notarizing, branch-protection changes, force-pushes, and production/enterprise claims without target proof remain out of scope.
