# Enterprise roadmap review — completed in v0.4.0

Every item from the v0.3.0 production-readiness list was completed and evidenced in v0.4.0.

## P0 — trust and tenancy

- [x] HSM/KMS signing-provider contract: `src/signing_provider.kujo`, v1.2 envelopes, federated workload identity, offline external-provider test.
- [x] Trusted-key lifecycle: `src/policy.kujo`, `schemas/trust-policy.schema.json`, active/rotating/revoked/expired status, validity, rotation, revocation, and allowed targets.
- [x] Authorization boundary: default-deny identity/role policies authorize CLI actions; no network API was introduced.

## P1 — durable operations

- [x] Remote immutable artifact-store interface: local reference plus complete conditional HTTP PUT/finalize/GET contract and object versioning.
- [x] Per-run locking and crash recovery: atomic owner-token locks, stale recovery, seal journals, and interrupted-seal restoration tests.
- [x] Retention/legal hold/deletion: sealed retention metadata, post-seal external hold history, whole-run deletion, and external tombstones.
- [x] External metrics/audit: redacted JSONL/HTTP telemetry export outside sealed runs.

## P1 — contract depth

- [x] Complete schema validation: Kujo `json_schema_validate` executes 17 schemas across config, policies, emitted evidence, telemetry, bundles, and store indexes.
- [x] Property/fuzz coverage: 500 generated CLI cases, 500 safe paths plus traversal corpus, config boundaries, Unicode bytes, corrupt JSONL, and signature mutations.
- [x] Provider responses: full object types, required fields, ranges, enums, arrays, and additional-property rules are enforced before persistence.

## P2 — scale and experience

- [x] Scale budgets: 256 KiB-class strategic-five hearing, artifact/context measurement, cursor inventory benchmark, 45-second hearing, 3-second pagination, and 256 MiB deployment RSS budget.
- [x] Pagination: bounded cursor pages with `nextCursor`/`hasMore` and CLI support.
- [x] Signed bundles and CI: trusted export/import, Kujo ZIP archiving, tag workflow, external signer, validation, artifact upload, and release attachment.
- [x] Read-only UI evaluation: authorized static dashboard selected; network UI explicitly deferred until transport authentication/tenancy is designed.

## Exit evidence

- Threat model: [THREAT_MODEL.md](THREAT_MODEL.md)
- Schemas: 17 executable files under `schemas/` at v0.4.0
- Tests: 91 core + 44 CLI + 37 enterprise + 13 property assertions at v0.4.0
- Performance gates: `scripts/perf_gate.kujo` and `scripts/scale_perf_gate.kujo`
- Operations: [OPERATIONS.md](OPERATIONS.md)
- Release evidence: [RELEASE_EVIDENCE.md](RELEASE_EVIDENCE.md)
- Handoff: [NEXT_SESSION_HANDOFF.md](NEXT_SESSION_HANDOFF.md)

The Kujo-only runtime, blind testimony, stop-the-line behavior, and sealed evidence immutability remained intact.
