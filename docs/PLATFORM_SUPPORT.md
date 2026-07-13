# Measured platform support

Tribunal does not claim universal platform support. A platform is release-supported only when a committed or CI-published passing receipt identifies the exact Tribunal revision, measured environment, architecture, and pinned Kujo runtime digest.

| Platform | Status for 0.7.0 | Evidence |
|---|---|---|
| macOS x86_64 | measured for 0.7.0 | The full release gate ran on macOS 26.3.1 / Darwin 25.3.0 at Tribunal `1e1ad639478deb6c9ef1ed5a7899c7f5a021fa98`; see `docs/compatibility/macos-x86_64-local.json`. |
| macOS arm64 | not yet supported | `macos-14` remains a CI candidate; support begins only after a passing uploaded receipt for the release revision. |
| Linux x86_64 | measured for 0.7.0 | The full release gate ran in pinned Ubuntu 24.04 on Linux 6.8.0 at Tribunal `eeb3fb98d8c8583ecc6cd3b27d4ead94ecbeb525`; see `docs/compatibility/linux-x86_64-ubuntu-24.04.json`. |
| Linux arm64 | not yet supported | No maintained runner receipt. |
| Windows | not supported | Filesystem, launcher, and process contracts have not been measured. |

Both receipts cover all Kujo checks, four test suites, schemas, Concord, strict Spec, Eval, performance/scale/index/load gates, adversarial and accessibility gates, review and integration registers, Kennel validation, the example gallery, doctor, and reproducible archive generation. The compatibility job builds Kujo from commit `0f7778107ee9efab09ab7559e30c0c97935a890e`, checks out every pinned ecosystem dependency, and publishes the same bounded JSON contract. Private ecosystem checkouts require the repository secret `KUJO_ECOSYSTEM_TOKEN`; the workflow fails closed when its token cannot read a required revision. Deployment-specific HSM, store, shared-filesystem, and network certification remains separate.
