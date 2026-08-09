# Verify downloaded release artifacts

1. Obtain the release ZIP, `release-archive-receipt.json`, signed evidence bundle, signer public key, and your independently distributed trust policy from separate channels.
2. Compute the ZIP SHA-256 with an organization-approved tool and compare it to `archiveSha256` in the receipt and the release page.
3. Extract into a new directory. Verify every entry in `SHA256SUMS`, then inspect `SBOM.spdx.json` and `provenance.intoto.json`. Confirm the provenance source revision equals the signed Git tag and the runtime digest equals the approved Kujo binary.
4. Use `tribunal bundle-import` or `tribunal audit` with `--trust-policy`, the intended target, and `--require-signature`. The public key embedded beside release evidence is not itself a trust anchor.
5. Reject mutable tags, mismatched digests, missing provenance/SBOM, untrusted signer status, unexpected files, or a release whose platform compatibility receipt does not cover the target.

`scripts/release_archive.kujo` requires `SOURCE_DATE_EPOCH`, `TRIBUNAL_SOURCE_REVISION`, Python 3, and `unzip` for the packaged-launcher smoke gate. It produces two independent ZIP builds with normalized timestamps, paths, compression, and modes, and fails unless their SHA-256 digests match.
