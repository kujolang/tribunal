# KUJO ecosystem integration seams

- **Kujo AI SDK:** implemented through `KujoModelClient` and `KujoAiSdkBridge`; the SDK owns model-preference resolution, provider selection, transport, normalized response, error, usage, and latency behavior. Tribunal persists routing provenance but does not reproduce provider policy.
- **RunLedger:** signed ingestion creates and finishes a real RunLedger record with provider/model identity, aggregate usage, ruling verdict, signed-manifest evidence, and decision-packet follow-ups.
- **ChangeBucket:** `record.json` can accept a future source-change reference in docket context. Change footprint should be computed externally and attached as evidence, not reimplemented.
- **PackWrite:** optional context enrichment calls PackWrite's deterministic repository-context collector through an isolated Kujo bridge. It excludes secret-looking paths and does not invoke a model.
- **Muzzle:** no MVP compression. A future adapter may compress the context before the blind stage if it preserves hashes and records the transformation.
- **CaseFile:** signed ingestion creates a real manual CaseFile and copies the verified signature, manifest, ruling, decision packet, and receipt into `tribunal-evidence/`, plus an ingestion receipt.
- **Concord:** `npm run concord:gate` runs emitted JSON Schema validation, a full Concord drift scan, and an exact CLI help-command check. The repository Spec and Eval suite are the acceptance source.
- **Strata:** `ruling.md`, `decision-packet.md`, and `receipt.json` have stable headings/fields and contain no credentials, making them index-ready.
- **Paperclip:** see `paperclip-skill.md`; no control-plane calls are embedded.
- **BZBY:** see `bzby.md`; no dashboard dependency is embedded.
