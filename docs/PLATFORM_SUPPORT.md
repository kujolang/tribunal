# Measured platform support

Tribunal does not claim universal platform support. A platform is supported for the 1.0.0 release only when a release-candidate receipt identifies the exact Tribunal commit, Kujo 1.0.0 commit and binary digest, measured OS/architecture, full gate inventory, and passing result.

| Platform | Tribunal 1.0.0 status | Evidence |
| --- | --- | --- |
| macOS x86_64 | supported for the exact 1.0.0 candidate | `/Users/robertdevore/2026/Kujolang/kujo-repos/.tribunal-release-v1/8c2ae6d/tribunal-v1.0.0-macos-x86_64.json` |
| Linux x86_64 | not supported | The Linux/amd64 Workcell receipt proves only the bounded packaged-CLI paths; no full-gate platform receipt is available. |
| macOS arm64 | not supported | No passing v1 candidate receipt is available. |
| Linux arm64 | not supported | No passing v1 candidate receipt is available. |
| Windows | not supported | Filesystem, launcher, process, archive, and release gates have not been measured. |

The macOS receipt covers candidate `8c2ae6d760dd1736a28caf571141963583219a98`, macOS `26.3.1` on Darwin `25.3.0`, and Kujo `9b77dce592047121cb71066629836ad89252f3ce` with binary SHA-256 `a8175b084398a1623cf24cabb6aafb05f316cd6b15eb5e2015089501dd9d8215`. The compatibility workflow is configured for `ubuntu-24.04`, `macos-15-intel`, and `macos-15`, but configuration is not evidence until a job completes and publishes a receipt for the candidate. Private ecosystem checkouts require `KUJO_ECOSYSTEM_TOKEN`; inaccessible pinned revisions fail closed. Deployment-specific HSM, store, shared-filesystem, identity, network, custody, and organizational certification remains separate from platform support.

The existing `linux-x86_64-ubuntu-24.04.json` and `macos-x86_64-local.json` files are immutable historical 0.7.0 receipts. They do not establish 1.0.0 support and are retained only as prior-release evidence.
