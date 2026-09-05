# Tribunal repository hardening — 2026-09-04–05

## Repository and evidence scope

- Repository: `kujolang/tribunal`; implementation scope was this checkout only.
- Branch: `fix/tribunal-bug-regressions` (preserved the existing branch).
- Starting SHA: `a7499fb48c29d4860bafa4c80d997ba0a9fa2634`, clean working tree.
- Ending implementation SHA: `b9c3129122670cad2a9d557a7e3e5bc6f3bfae01`. This report and its receipt are a subsequent documentation-only record; their containing commit is discoverable with `git log -1 -- docs/audits/repository-hardening.md`.
- Implementation commits: `6d171f7` (boundary fixes and regression gate), `24f0b3f` (compact prompts and operator contracts), `b9c3129` (preserve structured SDK failure diagnostics).
- Purpose: local/operator-controlled adversarial decision hearings with immutable, inspectable evidence, CLI and API 1.0 contracts.
- Runtime used: absolute `KUJO_BIN=/Users/robertdevore/2026/Kujolang/kujo-repos/kujo/target/release/kujo`; binary SHA-256 `672951e9703c21b0be2adf527c984bbcfec7a8b6107dc479970303d050cd15eb`. The adjacent runtime checkout was observed at `06f0900e9d6259b89712c87acc8a9feca452f048`; this is not a build attestation. It differs from the release pin `9b77dce592047121cb71066629836ad89252f3ce`.
- Integrations reviewed: AI SDK, PackWrite, RunLedger, CaseFile, Concord, Spec, Eval, Kennel, Workcell; Watchdog is explicitly excluded by the integration matrix. No sibling source was modified. No live provider calls, public releases, tags, package publication, managed signing or branch-policy changes were performed. Existing suites use disposable synthetic local keys.
- Evidence directory: `.tribunal/hardening/` in the repository. Raw command logs, source snapshot, benchmark inputs, prompt runs, archive receipts and the execution runner remain there. Sealed `tribunal-runs/` evidence was not edited. The committed JSON receipt records exact commands, exits, timings and log digests.

## Baseline

All tracked Kujo source files were checked; the four original suites and the complete direct offline gate inventory were run before application edits. Main tests passed. The first CLI run encountered host process exhaustion (`Resource temporarily unavailable`, OS error 35), and the evidence runner itself could not spawn its receipt `git` process. That failure is preserved in `baseline/076.log`; an unchanged sequential continuation passed CLI integration. No assertion or timeout was weakened.

The continuation passed enterprise/property tests, schemas, Concord, strict Spec, ordinary performance, index performance, load/chaos, adversarial corpus, accessibility, security register, gallery, v1 compatibility, Markdown links and Kennel validation. Two baseline failures remained:

1. Scale gate: hearing **53,217 ms**, over its unchanged **45,000 ms** budget; pagination **5,947 ms**, under its **6,000 ms** budget.
2. Integration matrix: ten adjacent revision mismatches (runtime, AI SDK, PackWrite, RunLedger, Concord, Spec, Eval, Kennel, Workcell, and excluded Watchdog). CaseFile matched. Pins were not changed to conceal this.

The added focused suite was run against unchanged application source: **12 failed / 8 passed**. Failures reproduced incomplete Bearer/Basic redaction, root containment, success JSON accepted from failed SDK/PackWrite processes, cached-manifest substitution, cross-shard duplicate run IDs, and descriptor identity/chunk/aggregate validation gaps. After implementation it passed **20 / 20**; the final diagnostic regression brings this to **21 / 21**. Main tests additionally assert that compact cross-examination inputs contain every testimony field.

## Findings

