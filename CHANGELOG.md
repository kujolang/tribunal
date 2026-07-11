# Changelog

## Unreleased

## 0.3.0 - 2026-07-11

- Hardened artifact storage and sealing against traversal, symbolic links, oversized input, and character/byte length confusion.
- Bound signature metadata into the signed v1.1 payload while retaining v1.0 verification compatibility; made 4096-bit RSA the CLI default.
- Added strict config and CLI contracts, bounded docket/context/model/process resources, provider subprocess environment isolation, expanded secret detection, and model-output safety checks.
- Added `validate`, `doctor`, `stats`, filtered/JSON `list`, JSON catalog/show output, and strict signature requirements for verify/replay.
- Made RunLedger and CaseFile ingestion idempotent and redacted downstream process errors.
- Moved bridge code under `src/bridges`, moved example config under `examples`, and added operations, security, enterprise-readiness, contribution, and next-session guidance.
- Expanded validation to 91 core assertions, 25 CLI assertions, nine schemas, and a deterministic local performance budget.

## 0.2.0 - 2026-07-10

- Reimplemented the CLI, hearing engine, model boundary, context construction, persistence, integrity, signing, ingestion, and validation gates in Kujo.
- Preserved the completed TypeScript implementation on the pushed `typescript` branch.
- Replaced Node/npm build and test dependencies with Kujo runtime checks, 73 core assertions, 14 CLI integration assertions, a Kujo schema gate, Concord, Spec, and Eval.
- Replaced Ed25519 sealing with Kujo-native RSA-PKCS#1 v1.5 SHA-256 signing and added a native `keys` command.
- Preserved SDK-owned preference resolution, real RunLedger/CaseFile ingestion, PackWrite context, full artifact hashing, and sealed-run immutability.

## 0.1.0 - 2026-07-10

- Added the Tribunal MVP with offline deterministic review, explicit staged hearings, three panel presets, five seat contracts, stop-the-line records, CLI replay/export, and Kujo AI SDK live bridge.
