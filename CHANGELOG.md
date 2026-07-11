# Changelog

## Unreleased

## 0.5.0 - 2026-07-11

- Added `tribunal audit` to combine artifact integrity, signature/trust, and complete contract validation in one machine-readable report.
- Hardened run IDs and artifact paths against hidden operational namespace access, URL metacharacters, control characters, traversal, and oversized segments.
- Made run-directory creation exclusive and lock acquisition non-stealing; stale locks now require the explicit recovery command.
- Added structural and aggregate bounds for integrity manifests, bundles, policies, signing-provider configs, keys, and remote artifact-store metadata.
- Required HTTPS for non-loopback artifact-store and telemetry endpoints and prevented keys, integrations, dashboards, telemetry, bundles, and archives from writing into sealed evidence storage.
- Added pre-deletion tombstones, legal-hold serialization, safer symlink handling, output overwrite protection, and expanded adversarial regression coverage.
- Clarified the honest production-readiness boundary, cleaned the repository map, and published a new prioritized next-session review.

## 0.4.0 - 2026-07-11

- Added default-deny identity/role authorization and trusted-key lifecycle policies with rotation, revocation, validity, and allowed-target enforcement.
- Added an external Kujo HSM/KMS signing-provider contract, federated workload identity allowlist, and v1.2 signer provenance without private key exposure.
- Added signed bundle export/import and conditional, immutable, versioned local/HTTP artifact-store providers.
- Added atomic per-run locking, stale-owner recovery, seal transaction journals, and interrupted-seal rollback.
- Added sealed retention metadata, post-seal legal-hold history, policy-driven whole-run deletion, and external tombstones.
- Added external JSONL/HTTP telemetry, cursor pagination, and an offline CSP-restricted dashboard.
- Upgraded contract validation to 17 executable Kujo JSON Schemas and added strict provider-response types/ranges plus deterministic property corpora.
- Added a large strategic-five/inventory benchmark with published latency/memory budgets and tag CI publication of externally signed evidence.
- Completed every v0.3.0 next-session review item and published a new deployment-adapter handoff.

## 0.3.0 - 2026-07-11

- Hardened artifact storage and sealing against traversal, symbolic links, oversized input, and character/byte length confusion.
- Bound signature metadata into the signed v1.1 payload while retaining v1.0 verification compatibility; made 4096-bit RSA the CLI default.
- Added strict config and CLI contracts, bounded docket/context/model/process resources, provider subprocess environment isolation, expanded secret detection, and model-output safety checks.
- Added `validate`, `doctor`, `stats`, filtered/JSON `list`, JSON catalog/show output, and strict signature requirements for verify/replay.
- Made RunLedger and CaseFile ingestion idempotent and redacted downstream process errors.
- Moved bridge code under `src/bridges`, moved example config under `examples`, and added operations, security, enterprise-readiness, contribution, and next-session guidance.
- Expanded validation to 91 core assertions, 25 CLI assertions, nine schemas, and a deterministic local performance budget.

## 0.2.0 - 2026-07-10

- Reimplemented the CLI, hearing engine, model boundary, context construction, persistence, integrity, signing, ingestion, and validation gates in Kujo.
- Preserved the completed TypeScript implementation on the pushed `typescript` branch.
- Replaced Node/npm build and test dependencies with Kujo runtime checks, 73 core assertions, 14 CLI integration assertions, a Kujo schema gate, Concord, Spec, and Eval.
- Replaced Ed25519 sealing with Kujo-native RSA-PKCS#1 v1.5 SHA-256 signing and added a native `keys` command.
- Preserved SDK-owned preference resolution, real RunLedger/CaseFile ingestion, PackWrite context, full artifact hashing, and sealed-run immutability.

## 0.1.0 - 2026-07-10

- Added the Tribunal MVP with offline deterministic review, explicit staged hearings, three panel presets, five seat contracts, stop-the-line records, CLI replay/export, and Kujo AI SDK live bridge.
