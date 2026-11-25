# Tribunal performance hardening · 2026-11-25

Tribunal is a local-first decision-evidence engine. This pass started on `main` at `fa4ffd2c9bb6ee5d8285dfb5c161b844e6e75b7c`. The verified application and test revision is `9cd7b6bbd28659020bde2d12d5ff6eb81740ea08`, pushed on `codex/tribunal-performance`. The report commit adds documentation and evidence. The relevant dependencies are the Kujo runtime, its CLI and filesystem primitives, and the pinned ecosystem used by release checks.

## Findings and fixes

| ID | Priority | Finding and evidence | Change and verification |
| --- | --- | --- | --- |
| PERF-1 | P1 | Docket parsing split the same text three times. The section loop appended into a copied Kujo array for each nonempty line, so the cost grew quadratically with section length. | Split once and slice, trim and filter each selected section in bulk. Tests cover CRLF, heading case, first-section selection, nested headings, defaults, a section at EOF, and exact content and digest. |
| PERF-2 | P1 | Run IDs, path components and digests iterated through the interpreter one character at a time. Text byte counts encoded and decoded base64 to get the length. The boolean secret scan collected all matches to test for at least one. | Use whole-string ASCII predicates and native byte length and match operations. Tests cover traversal, Unicode, control characters, length, digest case, UTF-8 size and secret detection. Organization regexes still count their matches. |
| PERF-3 | P2 | Index rebuild sorted the unique manifest scan a second time and rebuilt arrays for each page. Pagination repeated ID validation after loading a fully validated page. | Slice the already sorted inventory and reuse validation from the page reader. The index gate checks 250 manifests, three shards, filtering, cursor pagination, verification, statistics and telemetry. |

## Compatibility and scope

The CLI, configuration, library signatures, schemas, index order, cursor syntax, atomic write protocol and seal formats are preserved. The path predicates retain the same ASCII alphabet, segment and overall lengths, and dot-component rules. Index page validation still checks schema, run IDs, embedded manifest IDs and duplicates before listing. Docket parsing preserves the original text and source hash. The tests use fresh temporary hierarchies. No migration or dependency change is required.

| Hardening phases | Audit coverage |
| --- | --- |
| 0 and 10 | Trace CLI and library entry points through docket review, storage, schema validation, telemetry and release contracts. |
| 1, 12, 13 and 18 | Compare the original revision with the verified application commit. Use the existing offline suites, pinned integration matrix, release/archive smoke, and unchanged timing gates. Add deterministic assertions in existing suites. |
| 2, 3, 4 and 16 | Remove repeated parsing, copying, character checks, base64 conversion and index ordering. Review bounded records, streamed bundles and page loading. Retain supported legacy evidence paths and package exports. |
| 5, 6 and 15 | Review paginated status and telemetry and the opt-in detailed JSON outputs. Keep full model prompts and testimony in sealed evidence and retain CLI summaries. The repo has no MCP/tool registration surface to shrink. SDK retry/idempotency and durable replay are existing integration boundaries. |
| 7, 8 and 9 | Review validation, failure exits, atomic writes, locks, dirty markers and deterministic ordering on the affected paths. No filesystem trust, process isolation or concurrency policy changes. |
| 11, 14 and 17 | Keep the native runtime and integrations pinned. Update the performance contract and document measurements. Live providers and deployment certification are outside this performance pass. |

## Measurements

The host ran macOS 26.6.2 on x86-64 with the official Kujo 1.5.0 executable (`3e1e475ea165c8b4a714495596fe8661ad970b27119ad44f1db4d9779f7f05d4`). Both source versions ran the same interpreter workloads and fixture data on this shared host. Other workloads were active and free disk space ran low, so wall times varied. These are local observations.

The focused local test used an 8,000-line, 256,082-byte docket, 1,000 run-ID, path and digest validation sets, and 100 byte counts. The docket and normalized scope digests and byte totals matched at both revisions.

