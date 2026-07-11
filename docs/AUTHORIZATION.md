# Authorization boundary

Tribunal authorizes application actions through a default-deny JSON policy. Identities map to roles; roles contain exact permissions or `*`. Disabled and unknown identities fail closed.

`local` mode is a compatibility boundary for one trusted workstation operator and accepts only `local-operator`. Service accounts, CI, shared hosts, and multi-user execution must use `policy` mode.

Important permissions include `runs.create`, `runs.read`, `runs.verify`, `runs.audit`, `runs.sign`, `runs.ingest`, `runs.delete`, `governance.hold`, `keys.generate`, `contracts.validate`, `bundles.export`, `bundles.import`, `store.publish`, `store.pull`, `telemetry.export`, `dashboard.export`, and `locks.recover`.

The policy identifies authorization, not authentication. A future network service must bind an authenticated subject to the policy identity and add tenant scope. Until that transport contract exists, Tribunal exposes no network API.

Use [examples/access-policy.json](../examples/access-policy.json) as a starting point and protect the production policy as a high-integrity configuration artifact.
