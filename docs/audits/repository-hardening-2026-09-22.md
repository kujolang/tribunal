# Tribunal repository hardening — 2026-09-22

## Repository and scope

- Repository: `kujolang/tribunal`; branch `main`.
- Starting SHA: `936c5e99b689e1675845fe23ef25ba8d6b9f6efc`, clean checkout.
- Ending implementation SHA: `5d7018f5d0cbdd35bebf1cd8afa56a22999ffde3`. This audit record is a subsequent documentation commit; find its containing SHA with `git log -1 -- docs/audits/repository-hardening-2026-09-22.md`.
- Purpose: local/operator-controlled, adversarial decision hearings with immutable evidence and stable CLI/library contracts.
- Runtime: `/Users/robertdevore/2026/Kujolang/kujo-repos/kujo/target/release/kujo`; binary SHA-256 `eeea79362ea8c89cb3e8fe0b34984a8588bc57a9eea829cd902e91d16d9a4787`. Adjacent checkout: `7f4a288587710003c60869c016c8f4d97ca3b8af`; this identifies the checkout, not a build attestation. The release pin remains `9b77dce592047121cb71066629836ad89252f3ce`.
- Integrations: Kujo runtime, AI SDK, PackWrite, RunLedger, CaseFile, Concord, Spec, Eval, Kennel and Workcell. Watchdog remains explicitly excluded by the matrix. No sibling implementation was modified.
- Evidence root: `.tribunal/audit-20260922/`. Existing sealed `tribunal-runs/` evidence was not edited. Disposable regression fixtures intentionally alter their own evidence to exercise rejection.

This is an internal engineering pass, not the commissioned independent security review or a hosted/enterprise certification. No live provider credentials, public release, tag, signing service, branch protection change or force-push was used. Suites generate disposable synthetic local signing keys.

## Baseline

The baseline ran 96 commands before application edits: version, doctor, every tracked Kujo source check, five existing suites and fourteen offline gates. Main tests passed 136/136, CLI 56/56, enterprise 99/99 and property tests 22/22. Three baseline failures were preserved:

1. Hardening suite: 33 passed, one independent-process index workload failed. Its original output did not include child diagnostics. An unchanged index implementation passed the subsequent 34/34 run; the test now prints child diagnostics when it fails. The root cause is unproven; no timeout, workload or assertion was weakened.
2. Load/chaos: 500 successful acquisitions and 500 contentions, but 13 cycles/second fell below the unchanged 15-cycle floor. Recovery was 21 ms, below the 5-second budget.
3. Integration matrix: eleven adjacent revision mismatches, including the excluded Watchdog entry. Pins were not changed to hide local drift.

A new focused reproduction against baseline source failed eight assertions and passed three. Failures proved context secret persistence, rejected model-body persistence, successful partial statistics/library listing, and late encrypted metadata checks. The committed suite expands this to 17 passing checks, including a Python standard-library raw HTTP harness with nine store assertions and a synchronized telemetry continuation failure.

## Findings

