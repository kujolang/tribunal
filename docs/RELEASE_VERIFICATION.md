# Verify downloaded release artifacts

1. Obtain the release ZIP and `release-archive-receipt.json`. If the release also publishes a signed evidence bundle, obtain the signer public key and your independently distributed trust policy from separate channels.
2. Compute the ZIP SHA-256 with an organization-approved tool and compare it to `archiveSha256` in the receipt and the release page.
3. Extract into a new directory. Verify every entry in `SHA256SUMS`, then inspect `SBOM.spdx.json` and `provenance.intoto.json`. Confirm the provenance source revision equals the signed Git tag and the runtime digest equals the approved Kujo binary.
4. For signed evidence, use `tribunal bundle-import` or `tribunal audit` with `--trust-policy`, the intended target, and `--require-signature`. The public key embedded beside release evidence is not itself a trust anchor. If signed evidence is absent, do not claim signer-backed provenance; rely on the protected GitHub release channel and independently compare the archive digest and source revision.
5. Reject mutable tags, mismatched digests, missing provenance/SBOM, unexpected files, untrusted signer status when signing is present, or a release whose platform compatibility receipt does not cover the target.

`scripts/release_archive.kujo` requires `SOURCE_DATE_EPOCH`, `TRIBUNAL_SOURCE_REVISION`, Python 3, and `unzip` for the packaged-launcher smoke gate. It produces two independent ZIP builds with normalized timestamps, paths, compression, and modes, and fails unless their SHA-256 digests match.

## v1.0.1 release verification

Release verification now checks out and builds the same immutable Kujo and integration revisions as platform compatibility CI in an isolated GitHub-hosted Ubuntu workspace. It does not depend on mutable adjacent repositories or an operator's installed runtime. The protected `release` environment remains the publishing boundary. Tag and dispatch verification require the tag to match both VERSION and the workflow source commit.

The patch preserves the frozen v1.0.0 API and evidence fixtures while reporting product and CLI version 1.0.1. Platform CI must pass for the release candidate on Linux x86_64, macOS Intel, and macOS arm64. The release workflow then creates and smoke-tests a reproducible source archive for the exact tagged commit. Its receipt is published alongside the ZIP. No managed signing configuration is enabled for this release; unsigned provenance is not signer-backed certification.

Local Workcell proof is blocked: neither the default Colima Docker socket nor the historical kujo-workcell profile socket was available during release preparation on 2026-09-05. Hosted Linux offline tests, invalid-input tests, integrity tests, and archive smoke checks are the closest equivalent proof; they do not establish Workcell containment. Historical v1.0.0 container receipts remain historical and are not relabeled as patch-release evidence.
