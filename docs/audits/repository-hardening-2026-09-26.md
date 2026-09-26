# Tribunal repository hardening — 2026-09-26

## Repository and evidence scope

- Repository: `kujolang/tribunal`, a local/operator-controlled decision-evidence engine with a stable CLI, Kujo embedding API and independently versioned sealed evidence.
- Starting branch/revision: clean `main`, `415b9de53d36e89bf8459b73f2e8cbc076a0a2f5` (September 22 work already merged).
- Implementation branch: `codex/tribunal-hardening-20260926`.
- Ending implementation revision: `0ab868d072a3ee536f28858f9dbdd2f2aefeec4e` (including the user-requested official Kujo 1.5 target). This report is a subsequent documentation commit; resolve its containing revision with `git log -1 -- docs/audits/repository-hardening-2026-09-26.md`.
- Local evidence root: `.tribunal/audit-20260925/` (the session began September 25 local time and continued September 26). Baseline, failed experiments, intermediate runs and final receipts are retained separately. Sealed historical evidence was not modified.
- Local runtime: Kujo 1.5.0 at `../kujo/target/release/kujo`; SHA-256 `5c1240ab6cce77323edf420a1b28df98669d246f9c8212999b0f3c1bca192ec2`. Adjacent checkout `761c75a060c1f765933c5f9586836528871ad0f1` identifies the checkout, not a build attestation. The configured release pin remains `9b77dce592047121cb71066629836ad89252f3ce`.
- Integrations: Kujo, AI SDK, PackWrite, RunLedger, CaseFile, Concord, Spec, Eval, Kennel and Workcell; Watchdog remains the explicit matrix exclusion. No sibling source, release tag, public release, credential, signing service or branch protection was changed.

This internal audit does not complete the commissioned independent security review or certify a hosted, shared-filesystem or enterprise deployment. Disposable tests use synthetic local keys and loopback fixtures, never live model credentials.

## Baseline

Before application edits, 98 commands checked version, doctor, all 76 tracked Kujo files, six suites and fourteen offline gates. All six suites passed: 136 main, 56 CLI, 100 enterprise, 22 property, 34 hardening and 17 audit checks. The only baseline failure was the integration-matrix gate: eleven adjacent revision mismatches. No pins were changed to hide this drift.

Fresh targeted reproductions established failures beyond existing coverage:

- Four of six initial governance/projection assertions failed: missing retention deadline accepted, malformed prior hold overwritten, malformed and non-object event logs reported as successful exports.
- Two independent publishers with the same expected empty version both succeeded; the final store had two object versions but only one history entry.
- A deliberately dirty index caused deletion to throw after removing source data and writing its `deleting` tombstone, leaving its run lock behind.
- The HTTP reference adapter finalized a version with no conditional header (201); malformed/conflicting conditions were not rejected at the input boundary.
- An intermediate full run exposed the unchanged index contention implementation's separate exists/type probe race. The baseline happened to pass it; the retained failure is not relabeled as a baseline suite failure or dismissed as flakiness.

## Findings and disposition

| ID | Priority | Area | Finding and evidence | Action | Status |
|---|---|---|---|---|---|
| H26-01 | P1 | Store concurrency | Two writers succeeded from the same expected version; one history entry was lost. `store-race-before.log`. | Per-run store lock spans conditional read, export and atomic index publication. | Fixed; independent-process regression and conditional retry |
| H26-02 | P1 | Governance | Missing retention deadline defaulted to zero; malformed holds could be replaced as empty history. `projection-before.log`. | Reuse published governance/hold schemas, identity and safe-file checks; preserve rejected prior bytes. | Fixed; malformed, symlink, retry and valid-history regressions |
| H26-03 | P1 | Failure/resources | Deletion's later filesystem/index exceptions stranded ownership. `delete-before.log`. | Locked helper plus common release path; pending tombstone preserved and actionable failure returned. | Fixed; injected dirty-index regression |
| H26-04 | P1 | Audit completeness | Best-effort event reader erased evidence-read failures into empty success. | Add checked reader; telemetry, JSONL export and replay propagate failures; retain existing best-effort helper for callers. | Fixed; corrupt, scalar, missing and empty-log cases; CLI failure codes |
| H26-05 | P1 | Index concurrency | Owner removal between exists/type probes produced false non-directory errors. `final/082.log`. | One metadata snapshot; unavailable observations retry within existing contention budget and retain last diagnostic on timeout. | Fixed; existing four-process workload plus regular-file refusal |
| H26-06 | P1 | HTTP contract | Missing finalization precondition accepted and published an index. `http-condition-before.log`. | Require exactly one valid condition; validate bundle metadata before state changes. | Fixed; 17 raw HTTP checks plus telemetry continuation fixture |
| H26-07 | P2 | Resource bounds | Writers could outgrow existing 10,000-version / 4 MiB reader contracts; tombstone hashing buffered metadata. | Refuse unreadable index/history growth, serialize hold once, bound deletion metadata and hash files directly. | Fixed; preservation and version-limit regressions |
| H26-08 | P2 | Agent/CI efficiency | Recursive source checks traversed 716 Kujo files including generated copies, versus 76 tracked baseline files. | Use NUL-delimited tracked inventory; explicitly document new-file checks. | Fixed; no supported tracked source omitted |
| H26-09 | P1 follow-up | Provider replay | Current bridge and inspected AI SDK source expose no provider idempotency forwarding. | Preserve existing documented limitation and cross-repository follow-up. | Open; no new duplicate finding |
| H26-10 | P2 external | Reproduction | Local integration revisions drift; Docker socket is unavailable. | Preserve failures and blocker receipt; retain pinned hosted checks. | Environment limitation |

