# Kujo ecosystem integration certification matrix

The machine-readable matrix in `INTEGRATION_MATRIX.json` pins the exact adjacent revisions exercised for the Tribunal v0.8 development candidate. “Certified” means the named local contract and gate passed together; it does not certify live cloud credentials, a public registry, or a deployment not represented by that gate.

| Integration | Version | Certified contract |
|---|---:|---|
| Kujo AI SDK | 1.0.0 | Real bridge, provider-neutral resolution, offline provider fixture |
| PackWrite | 0.1.0 | Real isolated repository-context bridge |
| RunLedger | 0.1.0 | Trusted signed-run ingestion and receipt |
| CaseFile | 1.0.0 | Trusted signed-run capture and receipt |
| Concord | 1.0.0 | Blocking drift scan |
| Spec | 0.1.0 | Strict validation/export gate |
| Eval | 1.0.0 | Deterministic release evaluation |
| Kennel | 0.1.0 | Manifest, exports, and validation |

Upgrades require changing the matrix revision/version, rerunning the named gate and the full Tribunal release suite, and recording any contract migration. A version discovered locally but not pinned here is compatible only provisionally.