| ID | Priority | Area | Finding and evidence | Action | Status |
| --- | --- | --- | --- | --- | --- |
| H01 | P1 | Secrets | General assignment redaction consumed `Bearer`/`Basic` but left the credential; three synthetic header/JSON cases failed. | Redact the full authentication value before generic assignments. | Fixed, regression tested |
| H02 | P1 | Process failures | `live_invoke` and PackWrite accepted `ok:true` stdout from an executable exiting 7. | Require process success before accepting usable output; retain structured SDK failure diagnostics and redact PackWrite error values. | Fixed, regression tested |
| H03 | P1 | State isolation | Context and ingestion helpers temporarily changed process-wide cwd around child execution. | Pass `cwd` to `spawn_process`, matching the existing SDK bridge contract. | Fixed; integration and cwd checks |
| H04 | P2 | Paths | Root `/` became prefix `//`, so descendants were considered external. | Treat normalized filesystem root as containing all absolute paths. | Fixed, regression tested |
| H05 | P1 | Index integrity | Verifier compared digest labels without comparing cached manifests and collapsed duplicate IDs across shards. | Compare cached content with actual manifests; reject cross-shard duplicates; read each source manifest once for parse and digest. | Fixed, regression tested |
| H06 | P1 | Transfer bounds | Descriptor count alone did not establish unique inventory coverage, chunk/size consistency or aggregate bytes before downloads. | Validate descriptors and 1 GiB aggregate upfront; index descriptors once for HTTP lookup. Legacy descriptor-free local bundles remain accepted. | Fixed, regression tested |
| H07 | P1 | Import ownership | Existence check followed by recursive ensure could adopt a concurrently created destination. | Claim the destination with exclusive `create_dir`; failure never triggers another import's cleanup. | Fixed; existing import/duplicate/failure coverage retained |
| H08 | P2 | Hashing | Artifact helper materialized a full Kujo byte value before hashing. | Use existing native `sha256_file`, validate returned digest and recheck size. | Fixed; binary/empty/UTF-8 hashes and measurements |
| H09 | P2 | Context size | Pretty JSON whitespace was repeated across eight post-blind prompts. | Compact serialization preserves content, structured data, metadata and all peer evidence. | Fixed; prompt byte comparison and testimony assertion |
| H10 | P2 | API boundaries | Library docs claimed CLI-equivalent authorization, but storage-only library calls have no identity context. | Document embedding caller's authentication/authorization responsibility. No silent API redesign. | Documentation corrected |
| H11 | P2 | Key/endpoint bounds | Direct verification lacked the declared public-key size bound; HTTP store helpers relied on prior config URL validation. | Enforce existing 1 MiB key bound and URL policy at these entrypoints. | Fixed; existing trust/store suites retained |
| H12 | P1 | Shared state | Index updates across distinct run IDs share metadata/pages despite separate locks; rebuild removes live pages before publishing metadata. Source-supported race risk; no controlled two-writer reproduction in this pass. | Document operator serialization and retain a focused human-review finding. | Open; architectural transaction work |
| H13 | P2 | Release proof | Local dependency revisions differ from pins; required Workcell image is missing and local Docker is rootless. | Preserve blockers and closest local proof; do not change pins or certification claims. | External environment blocker |

## Changes implemented and compatibility

The first commit changes `src/common.kujo`, `src/model.kujo`, `src/context.kujo`, `src/integrations.kujo`, `src/storage.kujo`, `src/bundles.kujo`, `src/artifact_store.kujo`, and `src/integrity.kujo`. `tests/hardening_tests.kujo` is a small standalone offline suite, wired into both compatibility and release workflows and the platform gate inventory. Existing tests were retained. No dependency was added.

The second commit changes model-input serialization in `src/tribunal.kujo`, adds the complete-testimony assertion to the main suite, and updates affected usage/security-boundary documentation and the changelog. The API documentation correction is material: embedding callers are trusted operators and must enforce authorization themselves.

- **Public APIs:** signatures and envelope/file versions unchanged; no API removal or new required argument.
- **CLI:** command names/options and exit-code meanings unchanged. Failed bridge executions now stop rather than being accepted. Invalid index/descriptor inputs and oversized public keys are rejected.
- **File formats/schemas:** unchanged. Historical evidence is not rewritten. Descriptor-free legacy bundles remain valid; supplied descriptors must be internally consistent.
- **Configuration/environment:** no new fields or variables; existing URL, key and resource policies are applied at additional entrypoints.
- **Consumers:** new prompts use compact JSON. Prompt bytes, their hashes, mock token estimates, and input-derived idempotency keys for post-blind stages consequently differ for newly executed hearings (including full-stage replay). Historic saved prompts and signatures remain intact. This does not promise identical live model wording or provider deduplication across a software upgrade.
- **Hashing:** `sha256_file` already exists at the pinned runtime. The newer `sha256_file_range` API was explicitly avoided because it is absent at that pin. The current runtime streams native file hashes; the pinned runtime's native implementation still buffers a file. Do not generalize the current-RSS result to every supported runtime.