## Changes implemented

**Conditional publication:** `src/artifact_store.kujo` reuses existing exclusive, token-owned run locks at `<store>/.locks/<run>.lock`. Competing writers fail explicitly; subsequent intentional updates pass the newly observed current version. Atomic index publication follows complete object export. Existing immutable objects are never deleted as an automatic rollback. A failed export can still leave an unindexed object for operator reconciliation. `tests/fixtures/store_concurrency.py` synchronizes two real processes at a readiness barrier, verifies one winner/one object/one history entry, then verifies a conditional retry retains both versions and full entry-count/byte histories are refused unchanged. No arbitrary sleep determines the workload result.

**Governance:** `src/governance.kujo` shares one validated hold-reader between eligibility and mutation, uses the existing published schemas rather than new duplicate schemas, bounds reads and writes at 4 MiB, and preserves malformed/oversized prior evidence. Valid empty/new history and successive hold/release operations remain supported. A locked mutation wrapper releases ownership on recoverable failures. Deletion keeps a `deleting` tombstone until its index update finishes and retains a redacted cause on unexpected failure. File hashes avoid additional whole-file text buffers; no measured RSS improvement is claimed.

**Complete projections:** `src/storage.kujo` adds `load_events_checked`; `load_events` remains the best-effort array helper. `src/telemetry.kujo` and `src/cli.kujo` reject missing/unsafe/oversized/invalid/non-object logs instead of silently completing. JSONL export uses runtime failure 1; replay uses integrity failure 3. First-page telemetry failure publishes no payload; later failure retains already exported pages and diagnostics. The HTTP continuation fixture now contains explicit event files so it continues testing a later shard failure rather than depending on missing-file success.

**Index contention:** type validation observes one filesystem metadata snapshot. The existing 30-second acquisition budget, helper timeout, dirty marker, non-stealing policy, page locking and actual four-process workload remain unchanged. Unavailable metadata is not treated as proof of a non-directory; continued failure is reported at the existing deadline with its cause. A development experiment that rechecked existence after a missing metadata result also raced; it was discarded and its logs preserved. The final code consumes the metadata field inside the error boundary, accommodating the runtime's error-value evaluation behavior.

**HTTP reference boundary:** `src/bridges/immutable_http_store_server.kujo` validates shared bundle metadata and requires exactly one of `If-None-Match: *` or a lowercase SHA-256 `If-Match` before publication. Supported clients already emit these headers. Valid creation remains 201 and stale updates remain 412; malformed/missing/conflicting conditions return 400.

**Regression and operations:** existing audit and hardening suites include the new tests, so compatibility, release and Eval retain them automatically. `tests/projection_regressions.kujo` is checked as tracked source. Both workflows and README use a NUL-delimited tracked source loop. CHANGELOG, artifact-store and operations documentation explain the changes, retry/recovery rules and older-writer prohibition. No dependency, schema-version or unrelated formatting churn was introduced.

## Performance and efficiency

