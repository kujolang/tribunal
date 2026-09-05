# Contributing

Tribunal is Kujo-native. Changes on `main` must not introduce Node, npm, TypeScript, JavaScript, Python, or provider-SDK runtime dependencies.

## Development contract

1. Keep hearing orchestration provider-neutral; live model behavior belongs behind Kujo AI SDK.
2. Preserve the blind-first-pass, decision-packet, stop-the-line, and sealed-run immutability invariants.
3. Update JSON schemas and docs with every public contract change.
4. Add deterministic offline tests for fixes and new behavior.
5. Never place secrets, private keys, generated runs, or downstream stores in commits.

## Required gates

Set `TRIBUNAL_HOME` to the repository and `KUJO_BIN` to the pinned Kujo runtime. Check every `.kujo` file, then run the four main test suites plus focused hardening regressions and every release gate documented in the README, including compatibility and local Markdown links.

Changes to identity, signing, trust, locking, governance, artifact stores, telemetry, bundles, or release publication must update the threat model and add failure-path tests. Never weaken conditional writes, separate trust anchors, legal-hold precedence, transaction rollback, or default-deny behavior for convenience.

Keep application code under `src/`. Root Kujo files are limited to the thin entrypoint and Spec contract; conventional release/project metadata remains at root. External outputs must never be written into `tribunal.storage_dir`.

Commits should be small and describe one meaningful contract or capability. Keep generated evidence outside the repository.
