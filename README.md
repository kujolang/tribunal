# Tribunal

Tribunal is a local-first decision review engine written entirely in the Kujo programming language. It turns a consequential proposal into a durable, adversarial hearing: independent specialist testimony, cross-examination, an explicit fatal-flaw pass, a ruling, and an execution-ready decision packet.

The result is inspectable evidence, not a disposable chat transcript. Every run is structured, replayable, SHA-256 sealed, optionally RSA-signed, and ready for Kujo ecosystem handoff.

The previous TypeScript implementation is preserved on the pushed `typescript` branch. `main` has no Node, npm, TypeScript, JavaScript, or provider-SDK runtime dependency.

## Why Tribunal

Use Tribunal when a decision deserves more than one model response:

- architecture and build-versus-buy decisions;
- production launches, migrations, and incident follow-ups;
- security, privacy, and operational risk reviews;
- product bets and roadmap tradeoffs;
- agent-generated plans that need explicit evidence and stop conditions.

Three panels cover focused through strategic review: `executioner-only`, `fast-two-model`, and `strategic-five`. The five seats—Judge, Executioner, Builder, Operator, and Market Lens—have distinct authority, non-goals, output contracts, and provider-neutral model preferences.

## Quick start

```bash
export KUJO_BIN=../kujo/target/release/kujo

./bin/tribunal doctor
./bin/tribunal validate examples/product-decision.md
./bin/tribunal review examples/product-decision.md --panel fast-two-model
./bin/tribunal list --status completed --limit 5
```

Mock mode is deterministic, offline, credential-free, and the default. The launcher only resolves this repository and executes `kujo run tribunal.kujo`.

## Command surface

```text
tribunal review <file> --panel <panel-name> [--mock|--live]
tribunal kill <file> [--mock|--live]
tribunal validate <file> [--json]
tribunal list [--status <status> --panel <panel> --limit <n> --json]
tribunal show <run-id> [--json]
tribunal replay <run-id> [--public-key <pem> --require-signature]
tribunal keys --private-key <pem> --public-key <pem> [--bits 2048|4096]
tribunal seal <run-id> --private-key <pem> --public-key <pem>
tribunal verify <run-id> [--public-key <pem> --require-signature]
tribunal ingest <run-id> --target runledger|casefile --public-key <pem>
tribunal export <run-id> --format json|jsonl
tribunal panels [--json]
tribunal seats [--json]
tribunal doctor [--json]
tribunal stats [--json]
tribunal version
```

Exit codes are stable: `0` success, `1` runtime failure, `2` usage/configuration error, and `3` integrity failure. Unknown, duplicate, missing-value, and conflicting options are rejected.

## Hearing and evidence

Every completed hearing records nine stages: docket opening, scope validation, context construction, blind first pass, cross-examination, Executioner kill pass, Judge ruling, decision packet, and durable persistence.

Blind prompts contain only the immutable docket/context and current seat contract. Peer testimony is introduced only after all blind responses are captured.

Runs are stored under `tribunal-runs/<run-id>/` by default:

```text
docket.md                 context.md
manifest.json             events.jsonl
prompts/                  testimony/
cross-examination.md      kill-pass.md
ruling.md                 decision-packet.md
record.json               receipt.json
artifact-manifest.json    signature.json (signed runs only)
```

`record.json` is the complete machine-readable hearing; the Markdown artifacts are human/agent-readable; `events.jsonl` is append-oriented evidence. Replay rejects missing, changed, unexpected, oversized, unsafe, or symlinked artifacts.

## Live Kujo AI SDK

Tribunal owns the hearing. The adjacent Kujo AI SDK owns provider resolution, network calls, retries, and normalized metadata. Tribunal contains no direct provider endpoint or SDK code.

```bash
export OPENAI_API_KEY="..."
./bin/tribunal review examples/product-decision.md --live \
  --provider openai \
  --ai-sdk-path ../ai-sdk \
  --kujo-bin ../kujo/target/release/kujo
```

Only the selected provider credential and a small operational environment allowlist reach the SDK subprocess. Credentials are never accepted in Tribunal config or persisted contracts. `--offline-fixture` exercises the real SDK bridge without network.

## Integrity and trusted handoff

Every completed or stopped run receives a byte-accurate SHA-256 manifest. Optional signatures bind the manifest digest, run ID, algorithm, key fingerprint, and signing time in a versioned RSA-PKCS#1 v1.5 SHA-256 envelope.

```bash
./bin/tribunal keys --bits 4096 \
  --private-key ./tribunal-private.pem \
  --public-key ./tribunal-public.pem

./bin/tribunal review examples/product-decision.md \
  --private-key ./tribunal-private.pem \
  --public-key ./tribunal-public.pem

./bin/tribunal verify <run-id> \
  --public-key ./tribunal-public.pem \
  --require-signature
```

Never commit private keys. Tribunal does not replace organizational key custody, rotation, revocation, or trust policy.

Signed runs can be ingested idempotently into Kujo RunLedger or CaseFile. The source run remains immutable; downstream receipts are kept outside its sealed evidence directory.

Optional PackWrite context enrichment is deterministic and redacted:

```bash
./bin/tribunal review examples/product-decision.md \
  --context-provider packwrite --packwrite-path ../packwrite
```

## Enterprise controls

Tribunal v0.3.0 adds strict config/CLI contracts, bounded docket/context/model/process sizes, model timeouts, secret detection, subprocess environment isolation, safe artifact paths, symlink rejection, signed-envelope metadata binding, idempotent ingestion, local diagnostics, filtered JSON inventory, and aggregate local statistics.

See [Security](SECURITY.md), [Operations](docs/OPERATIONS.md), and [Enterprise readiness](docs/ENTERPRISE_READINESS.md) before production adoption. Machine-readable contracts live in [`schemas/`](schemas/).

## Kujo-native development

```bash
export TRIBUNAL_HOME="$PWD"
export KUJO_BIN=../kujo/target/release/kujo

for file in $(find . -name '*.kujo' -not -path './.git/*'); do
  "$KUJO_BIN" check "$file"
done
"$KUJO_BIN" run tests/tribunal_tests.kujo
"$KUJO_BIN" run tests/cli_integration.kujo
"$KUJO_BIN" run scripts/schema_gate.kujo
"$KUJO_BIN" run scripts/drift_gate.kujo
"$KUJO_BIN" run scripts/spec_gate.kujo
"$KUJO_BIN" run scripts/benchmark.kujo
```

The offline gates exercise 23 Kujo source files, 91 core assertions, 25 CLI assertions, nine schemas, signing/tamper detection, PackWrite, RunLedger, CaseFile, the AI SDK fixture, Spec, Concord, and Eval. See [Contributing](CONTRIBUTING.md).

## Project map

- [Architecture](docs/architecture.md)
- [Configuration](docs/configuration.md)
- [Operations](docs/OPERATIONS.md)
- [Enterprise readiness](docs/ENTERPRISE_READINESS.md)
- [Integrations](docs/integrations.md)
- [Next-session review](docs/NEXT_SESSION_REVIEW.md)
- [Changelog](CHANGELOG.md)

## Boundaries

JSON is currently the only config format. Replay verifies recorded evidence and intentionally does not rerun models. Managed signing services, revocation, multi-tenant authorization, remote retention, and a web UI are not built in; the production implications are tracked in the readiness and next-session documents.