| Measurement | Baseline | Intermediate post-fix | Final implementation |
|---|---:|---:|---:|
| Five-seat hearing (ms) | 2,453 | 1,930 | 2,658 |
| Large hearing (ms; limit 45,000) | 28,566 | 31,127 | 60,423 |
| Scale two pages (ms; limit 6,000) | 2,885 | 2,023 | 2,619 |
| Artifact bytes | 7,800,199 | 7,800,199 | 7,800,199 |
| Context bytes | 512,220 | 512,220 | 512,220 |
| Index two pages (ms; limit 3,000) | 1,205 | 940 | 1,146 |
| Index bytes | 163,084 | 163,084 | 163,084 |
| Index rebuild (ms) | 1,414 | 997 | 1,399 |
| Stats (ms) | 5,914 | 4,186 | 9,973 |
| Lock cycles/sec (floor 15) | 15 | 15 | 15 |
| Recovery (ms; limit 5,000) | 4 | 9 | 5 |

The final local scale gate failed (60,423 ms); intermediate Eval also stopped on its scale failure (54,055 ms, 10 passed / 1 failed of 20 configured cases). Earlier standalone post-fix gates passed. Concurrent Rust builds and other Kujo workloads were observed in `host-load.json`; this is context, not proof of causality. No budget or assertion was changed. Isolated pinned CI is required before treating this branch as merge-ready.

Publication changed from two successful conflicting writers / two objects / one history entry to one successful writer / one object / one history entry; an explicit conditional retry retains both versions. The final byte-cap test intentionally leaves a third unindexed object while preserving its two-entry readable index. Source inventory changed from 716 recursively discovered files to 77 tracked files (76 before the new regression module). Declared dependency count remains zero.

Host timings are observations, not attributable speedup claims. There is no tokenizer, provider-token, model-output, RSS, binary-size or build-speed claim. Prompt content, seat isolation, context limits, retry bounds and diagnostic evidence remain intact. The only source-check reduction is in inventory selection on this working checkout; fresh CI checkouts may have no generated duplicates. New regression sources intentionally increase tracked coverage.

## Coverage and retained architecture

| Phases | Review and decision |
|---|---|
| 0, 10 — Architecture/contracts | Inspected implementation entrypoints, CLI authorization/dispatch, library envelopes, configs, model/context bridges, evidence schemas and package exports. Retained stable v1 contracts and Kujo SDK ownership. |
| 1, 12, 18 — Baseline/proof | Fresh pre-edit full baseline, failing targeted reproductions, post-fix suites/gates and exact-commit release checks. Failed experiments retained separately. |
| 2, 16 — Complexity/dead weight | Consolidated governance reads and failure cleanup; retained public exports, legacy evidence/encryption/chunk formats, integrations and fixtures absent proof they are obsolete. |
| 3, 4 — Runtime/resources | Reviewed repeated schema/serialization/hash work, byte/count bounds, subprocess lifetime, retries, index traversal, event buffering and immutable publication. Fixed writer/reader bound mismatch; retained bounded whole-event-file parsing rather than inventing an incompatible streaming API. |
| 5, 6, 15 — Agent/token/output | Reviewed prompt/context assembly, blind/cross-stage disclosure, bridge schemas/output caps, compact receipts, CLI JSON/detail modes and instructions. Removed generated-source checking overhead; no speculative prompt trimming. |
| 7, 8 — Failure/security | Reviewed files/paths/symlinks, deletion/hold, signatures/trust/provenance, bundles, output destinations, adapter auth/conditions, secrets, subprocess argv/env and escaped offline dashboard. Fixed evidenced boundaries; administrator-controlled filesystem and trusted runtime remain assumptions. |
| 9 — Concurrency/state | Reproduced lost publication and transient index type failure; kept token ownership, non-stealing acquisition, dirty recovery and immutable source evidence. Separate cursor calls are not a global snapshot. |
| 11, 13 — Supply chain/ratchets | Zero declared package dependencies retained; pinned runtime/integrations and action references inspected. No repinning without evidence. New tests join existing CI; no threshold/assertion weakened. |
| 14, 17 — Documentation/implementation | Corrected affected operational contracts and hosted release-runner description; historical release and audit receipts preserved. |

Coverage is an engineering review of the important implementation and contracts, with supporting fixture/workflow inspection and executable gates. It is not a claim of an exhaustive independent review of every historical fixture or environment. No separate unused abstraction or dependency was proven safe and worthwhile to remove.

## Compatibility

- Public package exports and API 1.0 signatures unchanged. The internal checked events reader is additive.
- CLI commands/options unchanged. Previously false-success JSONL exports now return existing failure code 1; replay event failures use existing integrity code 3. Valid outputs remain unchanged.
- Published file formats and schemas unchanged. Existing schema constraints are now enforced before governance mutation and HTTP finalization. No sealed evidence migration occurs.
- Configuration and environment variables unchanged. Publication adds a documented internal `.locks` directory under the external store root.
- Older store writers must not share a store concurrently with upgraded writers because they bypass the new lock. This is local cooperating-process coordination, not automatic NFS/multi-host certification.
- Consumers of malformed governance, missing events, unconditional HTTP finalization or successful partial exports must correct their input/error handling; those behaviors were bugs, not supported contracts.

