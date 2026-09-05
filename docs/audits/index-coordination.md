# Shared-index coordination follow-up — 2026-09-05

This continues the [repository hardening audit](repository-hardening.md), starting from `fd670eb24ddfb14f594cf153dff1299f063bf5c6`. Implementation commit: `fa81c9209747c2232dcea86cc5a3cf28fbdff692`. Scope remains Tribunal only. No sibling source, tags, release publication, live providers or managed keys were changed.

## Reproduction and correction

The earlier H12 source-supported race now has an independent-process reproduction. Two writers save fifteen distinct manifests each while a third process repeatedly rebuilds the index and a fourth lists it. Against the starting application source, writers failed while publishing a page removed by the concurrent rebuild (`No such file or directory`). The exact fixture is `tests/fixtures/index_concurrency_worker.kujo`; baseline command and logs remain under `.tribunal/hardening/index-concurrency/`.

The investigation also corrected an assumption in the earlier receipt: Kujo `create_dir` is **not exclusive**. Both the pinned runtime `9b77dce592047121cb71066629836ad89252f3ce` and current runtime source implement it with Rust `std::fs::create_dir_all`. Existing-path checks followed by that call do not establish lock or import ownership. Tribunal now calls fixed `/bin/mkdir` without `-p`, passing the destination as one absolute argv value with no shell expansion or inherited environment. The common helper is used by per-run locks, new runs, imports and index coordination. Doctor declares the POSIX helper dependency. No new language primitive or package dependency is required; Windows remains unsupported.

All cooperating index readers, writers and maintenance operations now share `.index.lock`. Internal calls avoid reacquiring the non-reentrant lock. Waiting is bounded at thirty seconds and does not steal an old-looking lock. Manifest save holds the lock across its source write and index update; failures propagate rather than being silently accepted. A mutation marks `.index-dirty` before changing pages. Ordinary readers and writers reject interrupted state; explicit rebuild/repair clears the marker only after success. Exception cleanup releases the coordination lock while retaining the dirty marker.

The focused suite adds exclusive-claim assertions, the four-process workload, final exact coverage of all thirty manifests, a filesystem failure between page mutation and metadata publication, refusal of that partial generation, lock cleanup, and explicit repair from the retained source manifest. The suite passed **30/30** before the broader inventory. Its pre-existing twenty-one checks remain intact.

## Compatibility and limits

CLI commands, metadata/page schemas, page size and public function signatures remain unchanged. Coordination failures raise filesystem-style exceptions; callers must not convert them into successful operations. Source manifests and sealed evidence are not rewritten by index repair. `/bin/mkdir` is a new explicit host requirement, already present on the supported macOS/Linux profiles.

A listing call has a consistent page set. Multiple cursor calls, full hearings, imports and deletions do not form one snapshot or transaction. Source-manifest verification during an in-progress operation can observe changes outside the index operation. Locks are exclusive for readers too, so contention can increase latency. No multi-host/NFS certification is implied. Older Tribunal processes bypass the new coordination and must not share storage concurrently with this version.

After a process crash, stop all storage users, preserve evidence, remove only the abandoned empty `.index.lock` directory using `rmdir`, and run `index-repair` before restarting. Do not remove `.index-dirty` manually. `locks-recover` does not remove this storage-wide lock. A killed mkdir helper may leave a directory even when its caller received failure; ownership requires operator reconciliation. The thirty-second wait bound is checked between helper invocations; each helper separately has a ten-second process timeout.

## Verification and evidence

The runtime remains SHA-256 `672951e9703c21b0be2adf527c984bbcfec7a8b6107dc479970303d050cd15eb`; local runtime provenance is not attested to the matrix pin. The command receipt is [index-coordination-receipt.json](index-coordination-receipt.json). Raw logs remain under `.tribunal/hardening/index-coordination/` and `index-coordination-continuation/`.

The first broad run passed version, doctor, all seventy-five Kujo source checks and 136 main assertions. CLI then hit host process exhaustion (OS error 35), and later commands could not spawn. Those results are preserved; affected checks were rerun sequentially without changing thresholds or source.

An isolated `git archive fa81c92` snapshot produced matching source ZIP hashes `1ebc58a37c8b96fe81dda90a4aeb1a0110cb17d5a4b3e8236de64745769b41df`: 319,800 bytes, 195 source files, epoch `1788612199`. Extracted archive smoke passed. The generator’s declared runtime revision comes from the matrix, not a build attestation; this proves local archive reproducibility and smoke behavior only.

The exact-code Workcell blocker receipt records the Docker image inspection outcome and closest local proof. The matrix currently reports eleven revision mismatches, including CaseFile, which matched in the prior receipt; adjacent checkouts have advanced. Pin reconciliation remains outside this implementation scope. No release eligibility or target-environment certification is claimed.

## Durable follow-up

H12 is addressed for cooperating operations in this version, including failure propagation and partial-publication refusal. The earlier SignalBox finding remains historical; this session does not disposition it automatically.

One unresolved cross-repository review item was admitted: inspect ecosystem callers that may rely on Kujo `create_dir` as an exclusive claim, and consider a distinct native exclusive primitive. No uninspected consumer is asserted vulnerable. Capture `cap_2d4cbc80-9f25-4f5f-ba98-9af41671d983`; Signal `sig_13091122-1d33-4585-8d0c-18d4d6db7119`. Exact retrieval and `create_dir` concept retrieval both passed. Search found no duplicate. Completed fixes, routine logs and host exhaustion were rejected as captures.

Direct inventory completed: **97/98 commands passed** after the interrupted commands were rerun. All **343 assertions** passed (136 main, 56 CLI, 99 enterprise, 22 property, 30 focused). All 75 source checks and thirteen other executable gates passed, as did Kennel and whitespace checks. The only direct failure is the revision matrix. Scale measured hearing 26,048 ms against 45,000 ms and pagination 3,236 ms against 6,000 ms; index rebuild 2,002 ms, two-page read 1,608 ms and stats 7,431 ms all met their unchanged budgets. These are local measurements, not a generalized speed claim.

Full Eval at `fa81c92` passed **18/19**, zero skipped, in **210,835 ms**; only the integration matrix failed. Command: `sh .tribunal/hardening/index-coordination/run-eval.sh`, with all outputs and snapshots inside this repository.

Strata CONSOLIDATE saved one Agent Notes handoff, `6f914a77-0d04-4e84-98e4-ac2b47c2c551`, containing branch timeline/current state, the exclusive-directory correction, recovery and mixed-version constraints, verification and provenance pointers. Exact retrieval and concept search “Tribunal shared-index coordination” passed. The earlier handoff `7522ba0a-45f6-472e-9bb6-97ab62ca2145` received a narrow supersession notice; exact retrieval confirmed the notice and preserved original content. Both writes returned HTTP 500 after persistence, so they were verified rather than retried. No duplicate atomic notes or pending bundles were created.
