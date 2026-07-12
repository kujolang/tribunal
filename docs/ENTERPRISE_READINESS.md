# Enterprise readiness

## Current posture

Tribunal v0.7.0 provides a strong production-oriented application core for enterprise decision evidence: default-deny authorization, external managed signing, trusted-key lifecycle, immutable versioned stores, concurrency/recovery, retention/legal hold/deletion, external telemetry, executable schemas, adversarial property gates, persistent sharded indexing, bounded projections, resumable lineage, custom panels, a stable Kujo library API, reproducible releases, CI compatibility receipts, a safe offline dashboard, and a combined audit command.

That is not a universal deployment certification. Identity proofing, policy provenance/distribution, target HSM/store certification, tenant mapping, encrypted-volume custody, network controls, platform receipts, independent assessment, recovery objectives, and capacity evidence remain deployment responsibilities.

The repository includes Vault Transit and authenticated immutable HTTP reference adapters and conformance harnesses. Reference evidence is not a target deployment certification; run the harnesses with the organization's identity, network, custody, retention, and audit controls.

## Concrete supported deployment profile

The supported 0.7.0 profile is an operator-controlled process on a platform with a passing release receipt; local non-symlinked storage on one filesystem; one active writer per run; default-deny local or policy identity; mock or Kujo AI SDK provider boundary; managed external signer for production provenance; independently distributed trust policy; external encrypted volume; local immutable or certified HTTPS artifact store; and external telemetry/dashboard outputs. Multi-host writers are supported only for a shared filesystem that passes the two-host harness and preserves its receipt.

Explicit non-goals are a public hosted service, ambient credentials, direct provider SDK calls, hidden policy prompts, automatic stale-lock theft, local key-file custody as the production recommendation, universal filesystem/platform claims, legal advice, and claims that mock/reference evidence certifies a deployment.

## Deployment matrix

| Area | Built in | Deployment responsibility |
| --- | --- | --- |
| Model boundary | Kujo AI SDK only; provider allowlist | provider account policy and egress |
| Access | default-deny identities, roles, command permissions | identity proofing, policy distribution, tenant mapping |
| Signing | external Kujo provider contract; federated identity allowlist | HSM/KMS adapter, key custody and availability |
| Trust | status, validity, rotation, revocation, target restrictions | independent policy/public-key distribution |
| Evidence | exact hashing, v1.0–v1.2 verification, bundles | storage IAM, backup, regional durability |
| Artifact store | conditional local/HTTP immutable versions | authenticated HTTP implementation and SLAs |
| Concurrency | atomic per-run locks, wait/contention metrics, explicit recovery, multi-host harness | certify target shared filesystem or add external coordination |
| Governance | sealed retention, external holds, whole-run tombstones | legal policy, approvals, retention schedule |
| Audit | redacted JSONL/HTTP telemetry | collector durability, SIEM access and alerting |
| Verification | one-command integrity/contracts/trust audit | policy provenance, review cadence, incident response |
| Experience | accessible offline CSP dashboard and stable Kujo library | authenticated static hosting if an organization chooses to publish it |

## Threat and authorization boundary

The detailed threat model is [THREAT_MODEL.md](THREAT_MODEL.md). No network API is included. The access policy settles application permissions, but a future service still requires transport authentication, tenant isolation, rate limits, request-size limits, CSRF/CORS policy, secure headers, and network threat testing before exposure.

## Release evidence

A releasable commit must pass:

- every Kujo source check;
- all four current test suites and every executable JSON Schema;
- Concord with no high/critical drift;
- strict Spec validation;
- seventeen Eval checks;
- local, scale, index, load/chaos, adversarial, accessibility, integration, gallery, and platform gates;
- `tribunal doctor --json` with zero failures;
- signed release evidence plus reproducible archive/SBOM/provenance creation.

See [RELEASE_EVIDENCE.md](RELEASE_EVIDENCE.md) and [NEXT_SESSION_REVIEW.md](NEXT_SESSION_REVIEW.md).