## Performance and efficiency

Measurements are local samples on this busy macOS host, not platform certification or statistically controlled latency claims.

| Workload | Before | After | Interpretation |
| --- | ---: | ---: | --- |
| 64 MiB deterministic binary digest, maximum RSS (`/usr/bin/time -l`) | 144,596,992 bytes | 10,485,760 bytes | Same exact digest; native hashing avoids the Kujo-level whole-file value on this runtime |
| Same digest, helper time | 808 ms | 773 ms | Single samples; no general speedup claim |
| Same digest, process wall time | 0.90 s | 0.83 s | Includes startup; single samples |
| Product-decision strategic-five saved prompts | 69,070 bytes / 13 files | 59,841 bytes / 13 files | 9,229 fewer bytes (13.36%); all testimony fields retained |
| Same hearing mock token estimate | 17,106 | 14,797 | Length/4 fixture estimate, **not tokenizer or live-provider usage** |
| Same hearing model invocations | 13 | 13 | No model call, safety stage or testimony omitted |
| Manifest read operations per indexing scan entry | 2 | 1 | Source-backed operation count; parse and digest now share the same read |
| HTTP descriptor lookup | Repeated linear search per artifact | One map construction plus lookups | Source-backed complexity improvement; no transfer latency claim |
| Declared package runtime dependencies | 0 | 0 | Existing external Kujo integrations retained |

Digest: `281e519df3077b557c6b03f5da83c4e8d397219259615dd7c3308f89cae8f2a6`. Benchmark command: `/usr/bin/time -l "$KUJO_BIN" run .tribunal/hardening/digest-bench.kujo --interpreter .tribunal/hardening/digest.bin`. Prompt comparison used `./bin/tribunal review examples/product-decision.md --panel strategic-five --mock --storage-dir .tribunal/hardening/prompt-{before,after}`. Human-readable evidence remains pretty-printed; only model-bound JSON changed. Detailed command output remains in logs; the receipt is compact.

## Audit coverage and retained design

The audit read application implementations, entrypoint/launcher, configuration, all public dispatch paths, storage/index/locks, integrity/signing/provenance, governance, bundle/store adapters, context/SDK bridges, rendering, analytics/telemetry, policy/catalog contracts, tests/fixtures, executable gates, schemas, package/release configuration and required operational documents.

| Area / prompt phases | Review result |
| --- | --- |
| Architecture and contracts (0, 10) | Thin root entrypoint, Kujo modules, stable CLI/library/config/evidence versions; keep the provider SDK boundary and historical formats. |
| Baselines and verification (1, 12, 18) | Original failures separated from new regressions; focused failing reproductions and existing broad gates retained. |
| Complexity and dead weight (2, 16) | Removed duplicate manifest reads, repeated descriptor search and global-cwd scaffolding. No proven dead public export or dependency warranted deletion. |
| Runtime and resources (3, 4) | Measured digest memory and prompt bytes; kept bounded process outputs, 1 MiB transfers, per-artifact limits, cursor pages and finite retries. Shared index transaction design remains open. |
| Agent context and output (5, 6, 15) | Compact JSON preserves sufficient context and evidence; standalone focused suite improves targeted verification; no new wrapper framework or duplicate instruction source. |
| Failure semantics (7) | Fixed nonzero subprocess acceptance; exclusive import ownership prevents adopting another writer's destination. Existing stop/seal/recovery paths tested. |
| Security (8) | Reviewed untrusted CLI/config, dockets, model/context outputs, external processes, policies, keys, bundle/store responses, filesystem paths and HTML projections. Fixed demonstrated redaction/path/validation gaps. This is an internal engineering pass, not the commissioned independent security review. |
| Concurrency and determinism (9) | Child cwd isolation, exclusive import claim, complete index verification; retained stable panel-order persistence. Per-run locks do not establish storage-wide atomicity. |
| Dependencies/CI (11, 13) | No package dependency tree to trim. Runtime/integration revisions and most GitHub actions are pinned; mutable Rust toolchain selection still needs a separately measured compiler policy before changing release builds. Focused regressions join existing CI without new timing thresholds. |
| Documentation (14) | Corrected authorization and index operator assumptions; recorded prompt/idempotency implications and exact proof limitations. |
| Implementation (17) | Prioritized reproducible boundary failures and measured waste; no cosmetic rewrites or speculative API removals. |

