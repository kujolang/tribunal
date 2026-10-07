# Tribunal

[![Version](https://img.shields.io/badge/version-1.0.2-black)](https://github.com/kujolang/tribunal/releases/tag/v1.0.2)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)
[![Built with Kujo](https://img.shields.io/badge/built%20with-Kujo-white.svg)](https://github.com/kujolang/kujo)

Tribunal reviews proposals through structured hearings. Independent specialists examine a proposal, question each other's findings, look for fatal flaws, and produce a ruling with a decision packet you can act on.

Each run keeps the prompts, testimony, ruling, and supporting evidence. You can inspect and replay the record, check its SHA-256 manifest, and optionally sign it with RSA.

The application runs locally and is written in [Kujo](https://github.com/kujolang/kujo). It uses Kujo for process isolation, HTTP, cryptography, JSON Schema validation, and filesystem controls. Python 3 helpers normalize release ZIPs and test raw HTTP requests. The application has no Node, npm, TypeScript, JavaScript, or provider-SDK runtime dependency. The earlier TypeScript implementation remains on the `typescript` branch.

See the [1.0.2 release and verification receipt](https://github.com/kujolang/tribunal/releases/tag/v1.0.2) and [CI results](https://github.com/kujolang/tribunal/actions/workflows/compatibility.yml).

## Production-readiness statement

Tribunal 1.0.2 is a patch release for local or operator-controlled decision evidence. The stable v1 contract covers the documented CLI, Kujo library API, configuration, local evidence, inspection, and portable bundles on platforms with passing release receipts.

Each deployment must certify its own identity, signing, policy custody, storage, filesystem, live-provider, backup, and network controls, and obtain organizational approval. The independent security review has been commissioned but is not complete.

| Use case | Status |
| --- | --- |
| Offline mock review and sealed local evidence | ready and fully regression-tested |
| Single-operator local production use | ready with documented filesystem, key, backup, and verification controls |
| Shared service or regulated deployment | application contracts and reference harnesses are available; deployment adapters, target receipts, independent review, and organizational controls require certification |
| Public hosted service | intentionally not provided; transport authentication and tenancy must be designed first |

See [Enterprise readiness](docs/ENTERPRISE_READINESS.md), [Threat model](docs/THREAT_MODEL.md), and the [release checklist](docs/launch-checklist.md) before making a deployment claim.

## Why Tribunal

Use Tribunal when a decision deserves more than one model response:

- architecture and build-versus-buy decisions;
- production launches, migrations, and incident follow-ups;
- security, privacy, and operational risk reviews;
- product bets and roadmap tradeoffs;
- agent-generated plans that need explicit evidence and stop conditions.

Choose from three panels: `executioner-only`, `fast-two-model`, or `strategic-five`. The five seats—Judge, Executioner, Builder, Operator, and Market Lens—each have defined responsibilities, limits, output contracts, and model preferences that do not depend on a particular provider.

## Quick start

```bash
export KUJO_BIN=../kujo/target/release/kujo

./bin/tribunal version
./bin/tribunal doctor
./bin/tribunal validate examples/product-decision.md
./bin/tribunal review examples/product-decision.md --panel fast-two-model
./bin/tribunal list --status completed --limit 5
```

Use Kujo 1.8.0. Put `kujo` on `PATH` or set `KUJO_BIN`/`KUJO` to its executable. The launcher runs `kujo run tribunal.kujo` from this repository. Mock mode is the default: it runs offline, needs no credentials, and produces deterministic results.

The tagged 1.0.2 source passed [Kujo 1.8.0 verification](docs/compatibility/kujo-1.8.0-2026-10-07.json) on macOS Intel. The original three-platform release checks used Kujo 1.5.0. To reproduce those receipts, use the exact runtime revision in the [integration matrix](docs/INTEGRATION_MATRIX.md).

Tribunal is a validated [Kennel package](kennel.toml) and provides a stable [Kujo library API](docs/LIBRARY_API.md). See [installation and rollback](docs/INSTALLATION.md) for setup options and the [example gallery](examples/gallery/README.md) for six common decision types.

Platform support requires passing release receipts; see [platform support](docs/PLATFORM_SUPPORT.md). Windows is not supported.

If startup fails:

1. Run `./bin/tribunal doctor --json` and confirm that `KUJO_BIN` is executable.
2. Check that any adjacent integrations match the pinned integration matrix.
3. Check that storage is writable, has no symlinks, and is separate from external output paths.

See [operations](docs/OPERATIONS.md) and [operator recipes](docs/RECIPES.md) for recovery steps.

## Version and compatibility boundaries

- Product version and CLI version are `1.0.2`; `tribunal version` is authoritative for the running checkout.
- The Kujo library API is independently versioned `1.0.0`. Compatible additions may occur within API 1.x; removing or repurposing public functions or envelope fields requires API 2.0.
- Evidence, event, signature, bundle, encryption, provenance, configuration, and other schema versions are independent contracts. Product releases do not change these versions just to match the product number.
- The supported v1 CLI commands, options, exit meanings, compatibility guarantees, and breaking-change policy are defined in [the v1 compatibility contract](docs/V1_COMPATIBILITY.md). Generated command details live in [the command reference](docs/COMMAND_REFERENCE.md).

## Command surface

```text
tribunal review <file> --panel <panel-name> [--mock|--live] [--private-key <pem> --public-key <pem>]
tribunal resume <stopped-run-id> [--private-key <pem> --public-key <pem>]
tribunal compare <base-run-id> <candidate-run-id> --output <prefix>
tribunal re-review <base-run-id> <file> --panel <panel-name> --output <prefix> [--mock|--live]
tribunal kill <file> [--mock|--live] [--private-key <pem> --public-key <pem>]
tribunal validate <file> [--json]
tribunal list [--status <status> --panel <panel> --limit <n> --cursor <run-id> --json]
tribunal show <run-id> [--json]
tribunal replay <run-id> [--public-key <pem> --require-signature]
tribunal keys --private-key <pem> --public-key <pem> [--bits 2048|4096]
tribunal seal <run-id> --private-key <pem> --public-key <pem>
tribunal verify <run-id> [--public-key <pem> --require-signature]
tribunal verify-bulk [--cursor <run-id> --limit <1-100> --public-key <pem> --require-signature]
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
tribunal telemetry-export [--collector jsonl|http --destination <path|url> --json]
tribunal dashboard-export --output <html> [--json]
tribunal legal-hold <run-id> --enable|--release --reason <text>
tribunal delete <run-id> --reason <text> [--force-expired]
tribunal provenance-sign <document> --kind <kind> --sequence <n> --private-key <pem> --public-key <pem> --output <json> --anchor <json> [--previous <json>]
tribunal provenance-verify <document> --provenance <json> --public-key <pem> --anchor <json>
tribunal locks-recover [--stale-after-ms <n> --json]
tribunal index-check [--json]
tribunal index-rebuild [--json]
tribunal index-repair [--json]
tribunal auth-check --permission <permission> [--json]
tribunal version
```

Exit codes are stable: `0` success, `1` runtime failure, `2` usage/configuration error or stopped hearing, and `3` integrity/authorization failure. Unknown, duplicate, missing-value, and conflicting options are rejected.

## Hearing and evidence

Every completed hearing records nine stages: docket opening, scope validation, context construction, blind first pass, cross-examination, Executioner kill pass, Judge ruling, decision packet, and durable persistence.

Each specialist first sees only the fixed proposal, context, and their seat contract. Tribunal records all blind responses before sharing peer testimony.

Runs are stored under `tribunal-runs/<run-id>/` by default:

```text
docket.md                 context.md
manifest.json             checkpoint.json
events.jsonl              policy-checks.json
prompts/                  testimony/
cross-examination.md      kill-pass.md
ruling.md                 decision-packet.md
record.json               receipt.json
artifact-manifest.json    signature.json (signed runs only)
```

`record.json` contains the complete machine-readable hearing. Markdown files provide readable accounts, and `events.jsonl` records events as the hearing proceeds. Replay rejects missing, changed, unexpected, oversized, unsafe, or symlinked artifacts.

## Live Kujo AI SDK

Tribunal runs the hearing. The adjacent Kujo AI SDK selects providers, makes network calls, handles retries, and normalizes metadata. Tribunal has no direct provider endpoint or SDK code.

```bash
export OPENAI_API_KEY="..."
./bin/tribunal review examples/product-decision.md --live \
  --provider openai \
  --ai-sdk-path ../ai-sdk \
  --kujo-bin ../kujo/target/release/kujo
```

The SDK subprocess receives only the selected provider credential and a small allowlist of operational environment variables. Tribunal rejects credentials in configuration and saved contracts. Use `--offline-fixture` to test the real SDK bridge without network access.

## Integrity and trusted handoff

Tribunal creates a SHA-256 manifest of the exact artifact bytes for every completed or stopped run. Optional signatures bind the manifest digest, run ID, algorithm, key fingerprint, and signing time in a versioned RSA-PKCS#1 v1.5 SHA-256 envelope.

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

Never commit private keys. For managed signing, `seal-provider` calls an external Kujo HSM/KMS adapter with an opaque key reference and federated workload identity. Private key material stays outside Tribunal.

The included Vault Transit adapter authenticates with AWS, Azure, GitHub Actions, or a generic workload-token file. It returns audit and key-version evidence. Its live conformance harness must pass before a deployment is certified. Separate, versioned trust policies enforce key status, validity, rotation, revocation, and target permissions.

Portable evidence supports streaming AES-256-GCM encryption with separate primary and recovery RSA-OAEP recipients. Each frame authenticates its order and length; an authenticated final frame detects truncation. Tribunal publishes the output atomically. You can verify signed manifest integrity without decrypting the evidence, and rotate recipient keys without rewriting the ciphertext.

Remote artifacts stream through binary request and response files. Receipts bind them to their digests, without base64 expansion. Use an organization-approved encrypted volume or managed encrypted filesystem for live run storage.

Signed runs can be ingested idempotently into Kujo RunLedger or CaseFile. The source run remains immutable; downstream receipts are kept outside its sealed evidence directory.

Use the combined audit command to verify production evidence:

```bash
./bin/tribunal audit <run-id> \
  --trust-policy ./trust-policy.json \
  --target audit \
  --require-signature \
  --json
```

The command succeeds only when artifact integrity, evidence contracts, the current trust policy, and the required signature all pass.

Optional PackWrite context enrichment is deterministic and redacted:

```bash
./bin/tribunal review examples/product-decision.md \
  --context-provider packwrite --packwrite-path ../packwrite
```

## Enterprise controls

Tribunal includes controls for access, storage, recovery, and audit. Each deployment still needs the certification described above.

### Identity and trust

- Default-deny service and user authorization, with identity and role permissions.
- External HSM/KMS signing contracts, v1.2 signer provenance, and a Vault Transit workload-identity adapter. A live harness checks denial, retries, rotation, and audit behavior.
- Trust policies for key lifecycle and allowed targets. The algorithm registry rejects unsupported algorithms and defines RSA-PSS and Ed25519 migration targets while preserving legacy RSA verification.
- Signed sequence chains and external rollback anchors for policies, governance, tombstones, and store indexes.

### Storage and recovery

- Signed bundle import/export and versioned local or HTTP stores with conditional publication. HTTP requests bind tenant and region, limit retries, and clean up staging files; a live harness checks failures and backup recovery.
- AES-256-GCM packet encryption with RSA-OAEP primary and recovery keys. Key rotation preserves ciphertext.
- Exclusive run creation, atomic per-run locks, explicit stale-writer recovery, and journals that roll back interrupted sealing. Normal lock acquisition never steals an existing lock.
- Immutable retention metadata, external legal holds, and whole-run deletion with a tombstone written before deletion begins.
- An atomic run index with 100-entry shards, verification, repair, and rebuild. Cursor-based limits bound analytics, telemetry, dashboards, and bulk verification.
- Bounded imports and large-hearing inventories, protected external-output paths, and HTTPS remote endpoints. Plain HTTP is limited to loopback adapter development.

### Hearings and audit

- Stable idempotency keys, explicit checkpoints, resumable stopped hearings, immutable lineage, and compare/re-review commands. Blind concurrency requires runtime evidence.
- Signed custom panel catalogs, prompt templates with safety checks, signed context connectors that work across providers, portable packet templates, and explicit signed organization-policy checks.
- JSON Schema checks for every emitted contract, provider output validation, and deterministic property tests.
- Filesystem inspection that resolves canonical paths, entropy-based and organization-defined secret checks, malicious remote-peer fixtures, and regression requirements for accepted independent-review findings.
- External JSONL/HTTP metrics and audit export, a combined audit command, and an authorized, read-only offline HTML dashboard with an accessibility gate.

### Development and releases

- A stable Kujo library API, Kennel package, generated shell completions, man page, command reference, and six-example gallery.
- Reproducible archives, SPDX SBOM, in-toto/SLSA-style provenance, pinned runtime/platform CI, tag publication, and an integration certification matrix.
- Opt-in adoption contracts that preserve privacy.

See [Security](SECURITY.md), [Operations](docs/OPERATIONS.md), and [Enterprise readiness](docs/ENTERPRISE_READINESS.md) before production adoption. Machine-readable contracts live in [`schemas/`](schemas/).

## Kujo-native development

```bash
export TRIBUNAL_HOME="$PWD"
export KUJO_BIN=../kujo/target/release/kujo

git ls-files -z '*.kujo' | while IFS= read -r -d '' file; do
  "$KUJO_BIN" check "$file" || exit $?
done
"$KUJO_BIN" run tests/tribunal_tests.kujo
"$KUJO_BIN" run tests/cli_integration.kujo
"$KUJO_BIN" run tests/enterprise_tests.kujo
"$KUJO_BIN" run tests/hardening_tests.kujo --interpreter
"$KUJO_BIN" run tests/audit_regressions.kujo --interpreter
"$KUJO_BIN" run tests/property_tests.kujo
"$KUJO_BIN" run scripts/schema_gate.kujo
"$KUJO_BIN" run scripts/drift_gate.kujo
"$KUJO_BIN" run scripts/spec_gate.kujo
"$KUJO_BIN" run scripts/perf_gate.kujo
"$KUJO_BIN" run scripts/scale_perf_gate.kujo
"$KUJO_BIN" run scripts/index_perf_gate.kujo
"$KUJO_BIN" run scripts/load_chaos_gate.kujo
"$KUJO_BIN" run scripts/adversarial_gate.kujo
"$KUJO_BIN" run scripts/dashboard_accessibility_gate.kujo
"$KUJO_BIN" run scripts/security_review_gate.kujo
"$KUJO_BIN" run scripts/integration_matrix_gate.kujo
"$KUJO_BIN" run scripts/gallery_gate.kujo
"$KUJO_BIN" run scripts/v1_compatibility_gate.kujo
"$KUJO_BIN" run scripts/docs_link_gate.kujo
(cd ../eval && "$KUJO_BIN" run main.kujo run "$TRIBUNAL_HOME/tests/tribunal_eval.json")
```

Check new, untracked Kujo files explicitly before staging them. The tracked inventory avoids recursively checking generated evidence and unpacked release copies.

The offline gates check source files, tests, schemas, security and recovery boundaries, integrations, accessibility, and performance budgets. They cover signing and tampering, authorization, governance, encrypted bundles, provenance rollback, stores, indexes, resumed hearings, custom panels and connectors, policy checks, and telemetry isolation. See [Contributing](CONTRIBUTING.md) for the full workflow.

## Repository layout

| Path | Contents |
| --- | --- |
| [`tribunal.kujo`](tribunal.kujo) | Runtime entrypoint |
| [`tribunal.spec.yml`](tribunal.spec.yml) | Spec contract |
| [`src/`](src/) | Application code, including runtime bridges in `src/bridges/` |
| [`scripts/`](scripts/) | Verification gates and release helpers |
| [`schemas/`](schemas/) | Machine-readable contracts |
| [`tests/`](tests/) | Tests and fixtures |
| [`examples/`](examples/) | Example decisions and workflows |
| [`docs/`](docs/) | Architecture, operations, and reference documentation |

Build configuration, version, license, and project guides live at the root.

## Project map

- [Architecture](docs/architecture.md)
- [Configuration](docs/configuration.md)
- [Operations](docs/OPERATIONS.md)
- [Enterprise readiness](docs/ENTERPRISE_READINESS.md)
- [Threat model](docs/THREAT_MODEL.md)
- [Authorization](docs/AUTHORIZATION.md)
- [Vault Transit certification](docs/VAULT_TRANSIT.md)
- [HTTP store certification](docs/HTTP_STORE_CERTIFICATION.md)
- [Artifact stores and encrypted evidence](docs/ARTIFACT_STORES.md)
- [Signed governance provenance](docs/PROVENANCE.md)
- [Cryptographic migration](docs/CRYPTOGRAPHIC_MIGRATION.md)
- [Release verification](docs/RELEASE_VERIFICATION.md)
- [Performance and scale](docs/PERFORMANCE_AND_SCALE.md)
- [Library API](docs/LIBRARY_API.md)
- [Installation and rollback](docs/INSTALLATION.md)
- [Platform support](docs/PLATFORM_SUPPORT.md)
- [Ecosystem integration matrix](docs/INTEGRATION_MATRIX.md)
- [Command reference](docs/COMMAND_REFERENCE.md)
- [v1 compatibility contract](docs/V1_COMPATIBILITY.md)
- [Operator recipes](docs/RECIPES.md)
- [Service decision](docs/SERVICE_DECISION.md)
- [Adoption measurement](docs/ADOPTION_MEASUREMENT.md)
- [Read-only UI evaluation](docs/UI_EVALUATION.md)
- [Integrations](docs/integrations.md)
- [Release checklist](docs/launch-checklist.md)
- [Changelog](CHANGELOG.md)

## Boundaries

Configuration uses JSON. Replay verifies recorded evidence without rerunning models. Each deployment must supply and certify authenticated adapters for its HSM/KMS and HTTP immutable stores.

The dashboard is an offline view of recorded evidence. Tribunal exposes no network API or hosted UI. Adding either requires transport authentication, tenant isolation, rate limits, deployment authorization, and a threat model for those controls.
