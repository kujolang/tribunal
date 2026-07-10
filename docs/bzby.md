# BZBY future analytics path

BZBY can index `manifest.json`, `events.jsonl`, `record.json`, and `receipt.json` to provide:

- hearing throughput and completion/stopped rates;
- disposition and confidence distributions;
- panel, seat, provider, model, latency, and token analysis;
- recurring kill-pass flaws, escalation triggers, and required changes;
- time from ruling to accepted evidence;
- decision reversals or repeated review patterns.

Dashboards should use run IDs and content hashes as join keys, preserve stopped/partial records, distinguish mock from live evidence, and never ingest raw environment values. Tribunal intentionally ships no BZBY UI or network integration in the MVP.