| ID | Priority | Area | Finding / evidence | Action | Status |
|---|---|---|---|---|---|
| A01 | P1 | Secret boundary | PackWrite context containing an organization-pattern secret completed and appeared in artifacts. | Run the configured scanner on constructed context before persistence or model calls. | Fixed; regression |
| A02 | P1 | Failure evidence | `invoke_blind_job` serialized the rejected raw response into a stopped-run reason; generic redaction missed the organization token. | Propagate the diagnostic only; screen stopped-run reasons. | Fixed; regression |
| A03 | P1 | HTTP paths | Reference-store reads/cleanup omitted run/version validation; uploads accepted arbitrary 64-character versions. | Apply safe run IDs and lowercase SHA-256 checks before filesystem access on all routes. | Fixed; raw-path regression |
| A04 | P1 | Encrypted resources | Decryption preceded aggregate/count/unique-inventory validation; integrity-only ciphertext hashing was unbounded. | Shared envelope/metadata preflight and ciphertext bound before hashing. | Fixed; regression |
| A05 | P1 | Secondary readers | Contracts and receipt analytics bypassed existing size/symlink limits. | Check JSON at 4 MiB and event logs at 64 MiB before reads. | Fixed; oversized/symlink regression |
| A06 | P1 | Failure semantics | Statistics discarded failed-page status; library listing and HTTP telemetry could report success after failure. | Propagate errors, retain the repair diagnostic and pages-sent count; use runtime exit 1 for corrupt CLI listing. | Fixed; corrupt-index and synchronized collector regression |
| A07 | P2 | Repeated I/O | Event contract validation loaded and parsed the same schema once per event. | Load once per validation call; retain every event check and detailed result. | Fixed; benchmark and full schema suite |
| A08 | P2 | Diagnostics/docs | Failed concurrency test hid child output; performance docs said two seconds while the gate allowed three. | Emit child failure evidence and document the actual threshold. | Fixed |
| A09 | P1 | Replay contract | Local idempotency key is not forwarded by the model/SDK bridge; no SDK option was found at the pin or current checkout. | Explicitly disclaim provider deduplication; retain a cross-repository follow-up. | Open; additive SDK design required |
| A10 | Needs more evidence | Store concurrency | Local `publish_local` checks the expected version before export and later writes the index without publication coordination. | Document serialized per-run publication; capture the potential lost-history race for a controlled reproduction. | Open hypothesis; no two-writer reproduction |
| A11 | P2 | Release evidence | Local integration revisions differ from pins; required Workcell image is absent. | Preserve blocker receipts and local substitutes without certification claims. | External/environment blocker |

The raw traversal request returned HTTP 500 on the baseline runtime and disturbed subsequent valid cleanup; the other-tenant sentinel survived. Source tracing establishes the missing boundary guard, but this test does **not** prove complete cross-tenant deletion. The fixed adapter returns 400 before path access, preserves the sentinel and accepts valid cleanup. Authentication remains required.

## Changes implemented

- **Context and model failures:** `src/tribunal.kujo` screens common constructed context, passes only the failure message across the blind worker boundary, and screens stopped reasons. This fixes the control at the shared ingestion/persistence boundary rather than relying on a particular context provider. Accepted prompts, seat isolation and all hearing stages remain intact.
- **Encrypted metadata:** `src/bundles.kujo` validates count, unique inventory, metadata identity, descriptor byte/hash agreement and the existing 1 GiB aggregate before recipient-key access. Integrity-only checks enforce the existing import ciphertext ceiling of 65 MiB before hashing. Descriptor-free legacy bundles remain accepted; malformed inventories do not.
- **Artifact readers and schema work:** `src/contracts.kujo` uses existing safe-file checks and a call-local parsed event schema. `src/analytics.kujo` refuses unsafe/oversized receipts. No cross-call cache or invalidation policy is introduced; later validation calls see schema changes.
- **Failure propagation:** `src/analytics.kujo`, `src/telemetry.kujo`, `src/lib.kujo` and `src/cli.kujo` retain page failure status. A collector that invalidates the continuation shard after its first POST now receives exactly one page and the command exits 1 with `pagesSent: 1` and the index-repair diagnostic. Partial metrics are never labeled complete.
- **Reference adapter:** `src/bridges/immutable_http_store_server.kujo` applies the same run/version boundary to writes, reads, chunk reads and cleanup.
- **Regressions:** `tests/audit_regressions.kujo`, `tests/fixtures/http_boundaries.py`, an oversized-ciphertext enterprise regression, and child diagnostics in the existing concurrency suite. Compatibility/release workflows, Eval and platform receipt inventory include the new suite. Python 3 was already required by release/archive tooling; the new helper uses only its standard library and loopback services.
- **Documentation:** README, contributor instructions, threat model, artifact-store contracts, performance contract and changelog describe changed behavior and remaining assumptions.

## Performance and efficiency

Local observations on a shared macOS host; three contract-validation samples and single gate samples are not statistical platform guarantees.