## Cross-repository follow-ups and remaining work

- **P1 — AI SDK:** design an additive idempotency option, forward it through Tribunal's bridge and verify provider-specific deduplication before claiming retry safety or charge prevention. Current local/offline operation does not require it. Existing SignalBox capture `cap_349cc3e2-3968-447d-bb2b-ede670475bc6` and signal `sig_7d3cfdee-c99b-431d-8e9e-0bec5bb8bc10` already track this work.
- **P1 verification — local scale budget:** two later runs exceeded 45 seconds; retain this evidence and require isolated pinned CI before merge. Shared-host load was observed, but attribution remains unproven.
- **P2 — verification environment:** restore an authorized Docker/Workcell environment and verify the exact runtime image and success/failure manifests. The current Docker socket cannot be reached. Do not equate hosted/local test results with container containment proof.
- **Needs more evidence — runtime transport:** metadata consumers validate response bodies after `http_request`; runtime receive limits need separate investigation before claiming constant-memory reception. Binary transfer paths retain their bounded APIs.
- **Needs more evidence — deployments:** independent security review, live-provider, remote custody, target identity, storage, backup and shared-filesystem certification remain separate scopes.
- **Resolved here:** the prior local immutable publication hypothesis is reproduced and fixed. Its historical capture `cap_afa84a85-0b23-437d-9031-04d756516c8f` is not duplicated; consult the newer Strata handoff for current disposition.
- **Not worth changing:** legacy formats, provider delegation, zero-dependency packaging and necessary evidence/context detail. No supported P0 finding or cosmetic P3 work admitted.

## Verification receipt

- **Pre-change baseline:** 97/98 commands passed; all 365 Kujo checks passed. Only the known local integration revision matrix failed.
- **Whole post-fix run:** 98/99 commands passed; all 385 Kujo checks passed and all thirteen non-matrix gates passed. This run began at `c394bb1` and overlapped later isolated HTTP edits, so it is intermediate evidence, not exact final-tree certification.
- **Final implementation `94dac09`:** all 77 tracked source checks, version, doctor, 35 hardening checks, 100 enterprise checks, 36 audit checks, Kennel validation, release archive, archive smoke and diff check passed. Performance results are recorded above; the final local scale gate failed. Exact commands and individual results are in the JSON receipt.
- **Retained failures:** initial repros, two discarded metadata experiments, the intermediate full-run index race, and both local scale failures remain under separate evidence paths. Eval stops on failure; its unexecuted cases are not counted as passes.
- **Workcell:** Docker daemon unavailable; the embedded blocker receipt records command, exit, log digest and closest equivalent proof. No container proof claimed.
- **Hosted validation:** the pull request must run the existing pinned Ubuntu, Intel macOS and ARM macOS workflows, full six-suite/fourteen-gate/Eval chain, Kennel and archive smoke. Consult its checks for the report commit; local runtime 1.5.0 is not a substitute for pinned-runtime proof.


The [machine-readable receipt](repository-hardening-2026-09-26-receipt.json) retains exact commands, exits, durations, log paths and SHA-256 digests. Large logs remain under the ignored evidence root. No release or certification claim should be inferred from a historical or different-commit receipt.

## Kujo 1.5 verification target correction

The user explicitly required Kujo 1.5 after the initial hosted workflow still built the historical 1.0 pin. Official `v1.5.0` resolves through annotated tag `83fbdd4f39db68c5bc2196318e993e0ff202d514` to commit `cc2d7dbb59a8dc05f00d629e100932f56f4062f6`. Both workflows, the current integration matrix, installation/operations guidance and platform receipt version now target 1.5.0. Historical receipts above retain their original identities; other integration revisions remain unchanged. The matrix still enforces exact expected versions and checkout revisions, and platform receipts now verify the executable's actual version output.

The obsolete-runtime Linux job `108338159203` in run `36218152284` failed the new 10,000-entry fixture because Kujo 1.0's JSON parser caps input at 1 MiB. Its log is preserved in `.tribunal/audit-20260925/pr7-linux.log`. This is not a pass and does not justify weakening the fixture: the strict 10,000-entry and 4 MiB assertions remain. Store and hold writers additionally verify that serialized JSON can be read by the executing runtime before replacement. The hold-growth fixture now proves the original record is readable and requires the specific safety-limit failure, rather than accepting any failure. No timeout, threshold, suite or assertion was removed.

