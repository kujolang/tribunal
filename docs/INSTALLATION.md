# Installation, compatibility, upgrade, and rollback

## Requirements

Tribunal 1.0.0 requires Kujo 1.0.0 and Bash for the packaged `bin/tribunal` launcher. Release reproduction pins Kujo commit `9b77dce592047121cb71066629836ad89252f3ce`; use the runtime digest in the candidate platform or archive receipt. Put `kujo` on `PATH` or set `KUJO_BIN`/`KUJO` to the absolute executable path. Rebuilding and smoke-testing the release ZIP also requires Python 3 and `unzip`. Supported platforms are limited to the v1 receipts in [PLATFORM_SUPPORT.md](PLATFORM_SUPPORT.md).

## Source checkout

After the release owner creates the verified tag:

```bash
git clone https://github.com/kujolang/tribunal.git
cd tribunal
git checkout v1.0.0
export KUJO_BIN=/absolute/path/to/kujo
./bin/tribunal version
./bin/tribunal doctor --json
```

Before the tag exists, release preparation uses the exact candidate commit recorded in [launch-checklist.md](launch-checklist.md). Mutable branches are not release inputs.

## Generated archive

Obtain `tribunal-v1.0.0.zip`, `release-archive-receipt.json`, and the published checksum from the approved release channel. Follow [RELEASE_VERIFICATION.md](RELEASE_VERIFICATION.md), extract into a new directory, then run:

```bash
export KUJO_BIN=/absolute/path/to/kujo
./bin/tribunal version
./bin/tribunal doctor --json
./bin/tribunal review examples/product-decision.md --panel executioner-only --mock
```

The archive contains `SHA256SUMS`, `SBOM.spdx.json`, and `provenance.intoto.json`. Installation smoke coverage executes the launcher from a freshly extracted archive and confirms version, doctor, validation failure, and a successful mock hearing.

## Kennel

With Kennel 1.0.0 and Kujo available:

```bash
kujo run /path/to/kennel/kennel.kujo --interpreter -- add github:kujolang/tribunal@v1.0.0 --alias tribunal
kujo run /path/to/kennel/kennel.kujo --interpreter -- install
kujo run /path/to/kennel/kennel.kujo --interpreter -- validate
```

The package exports `tribunal` (`src/lib.kujo`), `config`, `contracts`, `panels`, and `compare`. Pin the immutable tag or exact commit and commit `kennel.lock`; configure registry checksum/signature policy through the consuming organization. Package publication is not part of repository release preparation.

## Compatibility

Product/CLI 1.0.0, library API 1.0.0, configuration, record, export/import, and evidence compatibility are defined in [V1_COMPATIBILITY.md](V1_COMPATIBILITY.md). Signature envelope 1.0.0, 1.1.0, and provider 1.2.0 remain readable. Portable bundle schema 1.0.0 and encrypted-bundle schemas 1.0.0/1.1.0 remain independent from the product version. Optional local integrations are supported only at the exact revisions in [INTEGRATION_MATRIX.md](INTEGRATION_MATRIX.md).

## Upgrade

1. Stop writers and back up run storage, external legal-hold/governance data, trust policies, signer configuration, and the persistent index.
2. Run `verify` or `audit --require-signature` on representative historical evidence before changing versions.
3. Install the pinned Tribunal/Kujo pair and run `doctor`, `index-check`, `scripts/schema_gate.kujo`, `scripts/v1_compatibility_gate.kujo`, and a mock hearing.
4. Re-verify representative signed historical runs using the independently distributed trust policy. Rebuild the index only when verification requests it; index rebuild does not alter sealed runs.

## Rollback and troubleshooting

Stop writers, restore the prior pinned package/runtime pair and configuration, then run `doctor`, `index-check`, and signed-run verification. Do not downgrade or rewrite evidence schemas. Newer sealed evidence remains immutable; if an older reader cannot understand a contract, retain it and use the compatible newer verifier. Restore the external index from backup or rebuild it from manifests, and record the rollback decision outside sealed run directories.

If the launcher cannot find Kujo, set `KUJO_BIN` or `KUJO` to an executable. If `doctor` reports missing optional integrations, install the pinned checkout only for the feature being used. Reject symlinked run storage, external output paths inside run storage, insufficient write access, untrusted keys, unsupported schemas, or platform/runtime digests not covered by the release receipt.