| Dimension / workload | Before | After | Interpretation |
|---|---:|---:|---|
| Validate contracts for 1,000 valid events | 2,191 / 1,365 / 1,199 ms | 311 / 436 / 355 ms | Same fixture and all validation results accepted; median 1,365 → 355 ms |
| Event-schema filesystem reads/parses per 1,000 events | 1,000 | 1 | Source-supported operation count; no persistent cache |
| Strategic-five mock hearing | 2,689 ms | 1,857 ms | Both below 15,000 ms; host variation prevents attributing the difference solely to this patch |
| Large-docket hearing | 39,453 ms | 31,353 ms | Both below unchanged 45,000 ms |
| Large fixture artifact bytes | 7,800,199 | 7,800,199 | Accepted hearing output retained |
| Large fixture context bytes | 512,220 | 512,220 | No prompt/context compression in this pass |
| 250-run index, two pages | 867 ms | 817 ms | Both below 3,000 ms; index algorithm unchanged |
| Index bytes | 163,084 | 163,084 | Unchanged |
| Declared runtime dependencies | 0 | 0 | External Kujo integrations retained |

The benchmark source and logs are retained under `.tribunal/audit-20260922/contracts-bench.kujo`, `contracts-before.log` and `contracts-after.log`. It constructs valid disposable evidence, replaces its event log with 1,000 valid events, and times three calls to `validate_run_contracts`; it measures contract validation, not integrity verification.

No new tokenizer, model-token, RSS, binary-size or build-speed claim is made. Existing compact prompts remain unchanged; safety checks were added rather than removing context. Rejected model payloads no longer expand persisted diagnostics, but no byte/token reduction is claimed without a controlled size measurement. Verbose command logs remain local; committed receipts carry exact commands, exits, durations and log digests.

## Coverage, retained design and security

The parent and independent offline reviewer inspected every application/bridge module, entrypoint and launcher, public CLI/library/config surfaces, storage/index/locks, signatures/provenance, governance, bundles/stores, context/model boundaries, integrations, rendering, analytics/telemetry and policy/catalog paths. Supporting review covered tests/fixtures, schemas, package manifests, CI, release/archive tooling and the required operational documents. Existing suites exercised the supported success/failure paths.

The security workflow produced canonical manifest/findings/coverage artifacts and a generated report under `.tribunal/audit-20260922/security/`. It retains baseline source evidence and marks every fixed issue with the implementation revision. Coverage honestly distinguishes complete application-source review from non-exhaustive line-by-line review of every supporting fixture/release script; it is not an exhaustive independent security certification.

| Audit phases | Disposition |
|---|---|
| Architecture/public contracts (0, 10) | Retained local-first CLI, API 1.0, versioned evidence, SDK ownership and trusted embedding boundary. |
| Baselines/tests/verification (1, 12, 18) | Pre-existing failures preserved separately; eight failing reproductions; full exact-implementation rerun and release extras. |
| Complexity/dead weight (2, 16) | Removed repeated schema loading and raw failure-envelope serialization. No public export, legacy format, chunk compatibility route or dependency was proven safe to remove. |
| Runtime/resources (3, 4) | Measured schema reuse; early encrypted aggregate checks and secondary-reader bounds. Existing finite retries, subprocess caps and transfer chunks retained. |
| Token/output/agent UX (5, 6, 15) | No repeated context removed without proof. Concise failures retain actionable repair information, and focused regression/receipt paths make the changes inspectable. |
| Errors/security (7, 8) | Fixed common ingestion/read/projection boundaries; tested rejection, oversized files, symlinks and raw HTTP paths. |
| Concurrency/state (9) | Existing index exclusion/dirty recovery retained and tested. Collector failure injection synchronizes on POST. Local store publication still needs a two-writer experiment. |
| Dependencies/CI (11, 13) | No package dependency added. Runtime/integration and most action revisions remain pinned; mutable Rust toolchain policy was not changed without compiler compatibility evidence. New deterministic behavioral ratchets join existing CI. |
| Documentation/implementation (14, 17) | Updated affected contracts, actual performance threshold and replay/publication limitations; no cosmetic rewrite. |

