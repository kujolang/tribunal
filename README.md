# Tribunal

Tribunal is a local-first, Kujo-native CLI for structured adversarial decision review. Its CLI, hearing lifecycle, persistence, mock model, integrity verification, signing, and integration adapters are implemented in the Kujo programming language. The previous TypeScript implementation is preserved on the pushed `typescript` branch.

Tribunal owns decision flow and panel orchestration. Every live model call crosses the Kujo model boundary into Kujo AI SDK; Tribunal contains no provider SDK or direct provider endpoint code.

## Quick start

```bash
export KUJO_BIN=../kujo/target/release/kujo
export KUJO="$KUJO_BIN"

./bin/tribunal panels
./bin/tribunal review examples/product-decision.md --panel fast-two-model
```

The launcher only locates the repository and invokes `kujo run tribunal.kujo`. The equivalent direct form is:

```bash
TRIBUNAL_HOME="$PWD" "$KUJO_BIN" run tribunal.kujo review \
  examples/product-decision.md --panel strategic-five
```

Commands:

```text
tribunal review <file> --panel <panel-name>
tribunal kill <file>
tribunal list
tribunal show <run-id>
tribunal replay <run-id>
tribunal keys --private-key <pem> --public-key <pem>
tribunal seal <run-id> --private-key <pem> --public-key <pem>
tribunal verify <run-id> [--public-key <pem>]
tribunal ingest <run-id> --target runledger|casefile --public-key <pem>
tribunal export <run-id> --format json|jsonl
tribunal panels
tribunal seats
tribunal version
```

## Hearing lifecycle

Every completed review records nine explicit stages:

1. open docket
2. validate scope
3. build context pack
4. blind first pass
5. cross-examination
6. Executioner kill pass
7. Judge ruling
8. decision packet
9. persist record

Blind prompts contain only the immutable docket/context and the current seat contract. The complete testimony record is introduced only after every blind response is captured.

## Panels and seats

- `executioner-only`: focused fatal-flaw review with a procedural final ruling.
- `fast-two-model`: Executioner and Judge.
- `strategic-five`: Executioner, Builder, Operator, Market Lens, and Judge.

Every seat defines authority, non-goals, stage responsibilities, structured output requirements, provider-neutral Kujo model preferences, and escalation triggers.

## Run records

Runs are written under `tribunal-runs/<run-id>/` by default:

```text
docket.md
manifest.json
context.md
prompts/
testimony/
cross-examination.md
kill-pass.md
ruling.md
decision-packet.md
record.json
events.jsonl
receipt.json
artifact-manifest.json
signature.json  # signed runs only
```

`record.json` is the complete structured hearing. `events.jsonl` is append-oriented stage/model evidence. `artifact-manifest.json` hashes every non-integrity artifact and rejects missing, changed, or unexpected files during verification and replay.

## Mock and live Kujo AI SDK modes

Mock mode is deterministic, offline, and credential-free:

```bash
./bin/tribunal review examples/product-decision.md --mock
```

Live mode invokes the adjacent Kujo AI SDK through the Kujo bridge:

```bash
export OPENAI_API_KEY="..."
./bin/tribunal review examples/product-decision.md --live \
  --ai-sdk-path ../ai-sdk \
  --kujo-bin ../kujo/target/release/kujo
```

Tribunal forwards each provider-neutral preference object to SDK-owned `resolve_model_preference(...)` and persists the selected model, preference class, and resolution provenance. Credentials remain owned by Kujo AI SDK environment conventions and are never accepted in Tribunal records or config.

`--offline-fixture` exercises the real SDK bridge without network. The SDK fixture proves routing and normalized metadata contracts; because its canned text is not a Tribunal structured response, it is tested at the model-boundary level rather than used for a complete hearing.

## Integrity, signing, and ingestion

Every completed or stopped run receives a SHA-256 artifact manifest. Signing uses Kujo's native RSA-PKCS#1 v1.5 SHA-256 primitives:

