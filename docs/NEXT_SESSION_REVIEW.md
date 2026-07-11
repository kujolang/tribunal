# Next-session review

This is the prioritized work list for the next production-readiness session. Revalidate assumptions before implementation.

## P0 — trust and tenancy

- Design a Kujo signing-provider contract for HSM/KMS-backed signing without exposing private key material to Tribunal.
- Add trusted-key policy files with key status, rotation, revocation, and allowed ingestion targets.
- Define an authorization boundary for multi-user or service deployments before introducing a network API.

## P1 — durable operations

- Add a remote immutable artifact-store interface with conditional writes and object versioning.
- Add per-run locking and crash-recovery tests for concurrent writers and interrupted sealing.
- Add retention/legal-hold metadata and a policy-driven whole-run deletion workflow.
- Export structured metrics and audit events to an external collector without mutating sealed runs.

## P1 — contract depth

- Apply a complete JSON Schema validator to emitted records, events, receipts, rulings, packets, manifests, and signatures rather than structural assertions alone.
- Add property/fuzz tests for CLI tokens, config boundaries, Unicode/byte limits, path normalization, corrupt JSONL, and signature envelopes.
- Add provider-response type/range validation beyond required-field presence.

## P2 — scale and experience

- Benchmark strategic-five hearings with large allowed dockets and context packs; publish memory and latency budgets.
- Add pagination/cursors for very large local run inventories.
- Add signed bundle export/import and CI release publication.
- Evaluate a read-only local UI only after service identity and authorization contracts are settled.

## Exit criteria

The next session should leave updated threat modeling, schemas, tests, benchmarks, operations docs, release evidence, and a new prioritized handoff. Do not weaken Kujo-only runtime, blind testimony, stop-the-line behavior, or sealed evidence immutability.
