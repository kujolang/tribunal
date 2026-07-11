# Contributing

Tribunal is Kujo-native. Changes on `main` must not introduce Node, npm, TypeScript, JavaScript, Python, or provider-SDK runtime dependencies.

## Development contract

1. Keep hearing orchestration provider-neutral; live model behavior belongs behind Kujo AI SDK.
2. Preserve the blind-first-pass, decision-packet, stop-the-line, and sealed-run immutability invariants.
3. Update JSON schemas and docs with every public contract change.
4. Add deterministic offline tests for fixes and new behavior.
5. Never place secrets, private keys, generated runs, or downstream stores in commits.

## Required gates

Set `TRIBUNAL_HOME` to the repository and `KUJO_BIN` to a current Kujo runtime. Check every `.kujo` file, then run both test suites and the schema, drift, Spec, benchmark, and Eval gates documented in the README.

Commits should be small and describe one meaningful contract or capability. Keep generated evidence outside the repository.
