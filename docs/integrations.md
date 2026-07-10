# Kujo ecosystem integrations

- **Kujo AI SDK:** `src/model.kujo` invokes the Kujo bridge. The SDK owns model-preference resolution, provider policy, transport, response normalization, error metadata, token usage, and latency evidence.
- **RunLedger:** trusted ingestion runs `runledger.kujo` with the Kujo runtime and records provider/model identity, usage, verdict, signed-manifest evidence, and decision-packet follow-ups.
- **CaseFile:** trusted ingestion runs `casefile.kujo`, creates a manual case, and preserves the verified manifest, signature, ruling, packet, receipt, and ingestion receipt.
- **PackWrite:** optional context enrichment invokes the deterministic repository-context collector through a Kujo bridge and never calls a model.
- **Concord:** `scripts/drift_gate.kujo` runs a real Concord scan and rejects high or critical drift. `scripts/schema_gate.kujo` validates schema documents and emitted Kujo runtime contracts.
- **Spec/Eval:** `tribunal.spec.yml` and `tests/tribunal_eval.json` execute only Kujo runtime/tool commands.
- **ChangeBucket:** change evidence can be attached externally by run ID and manifest digest; Tribunal does not duplicate change analysis.
- **Muzzle:** future context compression must preserve the immutable-context digest and blindness boundary.
- **Strata:** ruling, packet, and receipt artifacts have stable headings/fields suitable for indexing.
- **Paperclip:** see `paperclip-skill.md`; Tribunal embeds no control-plane calls.
- **BZBY:** see `bzby.md`; Tribunal embeds no dashboard dependency.
