# Installation, compatibility, upgrade, and rollback

## Kennel

With Kujo 1.0.0+ and Kennel available:

```bash
kujo run /path/to/kennel/kennel.kujo --interpreter -- add github:kujolang/tribunal@v0.7.0 --alias tribunal
kujo run /path/to/kennel/kennel.kujo --interpreter -- install
kujo run /path/to/kennel/kennel.kujo --interpreter -- validate
```

The package exports `tribunal` (`src/lib.kujo`), `config`, `contracts`, `panels`, and `compare`. Pin a tag or commit and commit `kennel.lock`; mutable refs are unsuitable for production. Registry checksum/signature policy should be populated by the consuming organization.

## One-command first run

From a checkout, set `KUJO_BIN` and run `kujo run tribunal.kujo --interpreter -- review examples/product-decision.md --panel executioner-only --mock`. It is offline and credential-free.

## Compatibility

Tribunal's v0.8 development line requires Kujo 1.0.0 at revision `f8ec5a3aa8976b65e199154374c9bb9826bad6d4` or a later release containing its nested-runtime, device/mode, private-file, streaming AEAD, and HTTP file-transfer primitives. Tribunal 0.7.x release artifacts retain their previously pinned runtime. Library API 1.x, run schemas 1.x, signature verification for legacy v1.0/v1.1 and provider v1.2 envelopes, and bundle schema 1.0 remain supported. Optional integrations are certified only for versions listed in `docs/INTEGRATION_MATRIX.md`. The measured 0.7.0 platform set is macOS x86_64 and Linux x86_64; macOS arm64, Linux arm64, and Windows remain unsupported until the same pinned release gates publish passing receipts. See `docs/PLATFORM_SUPPORT.md` for the exact revisions and claim boundaries.

## Upgrade

Back up run storage, external legal-hold/governance data, trust policies, signer configuration, and the persistent index. Verify all existing runs before changing versions. Install the pinned release, run `doctor`, `index-check`, schema gates, and a mock hearing, then validate a sample of signed historical runs with the independently distributed trust policy. Rebuild the index only when verification requests it; index rebuild does not alter sealed runs.

## Rollback

Stop writers, restore the prior pinned package/runtime pair and configuration, then run `doctor`, `index-check`, and signed-run verification. Do not downgrade or rewrite evidence schemas. Newer sealed evidence remains immutable; if an older reader cannot understand a new public contract, retain it and use the newer verifier. Restore an index from backup or rebuild it from manifests. Record the rollback decision and validation receipts outside sealed run directories.
