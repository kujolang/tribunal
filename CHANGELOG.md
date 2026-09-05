# Changelog

## Unreleased — index coordination

- Serialize shared-index readers, writers and maintenance; refuse interrupted updates until explicit repair.
- Use exclusive POSIX directory claims for run locks, run creation and imports; Kujo recursive directory creation does not establish ownership.
- Add independent-process concurrency and interrupted-publication regressions.

## Unreleased — repository hardening

- Reject failed SDK/PackWrite subprocesses even when stdout claims success; keep child working directories isolated.
- Fully redact Bearer/Basic authorization values and correct filesystem-root containment.
- Validate cached index manifests, cross-shard uniqueness, and bundle descriptor identity, chunk counts, and aggregate transfer sizes; create import destinations exclusively.
- Use native artifact hashing and compact model-visible JSON without changing persisted evidence schemas.
- Add offline hardening regressions to compatibility and release CI.

## Unreleased

### Fixed

- Fail closed on subprocesses that emit plausible signing or context-connector JSON but exit unsuccessfully.
- Preserve distinct primary/recovery encryption recipients, validate encrypted-bundle signature structure and payload binding, and retain v1.0 signature compatibility.
- Reject symlink-parent aliases into sealed storage across external output surfaces and equivalent provenance output/anchor paths.
- Reject malformed Vault URLs and case-variant compressed-response headers, and preserve unexpected stale-lock state for operator reconciliation instead of crashing recovery.

## 1.0.0 - 2026-08-08

Tribunal 1.0.0 defines the stable product as a local or operator-controlled decision-evidence engine. It does not certify every hosted, shared-filesystem, identity-provider, custody, remote-storage, regulated, or enterprise deployment; those profiles require target-environment evidence and approval.

### Stable features and contracts

- Made release-evidence signing optional while retaining mandatory full gates, reproducible archive creation, checksums, SBOM, provenance, smoke verification, and release receipts.
- Declared the documented CLI commands, exit meanings, Kujo library API 1.x, configuration contract, evidence records, signed bundle import/export, and inspection of supported legacy signature envelopes as the v1 compatibility surface.
- Enabled bounded, isolated async blind-seat execution with stable persistence order, provider limits, cancellation hooks, and per-process SDK working directories.
- Added runtime-backed same-device boundaries plus atomic, handle-verified 0600 private-key creation while retaining managed signing guidance.
- Replaced whole-value portable-bundle encryption with framed constant-memory AES-256-GCM and authenticated truncation/order checks.
- Replaced remote base64 chunk expansion with bounded binary HTTP file streaming and digest-bound atomic downloads.
- Added deterministic archives, checksums, SPDX SBOM, in-toto/SLSA-style provenance, install-from-archive smoke coverage, compatibility fixtures, local Markdown-link validation, Workcell proof, platform receipts, and pinned ecosystem gates.

### Compatibility and upgrade guidance

- Product and CLI version are 1.0.0. The Kujo library API remains 1.0.0, and evidence, event, signature, bundle, encryption, provenance, and other schema versions remain independent contracts rather than inheriting the product version.
- Existing v0.7 run directories remain inspectable when their schema is supported and their exact file set and digests pass verification. Signature envelopes 1.0.0, 1.1.0, and provider envelope 1.2.0 remain verifiable; newer framed encrypted bundles do not rewrite legacy ciphertext.
- Back up run storage, trust/governance records, policies, keys, and indexes before upgrading. Pin Tribunal and the Kujo runtime together, run `doctor`, `index-check`, compatibility/schema gates, and verify representative historical signed runs. Rollback never authorizes changing sealed evidence.

### Security boundaries and known limitations

- The independent security review is commissioned but not complete. The repository security-review gate validates the review register and regression-fixture rule; it is not an external assessment.
- Mock/offline evidence proves deterministic local behavior, not live-provider correctness or the merits of a decision. Managed signing, trust-policy custody, encrypted storage, identity proofing, shared-filesystem semantics, remote-store behavior, telemetry hosting, backup/recovery, and organizational controls remain deployment responsibilities.
- No public network API or hosted multi-tenant service is included. Windows and unmeasured architectures are unsupported. Reference Vault/HTTP-store fixtures and Workcell runs are bounded proofs, not universal deployment certification.

## 0.7.0 - 2026-07-12

- Replaced inventory rescans with an atomically written, sharded persistent run index plus verify, repair, rebuild, and cursor-bounded CLI/library contracts.
- Made analytics, telemetry, dashboard, and bulk verification page-bounded; added reproducible index, load, contention, chaos-recovery, streaming-transfer, and multi-host certification gates with explicit budgets.
- Evaluated blind-seat concurrency with isolation, deterministic persistence, provider bounds, cancellation evidence, and a fail-closed Kujo runtime gate for the current nested-runtime defect.
- Added streamed bundle copies and a 1 MiB chunked remote artifact protocol with per-chunk idempotency, digests, request bounds, and final whole-file verification.
- Added signed custom panel catalogs, safe templates, permission boundaries, explicit checkpoints, stable idempotency keys, resumable stopped hearings, immutable lineage, compare/re-review workflows, and the stable Kujo library API 1.0.
- Added provenance-bound context connectors, portable decision-packet templates, signed organization policy checks, canonical filesystem inspection, entropy/organization secret detection, malicious remote-response fixtures, and an independent security-review commission/register gate.
- Added a Kennel package, upgrade/rollback guide, six-example gallery, generated command/man/completion assets, operator recipes, an explicit no-service decision, and WCAG-oriented dashboard evaluation/gates.
- Added reproducible source archives, SPDX SBOM, in-toto/SLSA-style provenance, pinned Kujo runtime compatibility jobs, ecosystem integration matrices, release verification instructions, and privacy-preserving opt-in adoption measurement contracts.
- Published full-gate compatibility receipts for macOS x86_64 and Ubuntu Linux x86_64, made Spec/Eval gates portable across the measured runners, and kept unmeasured architectures explicitly unsupported.

## 0.6.0 - 2026-07-11

- Added a Kujo-only Vault Transit adapter with JWT workload identity, strict provider responses, bounded retry, denial/rotation tests, audit metadata, and a live certification harness.
- Required tenant-, region-, and token-bound authenticated HTTP artifact stores, added bounded retry and staging cleanup, and published a live isolation/failure/backup conformance harness.
- Added signed sequence provenance and external rollback anchors for policies, governance registries, deletion tombstones, and artifact-store indexes.
- Added AES-256-GCM portable evidence encryption, RSA-OAEP primary/recovery envelopes, authenticated import, independent integrity verification, and ciphertext-preserving recipient rotation.
- Defined fail-closed RSA-PSS and Ed25519 migration contracts while retaining verification compatibility for all existing RSA signature envelopes.
- Expanded the Kujo enterprise suite and executable schema gate, and documented the remaining deployment-certification boundary without overstating production evidence.
- Added a Kujo authenticated immutable HTTP reference service and preserved passing reference certifications for Vault Transit and the HTTP-store protocol with explicitly non-production scope.

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
