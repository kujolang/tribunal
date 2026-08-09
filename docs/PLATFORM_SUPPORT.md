# Measured platform support

Tribunal does not claim universal platform support. A platform is supported for the 1.0.0 release only when a release-candidate receipt identifies the exact Tribunal commit, Kujo 1.0.0 commit and binary digest, measured OS/architecture, full gate inventory, and passing result.

| Platform | Tribunal 1.0.0 status | Evidence |
| --- | --- | --- |
| macOS x86_64 | supported for the exact 1.0.0 candidate | Local receipt: `/Users/robertdevore/2026/Kujolang/kujo-repos/.tribunal-release-v1/8b476e5/tribunal-v1.0.0-macos-x86_64.json`; CI artifact: `tribunal-compatibility-macos-x86_64` from run `31291863267` |
| Linux x86_64 | supported for the exact 1.0.0 candidate | CI artifact: `tribunal-compatibility-linux-x86_64` from run `31291863267`; downloaded receipt under `/Users/robertdevore/2026/Kujolang/kujo-repos/.tribunal-release-v1/8b476e5/github-platform-artifacts/` |
| macOS arm64 | supported for the exact 1.0.0 candidate | CI artifact: `tribunal-compatibility-macos-arm64` from run `31291863267`; downloaded receipt under `/Users/robertdevore/2026/Kujolang/kujo-repos/.tribunal-release-v1/8b476e5/github-platform-artifacts/` |
| Linux arm64 | not supported | No passing v1 candidate receipt is available. |
| Windows | not supported | Filesystem, launcher, process, archive, and release gates have not been measured. |

All v1 receipts cover candidate `8b476e51c5bc219608c8d9fae3bebdb9101e9462` and Kujo `9b77dce592047121cb71066629836ad89252f3ce`. The local macOS x86_64 receipt records macOS `26.3.1`, Darwin `25.3.0`, and runtime SHA-256 `a8175b084398a1623cf24cabb6aafb05f316cd6b15eb5e2015089501dd9d8215`. [GitHub Actions run 31291863267](https://github.com/kujolang/tribunal/actions/runs/31291863267) records the hosted-runner OS, kernel, architecture-specific runtime digest, full gate inventory, and result for Linux x86_64 and both macOS architectures. Private ecosystem checkouts require `KUJO_ECOSYSTEM_TOKEN`; inaccessible pinned revisions fail closed. Deployment-specific HSM, store, shared-filesystem, identity, network, custody, and organizational certification remains separate from platform support.

The existing `linux-x86_64-ubuntu-24.04.json` and `macos-x86_64-local.json` files are immutable historical 0.7.0 receipts. They do not establish 1.0.0 support and are retained only as prior-release evidence.
