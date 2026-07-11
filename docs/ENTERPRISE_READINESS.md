# Enterprise readiness

## Current posture

Tribunal v0.5.0 provides a strong production-oriented application core for enterprise decision evidence: default-deny authorization, external managed signing, trusted-key lifecycle, immutable versioned stores, concurrency/recovery, retention/legal hold/deletion, external telemetry, executable schemas, adversarial property gates, cursor pagination, release budgets, CI publication, a safe offline dashboard, and a combined audit command.

That is not a universal deployment certification. Identity proofing, policy provenance/distribution, real HSM/store adapters, tenant mapping, encryption, network controls, platform support, recovery objectives, and capacity evidence remain deployment responsibilities.

Deployment-specific HSM/KMS and HTTP store adapters remain deliberately outside the core. They must be certified against the published Kujo contracts with the target organization's identity, network, custody, retention, and audit controls.

## Deployment matrix

| Area | Built in | Deployment responsibility |
| --- | --- | --- |
| Model boundary | Kujo AI SDK only; provider allowlist | provider account policy and egress |
| Access | default-deny identities, roles, command permissions | identity proofing, policy distribution, tenant mapping |
| Signing | external Kujo provider contract; federated identity allowlist | HSM/KMS adapter, key custody and availability |
| Trust | status, validity, rotation, revocation, target restrictions | independent policy/public-key distribution |
| Evidence | exact hashing, v1.0–v1.2 verification, bundles | storage IAM, backup, regional durability |
| Artifact store | conditional local/HTTP immutable versions | authenticated HTTP implementation and SLAs |
| Concurrency | atomic per-run locks and seal rollback journals | multi-host coordination if sharing non-local filesystems |
| Governance | sealed retention, external holds, whole-run tombstones | legal policy, approvals, retention schedule |
| Audit | redacted JSONL/HTTP telemetry | collector durability, SIEM access and alerting |
| Verification | one-command integrity/contracts/trust audit | policy provenance, review cadence, incident response |
| Experience | offline CSP dashboard | authenticated hosting if an organization chooses to publish it |

## Threat and authorization boundary

The detailed threat model is [THREAT_MODEL.md](THREAT_MODEL.md). No network API is included. The access policy settles application permissions, but a future service still requires transport authentication, tenant isolation, rate limits, request-size limits, CSRF/CORS policy, secure headers, and network threat testing before exposure.

## Release evidence

A releasable commit must pass:

- every Kujo source check;
- 92 core, 48 CLI, 44 enterprise, and 18 property assertions;
- 18 executable JSON Schemas;
- Concord with no high/critical drift;
- strict Spec validation;
- ten Eval checks;
- local and scale performance gates;
- `tribunal doctor --json` with zero failures;
- signed release bundle creation through an external provider.

See [RELEASE_EVIDENCE.md](RELEASE_EVIDENCE.md) and [NEXT_SESSION_REVIEW.md](NEXT_SESSION_REVIEW.md).
