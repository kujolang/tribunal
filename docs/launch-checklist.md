# Tribunal 1.0.0 release-owner checklist

Tribunal 1.0.0 is a stable local or operator-controlled decision-evidence engine. This checklist does not certify hosted, regulated, multi-tenant, shared-filesystem, identity-provider, remote-custody, or organization-specific deployments. Those environments require their own controls and certification.

The release owner must use the exact candidate revision, Kujo runtime revision, commands, evidence paths, and results recorded below. An unchecked item is not complete.

## Candidate identity

- Product version: `1.0.0`
- Candidate commit: `8b476e51c5bc219608c8d9fae3bebdb9101e9462`
- Kujo runtime: `1.0.0` at `9b77dce592047121cb71066629836ad89252f3ce`
- Local macOS x86_64 runtime SHA-256: `a8175b084398a1623cf24cabb6aafb05f316cd6b15eb5e2015089501dd9d8215`; architecture-specific CI digests are in the platform receipts.
- API version: `1.0.0` (independent contract)
- Evidence/schema format versions: independently versioned; see [v1 compatibility](V1_COMPATIBILITY.md)

## Completed and verified

- [x] Focused checks passed at the exact candidate: version `1.0.0`, doctor `0` failures/`0` warnings, source check, main tests `130/0`, CLI integration `55/0`, schema gate `35`, and `git diff --check`.
- [x] The complete release-workflow gate inventory passed at that commit, including enterprise `83/0`, property `21/0`, Eval `19/19`, all performance/chaos/adversarial/security/integration/gallery/compatibility gates, Kennel validation, and doctor.
- [x] Local Markdown links passed: `41` Markdown files, `81` local links, `0` broken.
- [x] ShipCheck `scan` and `gate` exited `0` with `16/16` checks and `0` warnings.
- [x] `tribunal-v1.0.0.zip`, `SHA256SUMS`, SPDX SBOM, in-toto provenance, archive receipt, and install-from-archive happy/failure smoke all passed. Two separate builds produced SHA-256 `c2db1254fec14a87dce6ccd071fcff01d4a628cdbffc37878d5a930bc9a917f5`.
- [x] Workcell run `wc-d6524acbb3cc495180fe03bc911cddc7` verified happy and failure paths at the exact candidate with Linux/amd64 image digest `sha256:06b9499848e1dee3076a415609c74ad44552e218cadebcffb5dd89f578c8beac` and the pinned runtime revision label.
- [x] Exact-candidate receipts pass for Linux x86_64, macOS x86_64, and macOS arm64. Workcell independently proves the bounded packaged-CLI paths on Linux/amd64; platform support comes from the full-gate receipts.
- [x] The release-preparation branch is committed, pushed, and clean after the verification record commit.

Evidence root: `/Users/robertdevore/2026/Kujolang/kujo-repos/.tribunal-release-v1/8b476e5/`. Key files are `macos-x86_64-focused-gates.log`, `macos-x86_64-full-gates.log`, `shipcheck-gate.json`, `workcell-receipt.json`, `workcell-verify.json`, `tribunal-v1.0.0-macos-x86_64.json`, `github-platform-run.json`, `github-platform-jobs.json`, the receipts under `github-platform-artifacts/`, `archive/release-archive-receipt.json`, and `archive-cross-build-comparison.txt`. Historical 0.7.0 receipts do not satisfy v1 items.

The focused commands were the documented `version`, `doctor --json`, `kujo check tribunal.kujo`, main/CLI/schema interpreter gates, and `git diff --check`. The full command inventory was executed in the order defined by `.github/workflows/release.yml`, followed by archive smoke, platform receipt generation, Workcell verification, and the required ShipCheck `scan`/`gate` commands. Every completed gate exited `0`; no threshold was changed or bypassed.

## External infrastructure requirements

- [ ] The self-hosted GitHub Actions runner labelled `self-hosted, kujo` exists and exposes the pinned Kujo binary through `KUJO_BIN`.
- [ ] `KUJO_ECOSYSTEM_TOKEN` can read every private repository and exact revision in [the integration matrix](INTEGRATION_MATRIX.md).
- [ ] The configured signing provider and `TRIBUNAL_SIGNING_PROVIDER_CONFIG` are available to the release workflow.
- [x] GitHub Actions run `31291863267` completed the measured platform matrix for the exact candidate and retained immutable receipt artifacts.
- [ ] Repository rulesets and branch protection are reviewed by a repository administrator; this preparation does not change them.

Missing external infrastructure must have a blocker receipt. A substitute local run may narrow risk, but it is not the unavailable certification.

Blocker receipt: `/Users/robertdevore/2026/Kujolang/kujo-repos/.tribunal-release-v1/8b476e5/external-blockers.json`.

## Deployment-specific certification

- [ ] The target operator certifies identity, authorization, storage, remote-custody, shared-filesystem, HSM/KMS, network, retention, backup, disaster recovery, observability, and incident-response controls that apply to its deployment.
- [ ] Live-provider behavior is tested only with explicit credential authorization and target-specific data-handling controls.
- [ ] Any platform not listed as supported in [measured platform support](PLATFORM_SUPPORT.md) is certified before use.

These items are outside the general Tribunal 1.0.0 local contract and cannot be pre-completed for every deployment.

## Independent review requirements

- [ ] The commissioned independent security review is completed and its verifiable report or attestation is linked in the security review register.
- [ ] Any findings are dispositioned under the published vulnerability and release policy.

Until this is complete, Tribunal may be released only with the documented local/operator-controlled boundary. Do not describe the independent review as completed.

## Reserved for the release owner

- [ ] Confirm the candidate commit is the intended immutable release source.
- [ ] Create the signed release-evidence bundle with the approved signing provider.
- [ ] Create and push the `v1.0.0` tag.
- [ ] Run the tag-triggered release workflow and validate uploaded artifacts.
- [ ] Publish the package or public GitHub release only after verification.
- [ ] Perform any required signing, notarization, or live-provider action under separately approved authority.

No release-preparation task may create the tag, sign, notarize, publish, or use live provider credentials.

## Workcell command template

```bash
export DOCKER_HOST=unix:///Users/robertdevore/.colima/kujo-workcell/docker.sock
export DOCKER_CONFIG=/tmp/kujo-next-batch-docker-config
export TMPDIR=/Users/robertdevore/2026/Kujolang/kujo-repos/.workcell-host-tmp
docker build --platform linux/amd64 \
  --build-arg KUJO_BASE_IMAGE=kujolang/workcell-kujo:tribunal-v1-9b77dce \
  --label org.opencontainers.image.revision=9b77dce592047121cb71066629836ad89252f3ce \
  -t kujolang/workcell-kujo:tribunal-v1.0.0-9b77dce \
  -f docs/workcell-runtime.Dockerfile .
KUJO=../kujo/target/release/kujo ../workcell/bin/workcell run \
  --file docs/workcell-launch-gate.json --repo . --no-pull
KUJO=../kujo/target/release/kujo ../workcell/bin/workcell verify \
  --run .workcell/runs/<run-id> --json
```

The completed record must identify the image digest and prove that its `org.opencontainers.image.revision` is the pinned Kujo revision.
