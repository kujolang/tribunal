# Performance and scale contracts

## Persistent index and bounded projections

Run manifests are indexed under `<storage>/.index/` as atomic metadata plus 100-entry pages. Normal list, stats, telemetry, dashboard, and bulk verification paths load one index shard and one bounded result page at a time. Full inventory scans are reserved for explicit `index-rebuild`, `index-check`, and `index-repair`; repair removes abandoned atomic-write fragments and proves manifest digests.

`scripts/index_perf_gate.kujo` creates 250 four-artifact runs and requires a 15-second rebuild, 2-second two-page lookup, 15-second aggregate fold, exactly three index pages, and a 100-run projection ceiling. The separate scale gate exercises the same cursor contract with a large hearing. Application memory is bounded independently of total run count; Kujo does not yet expose portable peak RSS, so byte/page limits are directly measured and OS RSS remains a platform receipt concern.

## Blind-seat concurrency evaluation

Every blind request is derived only from immutable context and its own seat contract. Prompts and request events are persisted in panel order; results are validated and persisted in that same order. Configuration bounds desired concurrency and provider concurrency from 1–16 and mandates cancel-on-failure.

Kujo 1.0.0 `parallel_map` currently panics by starting a Tokio runtime inside the active interpreter runtime. Tribunal records requested/effective concurrency and the runtime gate in sealed events, forces effective concurrency to one, and keeps live concurrency disabled. This is the safe outcome of the evaluation—not a parallel-throughput claim. The gate can be lifted only after the runtime fixture stops panicking and isolation/order/cancellation regressions pass.

## Streaming and transfer budgets

Bundle export/import copies files in 1 MiB `io_read_at`/`io_append_bytes` chunks and records byte, digest, and chunk descriptors. Remote artifacts larger than 1 MiB use chunk endpoints with at most 64 chunks for the 64 MiB per-artifact ceiling. Each request carries index, offset, byte count, base64 digest, idempotency key, and conditional-write semantics; completion binds the whole-file SHA-256. Download verifies every chunk and the final byte count/digest before import. Small artifacts retain the single-request compatibility path.

Budgets are 10,000 artifacts, 64 MiB per artifact, 1 GiB aggregate bundle bytes, 4 MiB metadata, 1 MiB working chunk, up to 64 chunk PUT/GET requests plus one completion request per large artifact, and no more than one destination copy (1x final disk) plus one temporary bundle copy (maximum 2x transfer disk amplification). AES-GCM runtime primitives remain whole-value APIs, so encrypted portable bundles retain the 64 MiB per-artifact ceiling and must not be represented as constant-memory encryption.

## Sustained load, contention, and recovery

`scripts/load_chaos_gate.kujo` performs 500 acquisition/contention/release cycles, records wait and contention metrics, injects a terminated stale owner, and requires explicit recovery within a 5-second RTO and at least 15 cycles/second on a shared CI host. `scripts/multi_host_worker.kujo` runs for at least ten seconds on each distinct host against the same mounted storage; `scripts/multi_host_report.kujo` requires two unique host receipts, successful acquisitions, and observed contention. Multi-host receipts certify only the tested filesystem/mount and must accompany deployment evidence.

No gate establishes universal NFS/distributed-filesystem semantics. If the target shared filesystem cannot prove atomic directory creation and coherent metadata under the worker harness, deploy a supported external coordination adapter before enabling multi-host writers.
