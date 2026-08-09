# Measured platform support

Tribunal does not claim universal platform support. A platform is supported for the 1.0.0 release only when a release-candidate receipt identifies the exact Tribunal commit, Kujo 1.0.0 commit and binary digest, measured OS/architecture, full gate inventory, and passing result.

| Platform | Tribunal 1.0.0 status | Evidence |
| --- | --- | --- |
| macOS x86_64 | candidate support requires the final local full-gate receipt | `docs/compatibility/tribunal-v1.0.0-macos-x86_64.json` when generated and verified |
| Linux x86_64 | candidate support requires the final container/runner full-gate receipt | `docs/compatibility/tribunal-v1.0.0-linux-x86_64.json` when generated and verified |
| macOS arm64 | not supported | No passing v1 candidate receipt is available. |
| Linux arm64 | not supported | No passing v1 candidate receipt is available. |
| Windows | not supported | Filesystem, launcher, process, archive, and release gates have not been measured. |

The compatibility workflow tests `ubuntu-24.04`, `macos-15-intel`, and `macos-15`, but a configured job is not evidence until it completes and publishes a receipt. Private ecosystem checkouts require `KUJO_ECOSYSTEM_TOKEN`; inaccessible pinned revisions fail closed. Deployment-specific HSM, store, shared-filesystem, identity, network, custody, and organizational certification remains separate from platform support.

The existing `linux-x86_64-ubuntu-24.04.json` and `macos-x86_64-local.json` files are immutable historical 0.7.0 receipts. They do not establish 1.0.0 support and are retained only as prior-release evidence.
