# Tribunal

Tribunal is a local-first decision review engine written entirely in the Kujo programming language. It turns a consequential proposal into a durable, adversarial hearing: independent specialist testimony, cross-examination, an explicit fatal-flaw pass, a ruling, and an execution-ready decision packet.

The result is inspectable evidence, not a disposable chat transcript. Every run is structured, replayable, SHA-256 sealed, optionally RSA-signed, and ready for Kujo ecosystem handoff.

The previous TypeScript implementation is preserved on the pushed `typescript` branch. `main` has no Node, npm, TypeScript, JavaScript, or provider-SDK runtime dependency.

Tribunal is also a practical showcase for [Kujo](https://github.com/kujolang/kujo): orchestration, JSON Schema, cryptography, process isolation, HTTP, compression, filesystem safety, testing, and release evidence are implemented with Kujo language/runtime capabilities.

## Production-readiness statement

Tribunal v0.6.0 is production-oriented and useful as a local or operator-controlled decision-evidence engine. It is not automatically “universally enterprise-ready”: the included Vault Transit and authenticated HTTP-store profiles must still be run against a real deployment and preserve passing certification evidence before making that claim.

| Use case | Posture |
| --- | --- |
| Offline mock review and sealed local evidence | ready and fully regression-tested |
| Single-operator local production use | ready with documented filesystem, key, backup, and verification controls |
| Shared service or regulated deployment | application contracts are ready; deployment adapters and organizational controls require certification |
| Public hosted service | intentionally not provided; transport authentication and tenancy must be designed first |

See [Enterprise readiness](docs/ENTERPRISE_READINESS.md), [Threat model](docs/THREAT_MODEL.md), and the [next review](docs/NEXT_SESSION_REVIEW.md) before making a production claim.

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

./bin/tribunal version
./bin/tribunal doctor
./bin/tribunal validate examples/product-decision.md
./bin/tribunal review examples/product-decision.md --panel fast-two-model
./bin/tribunal list --status completed --limit 5
```

Install or build Kujo first, then place `kujo` on `PATH` or set `KUJO_BIN`/`KUJO` to its executable. Mock mode is deterministic, offline, credential-free, and the default. The launcher only resolves this repository and executes `kujo run tribunal.kujo`.

## Command surface

```text
tribunal review <file> --panel <panel-name> [--mock|--live]
tribunal kill <file> [--mock|--live]
tribunal validate <file> [--json]
tribunal list [--status <status> --panel <panel> --limit <n> --cursor <run-id> --json]
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
tribunal contracts <run-id> [--json]
tribunal audit <run-id> [--public-key <pem>|--trust-policy <json> --target <name>] [--require-signature --json]
tribunal seal-provider <run-id> --provider-config <json>
tribunal verify-policy <run-id> --trust-policy <json> --target <name>
tribunal bundle-export <run-id> --output <directory>
tribunal bundle-import <directory> --trust-policy <json> --target <name>
tribunal bundle-encrypt <run-id> --output <directory> --recipient-public-key <pem> [--recovery-public-key <pem>]
tribunal bundle-decrypt <directory> --recipient-private-key <pem> --trust-policy <json> --target <name>
tribunal bundle-rekey <directory> --recipient-private-key <pem> --recipient-public-key <pem>
tribunal store-publish <run-id> [--expected-version <sha256>]
tribunal store-pull <run-id> [--version <sha256>] --trust-policy <json>
tribunal telemetry-export [--collector jsonl|http --destination <path|url>]
tribunal dashboard-export --output <html>
tribunal legal-hold <run-id> --enable|--release --reason <text>
tribunal delete <run-id> --reason <text> [--force-expired]
tribunal provenance-sign <document> --kind <kind> --sequence <n> --private-key <pem> --public-key <pem> --output <json> --anchor <json>
tribunal provenance-verify <document> --provenance <json> --public-key <pem> --anchor <json>
tribunal locks-recover [--stale-after-ms <n>]
tribunal auth-check --permission <permission>
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

Never commit private keys. For managed custody, `seal-provider` invokes an external Kujo HSM/KMS adapter with an opaque key reference and federated workload identity. The included Vault Transit adapter authenticates with AWS, Azure, GitHub Actions, or a generic workload-token file, and returns audit/key-version evidence without private key material entering Tribunal. The live conformance harness must pass before declaring a deployment certified. Versioned trust policies separately enforce key status, validity, rotation, revocation, and target permissions.

Portable evidence can use AES-256-GCM envelope encryption with independent primary and recovery RSA-OAEP recipients. Signed manifest integrity remains verifiable without decrypting evidence; rekeying does not rewrite ciphertext. Live run storage should use an organization-approved encrypted volume or managed encrypted filesystem so Tribunal can retain atomic, inspectable files without embedding a local master key.

Signed runs can be ingested idempotently into Kujo RunLedger or CaseFile. The source run remains immutable; downstream receipts are kept outside its sealed evidence directory.

For the normal production verification boundary, use the combined audit command:

```bash
./bin/tribunal audit <run-id> \
  --trust-policy ./trust-policy.json \
  --target audit \
  --require-signature \
  --json
```

It fails closed unless artifact integrity, executable evidence contracts, current trust policy, and the required signature all pass.

Optional PackWrite context enrichment is deterministic and redacted:

```bash
./bin/tribunal review examples/product-decision.md \
  --context-provider packwrite --packwrite-path ../packwrite
```

## Enterprise controls

Tribunal v0.6.0 includes:

- default-deny service/user identity and role authorization;
- external HSM/KMS signing-provider contracts and v1.2 signer provenance;
- trusted-key lifecycle and allowed-target policies;
- signed bundle export/import and conditional versioned local/HTTP artifact stores;
- atomic per-run locks, stale-writer recovery, and interrupted-seal rollback journals;
- immutable retention metadata, external post-seal legal holds, whole-run deletion, and tombstones;
- external JSONL/HTTP metrics and audit export;
- executable Kujo JSON Schema validation for every emitted contract;
- provider output type/range/enum validation and deterministic property corpora;
- cursor pagination, large-hearing/inventory budgets, and tag release publication;
- an authorized offline read-only HTML dashboard without introducing a network API;
- a combined audit report, exclusive run creation, non-stealing lock acquisition, bounded imports, pre-deletion tombstones, and secure external-output boundaries;
- HTTPS-by-default remote endpoints, with plain HTTP permitted only for loopback adapter development.
- a Vault Transit JWT workload-identity adapter plus live denial/retry/rotation/audit certification harness;
- tenant- and region-bound authenticated HTTP-store requests, bounded retry, staging cleanup, and a live failure/backup certification harness;
- signed sequence chains with external rollback anchors for policies, governance, tombstones, and store indexes;
- AES-256-GCM encrypted decision packets with RSA-OAEP primary/recovery key wrapping and ciphertext-preserving rotation;
- a fail-closed algorithm registry defining RSA-PSS and Ed25519 migration targets while preserving legacy RSA verification.

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
"$KUJO_BIN" run tests/enterprise_tests.kujo
"$KUJO_BIN" run tests/property_tests.kujo
"$KUJO_BIN" run scripts/schema_gate.kujo
"$KUJO_BIN" run scripts/drift_gate.kujo
"$KUJO_BIN" run scripts/spec_gate.kujo
"$KUJO_BIN" run scripts/perf_gate.kujo
"$KUJO_BIN" run scripts/scale_perf_gate.kujo
(cd ../eval && "$KUJO_BIN" run main.kujo --interpreter run "$TRIBUNAL_HOME/tests/tribunal_eval.json")
```

The offline gates exercise 45 Kujo source files, 228 assertions across four suites, 24 executable schemas, signing/tamper/recovery, authorization, governance, encrypted bundles, provenance rollback, bounded authenticated stores, audit reports, telemetry/dashboard isolation, PackWrite, RunLedger, CaseFile, the AI SDK fixture, Spec, Concord, ten Eval checks, and two performance gates. See [Contributing](CONTRIBUTING.md).

## Repository layout

Application logic lives under [`src/`](src/). The only root Kujo files are the thin runtime entrypoint [`tribunal.kujo`](tribunal.kujo) and the Spec contract [`tribunal.spec.yml`](tribunal.spec.yml). `kujo.toml`, `VERSION`, the license, security policy, contribution guide, changelog, and README remain at the root because they are conventional project/release metadata. Runtime bridges are under `src/bridges/`, executable gates under `scripts/`, schemas under `schemas/`, fixtures under `tests/`, and user examples under `examples/`.

## Project map

- [Architecture](docs/architecture.md)
- [Configuration](docs/configuration.md)
- [Operations](docs/OPERATIONS.md)
- [Enterprise readiness](docs/ENTERPRISE_READINESS.md)
- [Threat model](docs/THREAT_MODEL.md)
- [Authorization](docs/AUTHORIZATION.md)
- [Artifact stores and bundles](docs/ARTIFACT_STORES.md)
- [Vault Transit certification](docs/VAULT_TRANSIT.md)
- [HTTP store certification](docs/HTTP_STORE_CERTIFICATION.md)
- [Evidence encryption](docs/EVIDENCE_ENCRYPTION.md)
- [Signed governance provenance](docs/PROVENANCE.md)
- [Cryptographic migration](docs/CRYPTOGRAPHIC_MIGRATION.md)
- [Release evidence](docs/RELEASE_EVIDENCE.md)
- [Read-only UI evaluation](docs/UI_EVALUATION.md)
- [Integrations](docs/integrations.md)
- [Completed v0.4 enterprise review](docs/COMPLETED_V0.4_REVIEW.md)
- [Current next-session review](docs/NEXT_SESSION_REVIEW.md)
- [v0.4 deployment handoff](docs/NEXT_SESSION_HANDOFF.md)
- [Changelog](CHANGELOG.md)

## Boundaries

JSON is currently the only config format. Replay verifies recorded evidence and intentionally does not rerun models. Tribunal publishes provider contracts for HSM/KMS and HTTP immutable stores; each deployment must supply and certify its authenticated adapter. The dashboard is an offline projection by design. No network API or hosted UI is exposed until transport authentication, tenant isolation, rate limiting, and deployment authorization are selected and threat-modeled.