Remaining trust assumptions include administrator-controlled local storage and trust-policy custody, filesystem TOCTOU during hostile concurrent mutation, provider-side idempotency, and deployment-specific remote-store/identity guarantees. The offline dashboard remains escaped, script-free and access-controlled by its host environment. No deployed service was audited.

## Cross-repository follow-ups

- **Kujo runtime and pinned integrations:** reproduce release proof in isolated checkouts of the matrix revisions. Evidence is the baseline/final matrix failure inventory. Current checkout advancement does not justify repinning Tribunal without compatibility certification. This repository's code changes do not require a sibling code change.
- **Workcell environment:** provision the pinned runtime image and a host-compatible rootless run configuration. The original profile fails rootless preparation; a local profile with `workspace.run_as=rootless` reaches the missing-image check. Both receipts are preserved. Do not infer Linux certification from macOS mock tests.
- **Kujo native hashing:** the current runtime's streaming implementation improves memory here while maintaining the old function contract. Backporting/changing the release runtime is outside this pass; no new builtin is required.

## Remaining work

- **P0:** no newly demonstrated unresolved P0 issue in this pass; this is not a guarantee of absence.
- **P1:** H12 shared-index writer coordination and generation-consistent readers. Keep operator serialization until controlled concurrency tests and a transaction design are implemented. Avoid a superficial lock wrapper: current callers, failed writes, crash recovery and bounded readers need coherent error propagation.
- **P2:** restore exact pinned release environment and Workcell proof; complete target-specific certification and the previously commissioned independent review before expanding claims.
- **Needs more evidence:** scale latency on a quiet, pinned runtime; storage-wide concurrency interleavings; compiler pinning across all supported platforms. Existing finite bounds do not certify adversarial shared filesystems or target remote services.
- **Not worth changing:** cosmetic module rewrites, removal of historical evidence formats, dependency replacement, or trimming substantive testimony just to lower token counts.
- **P3:** none admitted.

SignalBox admitted only H12. Capture `cap_6394a6a1-ca64-4384-851a-df7c4d4f5158`; Signal `sig_5a9051d1-f2b2-47a0-a5c5-fe34d49013d0`. Exact retrieval passed; concept retrieval returns the linked finding. The pre-existing revision-pin Signal `sig_d0870233-3b96-4dec-90ad-59c2870ce992` was reused as a reference; no duplicate capture was created for that blocker. Completed fixes, routine verification and transient host contention were rejected as capture candidates.

## Verification receipt

The adjacent `repository-hardening-receipt.json` is the command-level receipt. Raw output is retained in `.tribunal/hardening/`, with the benchmark and prompt run identities above. Final direct gates, Eval, archive reproducibility/smoke and Workcell outcomes are recorded below. No failing baseline threshold or revision pin was changed.

Direct inventory at `24f0b3f` (before the final diagnostic-preservation regression): **96 passed / 1 failed** across version, doctor, 74 Kujo source checks, five suites, fourteen executable gates, Kennel validation and whitespace checking. The sole failing command is the unchanged integration-matrix revision check. The scale gate passed without altering either budget. Raw warning output from the current Kujo type checker is retained; this pass does not claim warning-free compilation.

The archive was built from an isolated `git archive 24f0b3f38f3f11c998478d23baea1dfa0028131d` source snapshot inside `.tribunal/hardening/archive-source`, with `SOURCE_DATE_EPOCH=1788578769`, the actual `KUJO_BIN` above, and `TRIBUNAL_RELEASE_ARCHIVE_OUTPUT=.tribunal/hardening/archive-output`. Both ZIP hashes are `7ae768fa95d22895c6263d47b6e3140d57cdc056648e84d68bcde2089e057109`; size **284,531 bytes**, source inventory **192 files**. `scripts/archive_smoke.kujo` passed version, doctor, missing-docket refusal and mock review. The generated archive receipt's runtime revision comes from the matrix, whereas its binary digest is measured. Since the local binary is not attested to that pin, this proves source-package reproducibility and smoke behavior only, **not valid release-runtime provenance or release eligibility**.