Remaining trust assumptions include administrator-controlled filesystem roots, separately trusted policy/key distribution, provider-side capabilities, and deployment-specific storage/identity/network certification. Existing ambient operational environment allowlists and fixed argv subprocess calls remain intact. New Python fixtures never use live provider credentials or external network endpoints.

## Compatibility

- **Public APIs:** signatures and API version unchanged. `list_hearings` now returns its existing error envelope on failed pagination or index access instead of false success.
- **CLI:** commands/options unchanged. Corrupt index listing uses the existing runtime-failure code 1 rather than a misleading missing-cursor usage error. Genuine missing cursors remain usage errors. Failed statistics/telemetry now fail visibly.
- **File formats/schemas:** unchanged; no historical evidence migration or rewrite. Valid legacy descriptor-free bundles and supported signature formats still pass enterprise tests.
- **Configuration/environment:** no new field or variable. Organization patterns now apply to constructed context and stopped diagnostics as intended.
- **External consumers:** consumers relying on malformed metadata, unsafe HTTP route values or successful partial reports must correct their inputs/error handling. Valid happy-path contracts are retained. Python 3 is additionally used by offline regression tests, not by application execution.

## Cross-repository follow-ups and remaining work

- **P1 — AI SDK replay contract:** define an additive idempotency option, then test provider-specific forwarding and deduplication. Current Tribunal does not require that change for offline/local use, and compatibility must not invent a provider guarantee. Local keys alone do not prevent repeated charges.
- **Needs more evidence — local immutable publication:** reproduce two concurrent different-version writers before choosing a store-level transaction/locking protocol. Serialize publication operationally; no assertion of a demonstrated race exploit.
- **P2 — release environment:** reproduce against the pinned integration matrix and provision the required Workcell image. Do not repin adjacent repositories or weaken gates merely to make this checkout pass.
- **Needs more evidence — baseline host sensitivity:** one index concurrency failure and one load-throughput failure passed later without changes to their implementation, workload or thresholds. Root cause is not established; improved child diagnostics preserve future evidence.
- **Needs more evidence — HTTP transport bounds:** metadata consumers validate bodies after `http_request` returns. A runtime-level receive-bound review is required before claiming constant-memory metadata reception; file upload/download paths already use bounded streaming primitives.
- **Not worth changing:** stable legacy formats/routes, public exports, provider delegation, deterministic compact prompt serialization and the zero-dependency package surface.
- **P0/P3:** no supported P0 finding or cosmetic P3 work admitted.

## Verification receipt

See the committed [machine-readable receipt](repository-hardening-2026-09-22-receipt.json) for every command, exit, timing, log path and digest. Required command forms used the absolute runtime identified above:

```sh
./bin/tribunal version
./bin/tribunal doctor --json
"$KUJO_BIN" check <each tracked .kujo file>
"$KUJO_BIN" run tests/tribunal_tests.kujo --interpreter
"$KUJO_BIN" run tests/cli_integration.kujo --interpreter
"$KUJO_BIN" run tests/enterprise_tests.kujo --interpreter
"$KUJO_BIN" run tests/property_tests.kujo --interpreter
"$KUJO_BIN" run tests/hardening_tests.kujo --interpreter
"$KUJO_BIN" run tests/audit_regressions.kujo --interpreter
"$KUJO_BIN" run scripts/<gate>_gate.kujo --interpreter
git diff --check
```

The fourteen gates were `schema`, `drift`, `spec`, `perf`, `scale_perf`, `index_perf`, `load_chaos`, `adversarial`, `dashboard_accessibility`, `security_review`, `integration_matrix`, `gallery`, `v1_compatibility`, and `docs_link`.

Exact implementation run: **97 of 98 commands passed**. All six suites passed: **136 main, 56 CLI, 100 enterprise, 22 property, 34 hardening, 17 audit checks**. Only the pre-existing integration revision gate failed. The runtime still emits known fixture/type-check warnings even on passing suites; logs preserve them.

