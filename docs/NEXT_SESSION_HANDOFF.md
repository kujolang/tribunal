# Next-session handoff

Tribunal v0.4.0 completes the application roadmap. The next session should validate deployment adapters rather than add unbounded core surface.

## P0 — certify real adapters

- Run a live AWS KMS, Azure Key Vault, or HSM adapter conformance test using federated identity and preserve the provider audit receipt.
- Stand up an authenticated HTTP artifact-store implementation and run conditional-write, partial-upload, tenant-isolation, corruption, and disaster-recovery drills.
- Exercise trust-policy rotation and emergency revocation propagation across two independent operator environments.

## P1 — deployment evidence

- Add supervisor-enforced 256 MiB RSS evidence until Kujo exposes peak resident memory natively.
- Test lock semantics on the target shared filesystem; introduce distributed coordination only if the deployment uses multi-host writers.
- Connect telemetry to the target SIEM and prove redaction, retention, alerting, and access review.
- Run retention expiry, legal hold, release, deletion approval, and tombstone restore/audit drills with governance owners.

## P2 — product choices

- Decide whether a hosted read-only service is justified. If yes, write the transport-authentication and tenant-isolation spec before implementation.
- Evaluate schema migrations and bundle compatibility when the first v2 evidence contract is proposed.
- Measure real provider strategic-five latency/cost separately from deterministic orchestration performance.

## Starting commands

```bash
tribunal doctor --json --config <production-config>
tribunal auth-check --permission runs.create --config <production-config>
kujo run tests/enterprise_tests.kujo
kujo run scripts/scale_perf_gate.kujo
```