Workcell exact-implementation attempts: `wc-47f8be928a4746fda48e5110f43ef401` failed preparation because this daemon requires rootless workspace identity; `wc-5538791dba9745a9ad616e6866b0b459` used a local rootless config and failed because `kujolang/workcell-kujo:tribunal-v1.0.0-9b77dce` is unavailable with `--no-pull`. Both returned exit **4**, with cleanup complete and no changed files. Their receipts live under `.workcell/runs/`. The earlier dirty-tree refusal `wc-12c7121696d6461492f9387441096d6c` is retained as a preparation attempt, not workload proof. Docker server version was **29.5.2**. The closest executed proof is the local full suite and extracted-package happy/failure smoke above.

Full Eval was executed with `sh .tribunal/hardening/run-eval.sh`: from the adjacent Eval checkout, `$KUJO_BIN run main.kujo run "$TRIBUNAL_HOME/tests/tribunal_eval.json" --output-dir "$TRIBUNAL_HOME/.tribunal/hardening/eval" --snapshot-dir "$TRIBUNAL_HOME/.tribunal/hardening/eval-snapshots" --summary-only`. All outputs stayed in this repository. It returned exit **1**, **18 passed / 1 failed / 0 skipped**, **284,099 ms**; only the known integration revision matrix failed. This Eval receipt belongs to `24f0b3f`. The later SDK diagnostic-preservation change is covered by a fresh direct full inventory at `b9c3129`; no second duplicate Eval run is represented.

The task resumed on September 5 after the previous command sessions were unavailable. The source remained at `b9c3129`. All 74 source checks and the main suite had completed in `verified/receipt.json`; the interrupted CLI command and remaining direct gates were restarted in `verified-continuation/`, and the incomplete final archive smoke was rerun. Earlier logs were preserved.

Final-code archive at `b9c3129122670cad2a9d557a7e3e5bc6f3bfae01`: both ZIP hashes are `92bcaecc95884af7f70f9b3b0ee2362391df08fdd6709a6235368fd83e47d3f6`, **284,669 bytes**, **192 source files**, `SOURCE_DATE_EPOCH=1788579429`. It uses the same isolated source-snapshot procedure under `.tribunal/hardening/archive-final-source` and `archive-final-output`. The runtime provenance limitation above still applies.

At resumption, an exact-code blocker receipt for `b9c3129` was also recorded in `.tribunal/hardening/workcell-resumption-blocker.json`: `docker image inspect kujolang/workcell-kujo:tribunal-v1.0.0-9b77dce --format '{{.Id}}'` returned **1** because the Docker daemon at the configured local Colima socket was unavailable. The runtime binary digest was unchanged. Final-code archive smoke passed version, doctor, missing-docket rejection and offline review.

Final direct inventory at `b9c3129`, combining the completed `verified` and `verified-continuation` receipts: **96 passed / 1 failed across 97 commands**. All **334 assertions** passed (main 136, CLI 56, enterprise 99, property 22, focused hardening 21). The only failure remains the ten pre-existing integration revision mismatches. The scale gate passed in 43.411 seconds of process wall time, without a budget change. All 74 source checks, the other thirteen gates and Kennel validation passed.

## Durable memory receipt

Strata CONSOLIDATE saved one Agent Notes handoff/state-and-timeline episode, `7522ba0a-45f6-472e-9bb6-97ab62ca2145`, titled “Session Memory · Tribunal repository hardening · 2026-09-05”. It preserves implementation commits, measurements and compatibility constraints, final verification, open index coordination, environment blockers, provenance and links to earlier state. Exact-ID retrieval and concept search “Tribunal repository hardening” both passed. The write returned HTTP 500 after persistence; retrieval confirmed the complete stored content, so it was not retried. No duplicate atomic notes, historical rewrites or pending bundles were created. SignalBox IDs, skipped duplicate and rejected candidates are recorded above.
