# Enterprise readiness

## Current posture

Tribunal is production-capable for local, single-tenant, operator-controlled decision evidence when deployed with external identity, filesystem, secret, key-custody, backup, and monitoring controls.

Built-in controls include strict CLI/config parsing, required process invariants, resource limits and timeouts, secret detection, provider environment isolation, path and symlink defenses, byte-accurate manifests, signed metadata binding, trusted-key verification, stopped-run evidence, JSON contracts, idempotent downstream ingestion, diagnostics, analytics, and offline deterministic gates.

## Deployment matrix

| Area | Built in | Deployment responsibility |
| --- | --- | --- |
| Model boundary | Kujo AI SDK only; provider allowlist | provider account policy and network egress |
| Credentials | no config/record credential fields; child env allowlist | managed secret injection and rotation |
| Evidence | exact artifact hashing and optional RSA signature | immutable storage, retention, backup, legal hold |
| Trust | independent public-key verification | key custody, distribution, rotation, revocation |
| Availability | timeouts, bounded outputs, stopped records | scheduling, retries, capacity, alerting |
| Access | local filesystem boundary | authentication, authorization, service identity |
| Audit | events, receipts, signed handoff | centralized collection and access review |

## Not yet universal enterprise infrastructure

Tribunal does not include multi-tenant authorization, a network service/API, an HSM/KMS signing provider, revocation registry, policy-as-code engine, distributed locking, remote object-storage adapter, centralized telemetry exporter, automated retention/legal hold, or high-availability orchestration. These are explicit integration layers, not hidden claims.

## Release evidence

A releasable commit must pass every Kujo source check, 91 core assertions, 25 CLI assertions, nine schema contracts, Concord drift, strict Spec validation, six Eval checks, the offline benchmark, and interpreter execution. The exact next strengthening slice is maintained in [NEXT_SESSION_REVIEW.md](NEXT_SESSION_REVIEW.md).