Current verification must use the official 1.5 source pin or checksum-verified release artifact. The original local measurements used a different 1.5.0-labeled binary and remain separately attributed. Follow-up command receipts and PR #7 checks record the new proof; they must pass before merge-ready claims.

## Official Kujo 1.5 verification receipt

The official macOS x64 archive matches the release tag's SHA-256 `1aebcd482125031104b2df79abae6db57973f1874ceb196f95989b14e287d820`; its executable digest is `3e1e475ea165c8b4a714495596fe8661ad970b27119ad44f1db4d9779f7f05d4`, and `--version` reports `kujo 1.5.0`.

All **385 Kujo checks**, all **77 tracked source checks**, and performance/scale/index/load gates pass on this official executable. The 99-command pass initially had two failures: the known local integration-revision mismatch and Concord's dependency-version false positive. The changelog now explicitly identifies Tribunal 1.0.1 before describing dependency versions; the unchanged drift gate passes on rerun. No performance budget, assertion, parser boundary, failure or test was suppressed. A negative version fixture confirms platform-receipt generation exits 2 and writes nothing for a 1.0 executable.

Official-release measurements (separate binary and host observation; not an attributable speedup):

| Measurement | Result | Existing budget |
|---|---:|---:|
| Five-seat hearing (ms) | 2,438 | 15000 |
| Large hearing (ms) | 29,901 | 45000 |
| Scale two pages (ms) | 3,467 | 6000 |
| Index two pages (ms) | 2,316 | 3000 |
| Index rebuild (ms) | 1,660 | 15000 |
| Stats (ms) | 9,672 | 15000 |
| Lock cycles/sec | 15 | minimum 15 |

Artifact size remains 7,800,199 bytes; context remains 512,220 bytes; index remains 163,084 bytes. The earlier scale failures remain evidence about those executions; the official 1.5 measurements do not erase or retrospectively pass them. The remaining local matrix failure is an environment mismatch; isolated hosted CI checks the unchanged adjacent pins plus the explicitly requested official runtime pin.

**Additional P2 cross-repository follow-up — Concord:** `src/checks/version_consistency.kujo` reads the entire changelog through `extract_version_from_text`, which takes its first semantic-version regex match. An Unreleased dependency upgrade can therefore be mistaken for the product release. Evidence: `official-1.5/086.log`; clarifying the current product version passes the same gate. Recommend parsing product release headings or explicit product metadata with a dependency-upgrade regression and preserved missing-version diagnostics. Tribunal does not require an upstream change to operate. No Concord source was modified. SignalBox capture `cap_5a4644c8-1560-4b25-961f-5c1567880156`, signal `sig_e6e44424-1bbe-4390-bf7a-af989f2d6380` preserve this finding; exact-ID and concept retrieval were verified.

## Existing-directory traversal follow-up

Hosted Linux passed the full Kujo 1.5 chain at `042e312`; ARM macOS passed all 385 tests and scale/index budgets but failed the unchanged load floor (500 acquisitions and contentions, 33,362 ms, 14 cycles/sec versus minimum 15). This failure remains preserved in `pr7-final-arm.log`; it is not relabeled as a pass.

Inspection found that `ensure_dir` traversed and probed every parent even when its target already existed. A target-directory check now returns early only for an existing directory; missing targets retain the original traversal/creation path. Caller trust-boundary checks, exclusive `/bin/mkdir` claims, durable atomic ownership writes, timeout budgets and cleanup remain unchanged. Three behavioral regressions cover missing parents, preserved contents and refusal of a non-directory parent; the focused suite now passes 38 checks.

The focused 1,000-call existing-directory observation changed from 1,217 to 770 ms. A sequential unchanged 500-cycle load comparison changed from 35,747 to 34,726 ms (13 to 14 integer cycles/sec); **both load observations fail the existing floor**. These are local observations, not a universal speedup or proof that throughput is resolved. Component profiling separately observed 2,479 ms in directory claims and 2,360 ms in durable writes across 100 iterations. Neither safety property was removed to meet a benchmark. Final hosted validation must execute the unchanged load gate on the changed code. No retry-only green result is substituted for a fix.

Implementation follow-up revision: `f8febe9352891bcc7431a757825370825c88644b`. Full follow-up suites/gates and release checks use the official Kujo 1.5 target; final per-platform proof is attached to PR #7. The earlier 385-check receipts remain historical; adding these three cases makes the final six-suite inventory 388 checks.
