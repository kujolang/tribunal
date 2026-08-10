# Measured platform support

Tribunal does not claim universal platform support. A platform is supported for the 1.0.0 release only when a release-candidate receipt identifies the exact Tribunal commit, Kujo 1.0.0 commit and binary digest, measured OS/architecture, full gate inventory, and passing result.

| Platform | Tribunal 1.0.0 status | Evidence |
| --- | --- | --- |
| macOS x86_64 | supported for candidate `1ceed3010c9c554fb9d44b8e38c91f9c998b80fb` | Local exact-candidate gates and hosted artifact `tribunal-compatibility-macos-x86_64` passed. Run `31341698867`, job `93316444672`; Kujo SHA-256 `1bec0fb43b27e995c8dbfd2d76b9d79e6f629328cf2defebb661b20d397dfb54`. |
| Linux x86_64 | supported for candidate `1ceed3010c9c554fb9d44b8e38c91f9c998b80fb` | Hosted artifact `tribunal-compatibility-linux-x86_64` passed. Run `31341698867`, job `93316444730`; Kujo SHA-256 `5932b17c2619519e25db319643750e0400a4afbfc0262e59eedb0a503eaac7e3`. |
| macOS arm64 | supported for candidate `1ceed3010c9c554fb9d44b8e38c91f9c998b80fb` | Hosted artifact `tribunal-compatibility-macos-arm64` passed. Run `31341698867`, job `93316444704`; Kujo SHA-256 `f7cb4d92a05bb9738d2acf2c995009dae144ef4a2ac48d5b97f8b4af66d98506`. |
| Linux arm64 | not supported | No passing v1 candidate receipt is available. |
| Windows | not supported | Filesystem, launcher, process, archive, and release gates have not been measured. |

The authoritative retained proof is GitHub Actions run `31341698867` and its three downloaded compatibility artifacts under `.tribunal-release-v1/1ceed30/github-platform-artifacts/`. Every receipt binds Tribunal `1ceed3010c9c554fb9d44b8e38c91f9c998b80fb` to Kujo `9b77dce592047121cb71066629836ad89252f3ce`, the architecture-specific runtime digest, measured environment, complete gate inventory, and a passing result. The prior v1 receipts for `8b476e51c5bc219608c8d9fae3bebdb9101e9462` are historical only. Public ecosystem checkouts may use the workflow's scoped `github.token` fallback; any inaccessible pinned revision fails closed. Deployment-specific HSM, store, shared-filesystem, identity, network, custody, and organizational certification remains separate from platform support.

The existing `linux-x86_64-ubuntu-24.04.json` and `macos-x86_64-local.json` files are immutable historical 0.7.0 receipts. They do not establish 1.0.0 support and are retained only as prior-release evidence.
