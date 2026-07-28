# Tribunal Agent Instructions

Tribunal is a local-first decision-evidence engine. Treat mock/offline review proof as local decision evidence, not hosted, regulated, or enterprise deployment certification.

## Required Reading

- `README.md`
- `SECURITY.md`
- `docs/THREAT_MODEL.md`
- `docs/ENTERPRISE_READINESS.md`
- `docs/OPERATIONS.md`
- `docs/launch-checklist.md`
- Latest `docs/NEXT_SESSION_REVIEW*.md`

## Validation

Set `KUJO_BIN` to the intended runtime.

```bash
./bin/tribunal version
./bin/tribunal doctor --json
"$KUJO_BIN" check tribunal.kujo
"$KUJO_BIN" run tests/tribunal_tests.kujo --interpreter
"$KUJO_BIN" run tests/cli_integration.kujo --interpreter
"$KUJO_BIN" run scripts/schema_gate.kujo --interpreter
git diff --check
```

Run the wider release gates when changing source, schemas, enterprise evidence, or release claims.

## Evidence Rules

- Preserve command logs, run IDs, manifests, schemas, and release-gate receipts for the exact commit under review.
- Workcell proof is required for this launch batch unless a blocker receipt documents the Docker/host blocker and the closest equivalent proof.
- Do not modify sealed `tribunal-runs/` evidence in place; create new evidence.

## Prohibited Without Approval

Do not create public releases, push final tags, publish packages, use live model/provider credentials, sign/notarize artifacts, alter branch protection, force-push, rewrite history, or claim enterprise readiness without target-environment certification.
