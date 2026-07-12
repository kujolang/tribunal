# Measured platform support

Tribunal does not claim universal platform support. A platform is release-supported only when the compatibility workflow publishes a passing receipt for the exact Tribunal revision and pinned Kujo runtime digest.

| Platform | Status for 0.7.0 | Evidence |
|---|---|---|
| macOS x86_64 | locally measured | Core, enterprise, CLI, property, schema, performance, adversarial, and accessibility gates run on Darwin 25.3.0 with Kujo 1.0.0; the bounded compatibility receipt is under `docs/compatibility/`. |
| macOS arm64 | CI candidate | `macos-14` compatibility job; supported only after a passing uploaded receipt. |
| Linux x86_64 | CI candidate | `ubuntu-24.04` compatibility job; supported only after a passing uploaded receipt. |
| Linux arm64 | not yet supported | No maintained runner receipt. |
| Windows | not supported | Filesystem, launcher, and process contracts have not been measured. |

The compatibility job builds Kujo from commit `0f7778107ee9efab09ab7559e30c0c97935a890e`, runs the listed gates, and publishes JSON containing the runtime digest and source revision. Deployment-specific HSM, store, shared-filesystem, and network certification remains separate.
