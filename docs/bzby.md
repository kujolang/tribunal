# BZBY future analytics path

BZBY can consume the external `telemetry-export` contract or independently index verified `manifest.json`, `events.jsonl`, `record.json`, and `receipt.json` to provide:

- hearing throughput and completion/stopped rates;
- disposition and confidence distributions;
- panel, seat, provider, model, latency, and token analysis;
- recurring kill-pass flaws, escalation triggers, and required changes;
- time from ruling to accepted evidence;
- decision reversals or repeated review patterns.

Dashboards should use run IDs and content hashes as join keys, preserve stopped/partial records, distinguish mock from live evidence, and never ingest raw environment values. Tribunal v0.6.0 includes a dependency-free offline dashboard export for local inspection; it still embeds no BZBY or network-service dependency.
