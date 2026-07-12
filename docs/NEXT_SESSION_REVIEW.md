# Next-session review — beyond v0.5.0

Tribunal v0.5.0 is a strong production-oriented local decision-evidence engine, but it is not universally enterprise-ready without deployment-specific identity, custody, storage, network, and operational proof. Work through this list without weakening Kujo-only execution, blind testimony, stop-the-line behavior, separate trust anchors, or sealed evidence immutability.

## P0 — deployment proof and cryptographic lifecycle

- [ ] Certify at least one real HSM/KMS adapter end to end with workload identity, denial/retry/rotation drills, audit evidence, and no exported private material.
- [ ] Certify one authenticated immutable HTTP store with tenant isolation, conditional-write races, partial uploads, corruption recovery, backup/restore, and regional failure evidence.
- [x] Add signed, rollback-resistant provenance for access policies, trust policies, governance registries, deletion tombstones, and artifact-store indexes.
- [x] Design evidence encryption at rest and in portable bundles with envelope keys, rotation, recovery, and legal-hold compatibility; keep integrity verification independent from confidentiality.
- [x] Define algorithm-agility and migration contracts beyond RSA-PKCS#1 v1.5, gated by Kujo runtime support and backward-compatible verification fixtures.

## P1 — performance and scale

- [ ] Replace repeated directory-wide inventory scans with a crash-safe persistent index plus rebuild/repair verification.
- [ ] Make stats, telemetry, dashboard, and bulk verification incremental and cursor-bounded so memory use is independent of total run count.
- [ ] Evaluate bounded parallel execution of blind seats while proving transcript isolation, deterministic persistence order, provider rate limits, and cancellation semantics.
- [ ] Stream large remote artifacts and bundles instead of materializing complete bodies in memory; publish byte, request-count, and disk-amplification budgets.
- [ ] Add sustained multi-process and multi-host load tests, lock contention metrics, chaos interruption, and recovery-time objectives.

## P1 — broader usefulness

- [ ] Add schema-validated custom panels and seats with signed configuration provenance, safe prompt templates, permission boundaries, and deterministic fixtures.
- [ ] Add resumable stopped/interrupted hearings with explicit stage checkpoints, idempotent model calls, and immutable lineage to the prior attempt.
- [ ] Add compare/re-review workflows that explain changes between two sealed rulings without rewriting either source record.
- [ ] Publish a stable Kujo library API for embedding Tribunal in other Kujo programs, alongside the CLI contract.
- [ ] Expand provider-neutral context connectors through a narrow plugin contract with source provenance, redaction, size limits, and no ambient credentials.
- [ ] Add portable decision-packet templates and optional organization policy checks without turning policy advice into hidden model behavior.

## P1 — security depth

- [ ] Add canonical filesystem-boundary helpers in Kujo and use them to test symlinked ancestor directories, Unicode normalization, case-folding, mount boundaries, and platform-specific path behavior.
- [ ] Add first-class restrictive file permissions for generated private keys when the Kujo runtime exposes a portable permission API; until then keep managed signing as the production recommendation.
- [ ] Expand secret detection with entropy-aware and configurable organization patterns while measuring false positives and ensuring detected values never enter logs.
- [ ] Add malicious provider, context-plugin, store, and telemetry servers to the offline adversarial corpus, including slow responses, truncation, decompression bombs, duplicate fields, and oversized headers.
- [ ] Commission an independent threat-model/code review and turn every accepted finding into a regression fixture.

## P2 — adoption and presentation

- [ ] Publish a Kennel package/install path, version compatibility matrix, upgrade/rollback guide, and a one-command first-run experience.
- [ ] Add a polished example gallery covering architecture, security, launch, incident, procurement, and product decisions with expected mock artifacts.
- [ ] Add shell completions, generated command reference/man page, and copy-paste operator recipes for the most common workflows.
- [ ] Decide whether an authenticated read-only service is justified; if yes, approve transport authentication, tenant binding, rate limits, CSRF/CORS, TLS, secure headers, and audit contracts before implementation.
- [ ] Add accessibility and usability evaluation for the offline dashboard and any future hosted experience.

## P2 — release and ecosystem evidence

- [ ] Add reproducible release archives, SBOM/provenance attestations, dependency/runtime pinning, and signature verification instructions for downloaded artifacts.
- [ ] Run release gates on supported macOS/Linux architectures and publish measured compatibility rather than implying universal platform support.
- [ ] Add real integration certification matrices for Kujo AI SDK, PackWrite, RunLedger, CaseFile, Concord, Spec, Eval, and Kennel versions.
- [ ] Measure onboarding conversion from Tribunal to Kujo with privacy-preserving, opt-in documentation analytics rather than runtime telemetry.

## Exit criteria

- A concrete deployment profile, supported-platform matrix, and explicit non-goals are published.
- New public contracts have executable schemas, negative tests, migration notes, and versioned fixtures.
- Security work includes threat-model updates and adversarial regression evidence.
- Performance work includes reproducible corpus sizes, latency/throughput/memory/disk budgets, and before/after results.
- All Kujo checks, unit/integration/property suites, 18+ schema gates, Concord, strict Spec, Eval, performance, scale, and doctor gates pass.
- The root remains limited to conventional project metadata plus thin `tribunal.kujo` and `tribunal.spec.yml` entry contracts; application logic remains under `src/`.
- The completed work is committed, pushed, documented in the changelog, and handed off with no unrecorded production claim.