| Local focused workload | Baseline (ms) | Candidate (ms) |
| --- | ---: | ---: |
| Large docket validation | 111,151, 95,533 | 81,095, 44,840 |
| 1,000 run-ID/path/digest sets | 30,756, 12,395 | 13,783, 11,217 |
| 100 UTF-8 byte counts | 968, 371 | 545, 494 |

The same pinned interpreter gates ran on GitHub-hosted runners at both revisions. Each cell is baseline → candidate in milliseconds. The runs were on separate dates and runner instances.

| Hosted runner | Large mock hearing | Warm two-page lookup | Index rebuild | Stats fold |
| --- | ---: | ---: | ---: | ---: |
| Linux x86-64 | 2,350 → 1,286 | 203 → 103 | 198 → 102 | 828 → 501 |
| macOS Intel | 12,847 → 3,566 | 426 → 336 | 354 → 268 | 1,216 → 1,185 |
| macOS ARM64 | 1,960 → 1,550 | 212 → 164 | 230 → 114 | 723 → 533 |

Small five-seat hearings measured 235 → 170 ms on Linux, 545 → 540 ms on Intel macOS, and 333 → 363 ms on ARM macOS. Both small-hearing and local byte-count timings show run-to-run variation.

The baseline and candidate emitted identical 512,220-byte contexts and 163,084-byte indexes on the hosted runs. Release archive size and hashes are recorded in the receipt. Peak RSS, live-provider latency and token usage were outside the measured scope.

## Verification

The [receipt](repository-hardening-2026-11-25-receipt.json) records commands, statuses, timings and evidence hashes. Raw logs, the benchmark script, release archive and fallback hearing artifacts are preserved under the ignored `.tribunal/performance-2026-11-25/` directory.

- Baseline version, doctor, type check, unit, CLI and schema verification passed. Local scale, persistent index and load fell outside their budgets before the change.
- The candidate passed 77 source checks, 139 unit checks in both VM and interpreter, 56 CLI checks in VM, 18 Python checks, the schema gate in both modes, and the clean application archive build and smoke. One local interpreter CLI attempt encountered OS error 28 during release evidence. The pinned local Eval CLI case and hosted interpreter suites passed.
- Local scale, persistent index and lock-load gates remained outside their unchanged budgets on the shared host. Ordinary small-hearing, schema, drift, specification, adversarial, accessibility, security, gallery, compatibility and documentation gates passed locally.
- The default adjacent checkouts did not match the pinned integration revisions. The matrix passed in an isolated layout provisioned at the exact pins. Local pinned Eval passed ten cases, then stopped when cold pagination exceeded the scale budget (6,313 ms against 6,000 ms).
- All three hosted platform jobs passed the full compatibility workflow, including their offline suites, timing gates, Eval, Kennel and archive smoke. The comparison uses [baseline run 39893231225](https://github.com/kujolang/tribunal/actions/runs/39893231225) and [application run 45715703896](https://github.com/kujolang/tribunal/actions/runs/45715703896).

## Workcell blocker

Docker Desktop could not reach its daemon. The dedicated Colima profile booted and accepted SSH but its readiness check reported missing `/mnt/lima-cidata/param.env` and `/run/lima-ssh-ready`. It never exposed its Docker socket. The profile was stopped after available host space dropped to 128 MiB. The receipt retains both endpoint probes and the startup and shutdown logs.

The closest local proof at the exact application SHA is CLI version and doctor, valid and intentionally missing docket checks, and the offline `executioner-only` review `2026-11-25-product-decision-md-9457`. Integrity verification checked 16 artifacts with no errors against manifest `2c0bd7dd3e80497f4ad1366dff02e49d58502f67a528b8108e1e02298b195370`. Docker containment and deliberate Workcell exit-17 receipts remain unavailable.

## Remaining work

- **P2 verification.** Restore the Workcell Docker endpoint for exact-commit container proof above.
- **Needs more evidence.** Cursor search scans from the newest shard when resuming from a run ID. Measure larger inventories before redesigning lookup and account for stale-cursor errors and index recovery.
- **Existing cross-repository work.** The Kujo Runtime exclusive-directory primitive and AI SDK provider idempotency are tracked in the [September audit](repository-hardening-2026-09-26.md). This patch has no upstream dependency.
