# Operator recipes

## First offline hearing

```bash
export KUJO_BIN=/absolute/path/to/kujo
./bin/tribunal doctor --json
./bin/tribunal review examples/gallery/architecture.md --panel executioner-only --mock
./bin/tribunal list --status completed --limit 5 --json
```

## Signed production evidence

Prefer `seal-provider` with a certified managed signer. For a local development key, generate it outside the repository, run the hearing with both key paths, then require the public key during audit. Kujo does not yet expose a portable restrictive-mode API, so local private-key generation is not the recommended production custody path.

```bash
./bin/tribunal keys --private-key "$HOME/.tribunal/dev-private.pem" --public-key "$HOME/.tribunal/dev-public.pem" --bits 4096
./bin/tribunal review decision.md --private-key "$HOME/.tribunal/dev-private.pem" --public-key "$HOME/.tribunal/dev-public.pem"
./bin/tribunal audit RUN_ID --public-key "$HOME/.tribunal/dev-public.pem" --require-signature --json
```

## Resume, compare, and re-review

Use `resume` only for a sealed stopped hearing. It creates a new run with checkpoint and record hashes bound into immutable lineage. Use `compare` for two existing sealed rulings or `re-review` to create a fresh hearing and a comparison report outside run storage. Source runs are never rewritten.

## Index recovery

```bash
./bin/tribunal index-check --json
./bin/tribunal index-repair --json
./bin/tribunal index-rebuild --json
```

## Export without mutating evidence

```bash
./bin/tribunal bundle-export RUN_ID --output /evidence/tribunal/RUN_ID
./bin/tribunal telemetry-export --collector jsonl --destination /var/log/tribunal/events.jsonl
./bin/tribunal dashboard-export --output /reports/tribunal.html
```