### Release extras and blockers

The clean implementation commit passed Kennel validation, deterministic archive creation/rebuild and extracted-archive smoke (version, doctor, mock hearing and expected failing path). Eval passed **19/20**; its only failure was the same eleven integration revision mismatches. Archive: **342,145 bytes**, SHA-256 `e9b627fce645ad82ba900ac99b2a5cb165168eae1dcf9b47b00ded88f5dfb39c`; rebuild matched exactly. The archive receipt's `runtimeRevision` is the configured release pin, not a build attestation for the supplied runtime binary. These artifacts are local proof and were not published.

The required Workcell image `kujolang/workcell-kujo:tribunal-v1.0.0-9b77dce` was absent (`docker image inspect`, exit 1); `workcell-blocker.log` preserves the daemon response. The full local suites, release gates and archive smoke are the closest available equivalent proof. Container and pinned-environment certification remain blocked.

An initial release-extra run included an uncommitted audit draft whose linked receipt did not yet exist. It produced an additional documentation-link failure and an archive unsuitable as exact-commit evidence. Those receipts are retained as superseded; the draft was removed before the clean implementation rerun above. The subsequent documentation commit is checked separately for links and whitespace; application verification and archive identity refer exactly to the implementation SHA. Documentation checks passed: 90 local links across 46 Markdown files, and `git diff --check`.

## Durable handoff and unresolved findings

- **Strata:** saved one handoff in Agent Notes, `6473d10d-8a00-463e-8f72-77eac2db9c58` ("Session Memory · Tribunal · Evidence boundary hardening · 2026-09-22"). It contains this milestone's evidence pointers, current state, timeline, release blockers and exact next starting point. Deduplication found prior September 5 episodes but no matching delta; those historical notes were retained. No redundant atomic notes or separate state copy were created; no merges, supersessions, failed or pending writes. Exact-ID retrieval and conceptual search `Tribunal September 22 evidence boundaries` both returned the saved note.
- **SignalBox provider replay:** capture `cap_349cc3e2-3968-447d-bb2b-ede670475bc6`, signal `sig_7d3cfdee-c99b-431d-8e9e-0bec5bb8bc10`. Requests human review of a supported cross-repository idempotency contract.
- **SignalBox local publication:** capture `cap_afa84a85-0b23-437d-9031-04d756516c8f`. Records a code-supported hypothesis requiring a two-writer reproducer; no Signal created pending evidence.
- **Deduplication:** skipped existing pin-drift capture `cap_b61594a7-c546-4ceb-a4d1-74721d4f3d45` / signal `sig_d0870233-3b96-4dec-90ad-59c2870ce992`. Rejected completed fixes, routine verification and implementation recaps as capture candidates. No downstream dispositions or handoffs were stored in SignalBox.
- **Retrieval:** both new Captures and the new Signal passed exact-ID reads; concept searches `idempotency` and `serialized publication` returned their corresponding items. Recall the Strata episode for the consolidated next starting point.


## PR merge preparation follow-up

Hosted macOS exposed a timeout in the new HTTP test harness after the nine raw-store checks passed and before telemetry export began. The local baseline did not reproduce it. The collector used Python `HTTPServer`, whose bind method performs `socket.getfqdn` reverse DNS before returning. The loopback-only fixture now binds through `TCPServer` and uses its numeric bound address directly; an assertion rejects any DNS lookup during collector construction. The original timeout and all behavioral assertions remain unchanged. Stage output is unbuffered, readiness deadlines cover non-200 responses as well as connection errors, and timeout diagnostics serialize explicit process fields supported by the pinned runtime.

These test-only changes passed all 17 local audit checks. Original hosted logs are preserved in `.tribunal/audit-20260922/pr6-intel-job.log` and `pr6-arm-job.log`; the latter localizes the stall and exposes the pinned runtime's inability to JSON-serialize a `ProcessResult` struct directly. Final hosted results and merge provenance belong to the PR and the Strata handoff; the original exact-implementation receipts above are unchanged.
