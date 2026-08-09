# Tribunal 1.0.0 release-owner checklist

Tribunal 1.0.0 is a stable local or operator-controlled decision-evidence engine. This checklist does not certify hosted, regulated, multi-tenant, shared-filesystem, identity-provider, remote-custody, or organization-specific deployments. Those environments require their own controls and certification.

The release owner must use the exact candidate revision, Kujo runtime revision, commands, evidence paths, and results recorded below. An unchecked item is not complete.

## Candidate identity

- Product version: `1.0.0`
- Candidate commit: recorded in the completed verification section after the candidate is frozen
- Kujo runtime: `1.0.0` at `9b77dce592047121cb71066629836ad89252f3ce`
- Runtime binary digest: recorded in each platform and archive receipt
- API version: `1.0.0` (independent contract)
- Evidence/schema format versions: independently versioned; see [v1 compatibility](V1_COMPATIBILITY.md)

## Completed and verified

- [ ] Focused checks pass at the exact candidate commit: version, doctor, source check, main tests, CLI integration, schema gate, and `git diff --check`.
- [ ] The complete release-workflow gate inventory passes at that commit.
- [ ] Local Markdown links pass `scripts/docs_link_gate.kujo`.
- [ ] ShipCheck `scan` and `gate` pass; record its exact check count.
- [ ] The reproducible `tribunal-v1.0.0.zip`, `SHA256SUMS`, SPDX SBOM, in-toto provenance, archive receipt, and install-from-archive smoke test all pass.
- [ ] A Workcell receipt verifies representative happy and failure paths for the exact candidate and pinned runtime image.
- [ ] Each supported platform has a passing receipt that names the exact candidate and runtime digest.
- [ ] The working tree is clean and the release-preparation branch is pushed.

The final verification record must include commands, exit codes, platform details, Workcell run ID, and absolute or repository-relative evidence paths. Historical 0.7.0 receipts do not satisfy these items.

## External infrastructure requirements

- [ ] The self-hosted GitHub Actions runner labelled `self-hosted, kujo` exists and exposes the pinned Kujo binary through `KUJO_BIN`.
- [ ] `KUJO_ECOSYSTEM_TOKEN` can read every private repository and exact revision in [the integration matrix](INTEGRATION_MATRIX.md).
- [ ] The configured signing provider and `TRIBUNAL_SIGNING_PROVIDER_CONFIG` are available to the release workflow.
- [ ] GitHub Actions can run the measured platform matrix and retain its immutable receipt artifacts.
- [ ] Repository rulesets and branch protection are reviewed by a repository administrator; this preparation does not change them.

Missing external infrastructure must have a blocker receipt. A substitute local run may narrow risk, but it is not the unavailable certification.

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