```bash
./bin/tribunal keys \
  --private-key ./tribunal-private.pem \
  --public-key ./tribunal-public.pem

./bin/tribunal review examples/product-decision.md \
  --private-key ./tribunal-private.pem \
  --public-key ./tribunal-public.pem

./bin/tribunal verify <run-id> --public-key ./tribunal-public.pem
```

Never commit private keys. A signature is accepted for ingestion only when the entire artifact set is intact and the supplied, separately trusted public key verifies it.

```bash
./bin/tribunal ingest <run-id> \
  --target runledger \
  --public-key ./tribunal-public.pem \
  --ledger ./.runledger \
  --runledger-path ../runledger/runledger.kujo

./bin/tribunal ingest <run-id> \
  --target casefile \
  --public-key ./tribunal-public.pem \
  --casefile-output ./.casefile \
  --casefile-path ../casefile/casefile.kujo
```

RunLedger receives model identity, usage, verdict, signed-manifest evidence, and next actions. CaseFile receives a manual case with a preserved `tribunal-evidence/` bundle. Downstream output remains outside the sealed source run.

## Optional PackWrite context

```bash
./bin/tribunal review examples/product-decision.md \
  --context-provider packwrite \
  --packwrite-path ../packwrite
```

PackWrite's deterministic redacted repository context is appended before blind testimony and does not invoke a model.

## Stop the line

Fatal docket, panel, model, secret-safety, integrity, or persistence failures stop the hearing. Tribunal attempts to leave a stopped manifest, JSONL evidence, partial record, receipt, and verifiable artifact manifest.

## Configuration

See [docs/configuration.md](docs/configuration.md). Configuration is JSON and uses Kujo-style snake_case fields. It has no credential field.

## Development and validation

```bash
export TRIBUNAL_HOME="$PWD"
export KUJO_BIN=../kujo/target/release/kujo

"$KUJO_BIN" check tribunal.kujo
"$KUJO_BIN" check tests/tribunal_tests.kujo
"$KUJO_BIN" run tests/tribunal_tests.kujo
"$KUJO_BIN" run tests/cli_integration.kujo
"$KUJO_BIN" run scripts/schema_gate.kujo
"$KUJO_BIN" run scripts/drift_gate.kujo
"$KUJO_BIN" run scripts/spec_gate.kujo
```

Run the repository Eval suite from the adjacent Eval project so its own `src/` modules remain authoritative:

```bash
(cd ../eval && "$KUJO_BIN" run main.kujo lint ../tribunal/tests/tribunal_eval.json)
(cd ../eval && "$KUJO_BIN" run main.kujo run ../tribunal/tests/tribunal_eval.json \
  --output-dir /tmp/tribunal-eval-results --json)
```

The tests run without credentials or network and exercise all CLI commands, the Kujo mock engine, real Kujo AI SDK offline bridge, PackWrite, RunLedger, CaseFile, signing, tamper detection, stopped runs, and required artifacts.

## Architecture and integrations

- [Architecture](docs/architecture.md)
- [Configuration](docs/configuration.md)
- [Kujo ecosystem integrations](docs/integrations.md)
- [Paperclip skill stub](docs/paperclip-skill.md)
- [BZBY analytics path](docs/bzby.md)
- Machine-readable contracts: [`schemas/`](schemas/)

## Current limitations

- JSON is the only configuration format.
- Live providers are limited to presets currently exposed by Kujo AI SDK.
- Replay verifies and inspects recorded evidence; it intentionally does not rerun models.
- RSA keys are local PEM files. Custody, permissions, rotation, revocation, and organizational trust policy remain caller responsibilities.
- ChangeBucket, Muzzle, Strata, Paperclip, and BZBY remain documented seams rather than embedded dependencies.
- A web UI is intentionally out of scope.

## Next

The next slice is a Kujo-native signing-provider abstraction for managed key services, CI publication of signed bundles, and a downstream analytics index that links Tribunal, RunLedger, CaseFile, and change evidence without mutating sealed runs.
