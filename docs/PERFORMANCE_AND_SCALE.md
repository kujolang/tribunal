# Performance and scale contracts

## Persistent index and bounded projections

Run manifests are indexed under `<storage>/.index/` as atomic metadata plus 100-entry pages. Normal list, stats, telemetry, dashboard, and bulk verification paths load one index shard and one bounded result page at a time. Full inventory scans are reserved for explicit `index-rebuild`, `index-check`, and `index-repair`; repair removes abandoned atomic-write fragments and proves manifest digests.

`scripts/index_perf_gate.kujo` creates 250 four-artifact runs and requires a 15-second rebuild, 2-second two-page lookup, 15-second aggregate fold, exactly three index pages, and a 100-run projection ceiling. The separate scale gate exercises the same cursor contract with a large hearing. Application memory is bounded independently of total run count; Kujo does not yet expose portable peak RSS, so byte/page limits are directly measured and OS RSS remains a platform receipt concern.

## Blind-seat concurrency evaluation

Every blind request is derived only from immutable context and its own seat contract. Prompts and request events are persisted in panel order; results are validated and persisted in that same order. Configuration bounds desired concurrency and provider concurrency from 1–16 and mandates cancel-on-failure.

Kujo runtime revision `afa5bd971a78d88b1fa35c6551fbc1247448e946` fixes nested async execution and adds bounded isolated async mappers across both interpreter and VM execution. Tribunal uses `parallel_map` for blind seats, preserves panel order, caps work by both blind and provider limits, shares a cancellation file with live provider subprocesses, and records requested/effective concurrency. Live parallel calls remain an explicit `live_parallel_enabled` opt-in; the offline SDK fixture exercises per-process `cwd` isolation without process-global directory changes.

## Streaming and transfer budgets

Bundle export/import copies files in 1 MiB `io_read_at`/`io_append_bytes` chunks and records byte and digest descriptors. Remote artifacts use Kujo file-body upload/download primitives, retain conditional-create and idempotency headers, and verify returned byte counts plus whole-file SHA-256 before import. Transport memory is constant with respect to artifact size and has no base64 expansion.

Budgets are 10,000 artifacts, 64 MiB per artifact, 1 GiB aggregate bundle bytes, 4 MiB metadata, and a 1 MiB encryption/copy working chunk. Each remote artifact uses one streamed PUT and one streamed GET when restored. Framed AES-256-GCM encryption and authenticated decryption are constant-memory within the configured chunk bound. Atomic publication may temporarily require one same-filesystem output copy.

## Sustained load, contention, and recovery

`scripts/load_chaos_gate.kujo` performs 500 acquisition/contention/release cycles, records wait and contention metrics, injects a terminated stale owner, and requires explicit recovery within a 5-second RTO and at least 15 cycles/second on a shared CI host. `scripts/multi_host_worker.kujo` runs for at least ten seconds on each distinct host against the same mounted storage; `scripts/multi_host_report.kujo` requires two unique host receipts, successful acquisitions, and observed contention. Multi-host receipts certify only the tested filesystem/mount and must accompany deployment evidence.

No gate establishes universal NFS/distributed-filesystem semantics. If the target shared filesystem cannot prove atomic directory creation and coherent metadata under the worker harness, deploy a supported external coordination adapter before enabling multi-host writers.
