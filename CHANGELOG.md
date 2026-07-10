# Changelog

## Unreleased

## 0.2.0 - 2026-07-10

- Reimplemented the CLI, hearing engine, model boundary, context construction, persistence, integrity, signing, ingestion, and validation gates in Kujo.
- Preserved the completed TypeScript implementation on the pushed `typescript` branch.
- Replaced Node/npm build and test dependencies with Kujo runtime checks, 73 core assertions, 14 CLI integration assertions, a Kujo schema gate, Concord, Spec, and Eval.
- Replaced Ed25519 sealing with Kujo-native RSA-PKCS#1 v1.5 SHA-256 signing and added a native `keys` command.
- Preserved SDK-owned preference resolution, real RunLedger/CaseFile ingestion, PackWrite context, full artifact hashing, and sealed-run immutability.

## 0.1.0 - 2026-07-10

- Added the Tribunal MVP with offline deterministic review, explicit staged hearings, three panel presets, five seat contracts, stop-the-line records, CLI replay/export, and Kujo AI SDK live bridge.
