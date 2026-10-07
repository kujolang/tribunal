# Verify downloaded release artifacts

1. Obtain the release ZIP and `release-archive-receipt.json`. If the release also publishes a signed evidence bundle, obtain the signer public key and your independently distributed trust policy from separate channels.
2. Compute the ZIP SHA-256 with an organization-approved tool and compare it to `archiveSha256` in the receipt and the release page.
3. Extract into a new directory. Verify every entry in `SHA256SUMS`, then inspect `SBOM.spdx.json` and `provenance.intoto.json`. Confirm the provenance source revision equals the published Git tag and the runtime digest equals the approved Kujo binary.
4. For signed evidence, use `tribunal bundle-import` or `tribunal audit` with `--trust-policy`, the intended target, and `--require-signature`. The public key embedded beside release evidence is not itself a trust anchor. If signed evidence is absent, do not claim signer-backed provenance; rely on the protected GitHub release channel and independently compare the archive digest and source revision.
5. Reject mutable tags, mismatched digests, missing provenance/SBOM, unexpected files, untrusted signer status when signing is present, or a release whose platform compatibility receipt does not cover the target.

`scripts/release_archive.kujo` requires `SOURCE_DATE_EPOCH`, `TRIBUNAL_SOURCE_REVISION`, Python 3, and `unzip` for the packaged-launcher smoke gate. It produces two independent ZIP builds with normalized timestamps, paths, compression, and modes, and fails unless their SHA-256 digests match.

## v1.0.1 release verification

Release verification now checks out and builds the same immutable Kujo and integration revisions as platform compatibility CI in an isolated GitHub-hosted Ubuntu workspace. It does not depend on mutable adjacent repositories or an operator's installed runtime. The protected `release` environment remains the publishing boundary. Tag and dispatch verification require the tag to match both VERSION and the workflow source commit.

The patch preserves the frozen v1.0.0 API and evidence fixtures while reporting product and CLI version 1.0.1. Platform CI must pass for the release candidate on Linux x86_64, macOS Intel, and macOS arm64. The release workflow then creates and smoke-tests a reproducible source archive for the exact tagged commit. Its receipt is published alongside the ZIP. No managed signing configuration is enabled for this release; unsigned provenance is not signer-backed certification.

Local Workcell proof is blocked: neither the default Colima Docker socket nor the historical kujo-workcell profile socket was available during release preparation on 2026-09-05. Hosted Linux offline tests, invalid-input tests, integrity tests, and archive smoke checks are the closest equivalent proof; they do not establish Workcell containment. Historical v1.0.0 container receipts remain historical and are not relabeled as patch-release evidence.

## v1.0.2 release verification

Release-owner approval was given on 2026-10-07 and PR #8 was merged. The release targets Kujo 1.5.0 at the pinned source revision. Publication requires the existing tag to match the workflow commit and all release gates to pass. The published archive and `release-archive-receipt.json` are available from [v1.0.2](https://github.com/kujolang/tribunal/releases/tag/v1.0.2). Use the receipt to verify the exact source and runtime provenance; prior candidate receipts are historical evidence, not substitutes for tagged-commit verification.

See [Kujo 1.5 Workcell verification](WORKCELL_REVIEW.md) for the container recipe and pre-release evidence. No managed signing or deployment certification is implied.

Release archive creation requires a clean Git checkout at `TRIBUNAL_SOURCE_REVISION`. Only committed regular files from the release roots are selected. Ignored caches and untracked inputs are excluded; changed tracked inputs, mismatched source revisions and committed symlinks fail before output creation. This keeps local test caches out of the archive and binds its contents to reviewed source. Repackaging an extracted ZIP is not a substitute for the source checkout.

The preserved pre-release checklist and candidate evidence are in [the 1.0.2 review record](RELEASE_REVIEW_1.0.2.md). Final candidate checks and package receipts are recorded on PR #8.

## Supplemental Kujo 1.8.0 verification

On 2026-10-07, the unchanged `v1.0.2` source (`567518a2d9d39ff77da52b5fb1fca4546984c197`) passed 104 verification commands and the tagged archive smoke test using the checksum-verified official Kujo 1.8.0 macOS Intel binary. The [receipt](compatibility/kujo-1.8.0-2026-10-07.json) records commands, exits, log digests and runtime identity. No tests, assertions or budgets were changed. This adds current-runtime evidence for the measured host; it does not relabel the historical integration source pins or imply unmeasured 1.8 platform certification.

## Protected-main publication

Dispatch `release.yml` from `main` with `publish_release=true` and the existing `release_tag`. The workflow validates that the exact tag matches VERSION and is an ancestor of the dispatch commit, then checks out that immutable source for every gate and archive operation. The publish job checks out the verified source output and checks the tag again. Workflow identity and archive source identity are separate. The protected `release` environment and reviewer approval remain required; tag-triggered runs verify only. No tag movement or environment-policy change is needed when documentation advances main after tagging.
