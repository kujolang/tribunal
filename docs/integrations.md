# KUJO ecosystem integration seams

- **Kujo AI SDK:** implemented through `KujoModelClient` and `KujoAiSdkBridge`; the SDK retains provider selection, transport, normalized response, error, usage, and latency ownership.
- **RunLedger:** `receipt.json` records run identity, status, timing, invocation counts, token totals, record hash, and runtime identity. A future importer can translate it without changing hearings.
- **ChangeBucket:** `record.json` can accept a future source-change reference in docket context. Change footprint should be computed externally and attached as evidence, not reimplemented.
- **PackWrite:** `context.md` is the current context-pack port. A PackWrite adapter can replace construction while preserving the immutable blind input contract.
- **Muzzle:** no MVP compression. A future adapter may compress the context before the blind stage if it preserves hashes and records the transformation.
- **CaseFile:** every run directory is self-contained and has human and machine evidence suitable for case archival.
- **Concord:** schemas in `schemas/` are the local validation surface; a future Concord gate can verify source, docs, and emitted examples together.
- **Strata:** `ruling.md`, `decision-packet.md`, and `receipt.json` have stable headings/fields and contain no credentials, making them index-ready.
- **Paperclip:** see `paperclip-skill.md`; no control-plane calls are embedded.
- **BZBY:** see `bzby.md`; no dashboard dependency is embedded.
