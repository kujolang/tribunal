# Measured platform support

Tribunal does not claim universal platform support. A platform is supported for the 1.0.0 release only when a release-candidate receipt identifies the exact Tribunal commit, Kujo 1.0.0 commit and binary digest, measured OS/architecture, full gate inventory, and passing result.

| Platform | Tribunal 1.0.0 status | Evidence |
| --- | --- | --- |
| macOS x86_64 | pending final-candidate proof | A fresh local receipt and `tribunal-compatibility-macos-x86_64` hosted artifact must name the final `main` candidate. |
| Linux x86_64 | pending final-candidate proof | A fresh `tribunal-compatibility-linux-x86_64` hosted artifact must name the final `main` candidate. |
| macOS arm64 | pending final-candidate proof | A fresh `tribunal-compatibility-macos-arm64` hosted artifact must name the final `main` candidate. |
| Linux arm64 | not supported | No passing v1 candidate receipt is available. |
| Windows | not supported | Filesystem, launcher, process, archive, and release gates have not been measured. |

The prior v1 receipts cover `8b476e51c5bc219608c8d9fae3bebdb9101e9462`, not the final merge candidate, and are historical only. Fresh receipts must bind the final Tribunal revision to Kujo `9b77dce592047121cb71066629836ad89252f3ce`, the architecture-specific runtime digest, measured environment, full gate inventory, and passing result. Public ecosystem checkouts may use the workflow's scoped `github.token` fallback; any inaccessible pinned revision fails closed. Deployment-specific HSM, store, shared-filesystem, identity, network, custody, and organizational certification remains separate from platform support.

The existing `linux-x86_64-ubuntu-24.04.json` and `macos-x86_64-local.json` files are immutable historical 0.7.0 receipts. They do not establish 1.0.0 support and are retained only as prior-release evidence.
