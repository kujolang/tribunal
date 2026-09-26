# Kujo ecosystem integration certification matrix

The machine-readable matrix in `INTEGRATION_MATRIX.json` pins the exact adjacent revisions exercised for the Tribunal 1.0.1 candidate. “Verified” means the named local/offline contract and gate passed together; it does not certify live cloud credentials, a public registry, hosted operation, or a deployment not represented by that gate.

| Integration | Version | Verified local contract |
| --- | ---: | --- |
| Kujo Runtime | 1.5.0 | Interpreter/VM execution and the exact runtime primitives used by every gate |
| Kujo AI SDK | 1.0.0 | Real bridge, provider-neutral resolution, offline provider fixture |
| PackWrite | 1.0.0 | Real isolated repository-context bridge |
| RunLedger | 1.0.0 | Trusted signed-run ingestion and receipt |
| CaseFile | 1.0.0 | Trusted signed-run capture and receipt |
| Concord | 1.0.0 | Blocking drift scan |
| Spec | 1.0.0 | Strict conversion and validation gate |
| Eval | 1.0.0 | Deterministic release evaluation |
| Kennel | 1.0.0 | Manifest, exports, and validation |
| Workcell | 1.0.0 | Offline Linux container happy/failure paths with immutable receipt evidence |

Watchdog 1.0.0 was reviewed and is intentionally excluded from the v1 dependency surface. Tribunal exports a generic redacted JSONL/HTTP telemetry contract; it does not require Watchdog's proxy, API, dashboard, or storage. ChangeBucket, Muzzle, Strata, Paperclip, and BZBY are likewise optional downstream consumers or future adapters, not Tribunal runtime dependencies or certified v1 integration paths.

The automated gate verifies product-version agreement, required fields, exact 40-character revisions, and that every local checkout is at the declared commit. Upgrades require changing the matrix revision/version, rerunning the named gate and the full Tribunal release suite, and recording any contract migration. A version discovered locally but not pinned here is compatible only provisionally.

The September 26 hardening candidate explicitly targets official Kujo v1.5.0 (`cc2d7dbb59a8dc05f00d629e100932f56f4062f6`) at the user's request. Other integration pins remain unchanged. Historical release receipts retain their original runtime identities.

Compatibility CI installs official native Kujo release archives through `scripts/install_ci_runtime.py`, verifies platform-specific SHA-256 pins before reading executable bytes, and checks the executable version before publication. The source checkout remains at the matrix revision. Runtime upgrades must update the installer's version/revision/archive hashes together with this matrix and workflow source pins. The release workflow retains its locked source build; every Tribunal compatibility test and performance budget still runs.
