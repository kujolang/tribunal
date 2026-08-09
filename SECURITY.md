# Security policy

## Supported versions

Security fixes are applied to the current Tribunal 1.x release line on `main`. The `typescript` branch and pre-1.0 product releases are historical and are not supported for security updates. Supported legacy evidence formats remain readable as described in [the v1 compatibility contract](docs/V1_COMPATIBILITY.md); that does not make the old executable releases supported.

## Reporting

Do not open a public issue for a suspected vulnerability. Send a private report to the repository owner with the affected version, reproduction, impact, and any suggested mitigation. Do not include live credentials, private keys, or customer evidence.

## Trust model

Tribunal treats dockets, model output, context providers, policies, bundles, store responses, run directories, and downstream tool output as untrusted. It rejects obvious secret material; bounds docket, context, model, process, artifact, manifest, bundle, policy, key, and integrity-document sizes; constrains run IDs and relative artifact paths; rejects symlinked evidence; and isolates subprocess environments.

An unsigned SHA-256 manifest proves internal consistency, not provenance. A signed run establishes provenance only when its public key was obtained through a separate trusted channel. `--require-signature` should be mandatory at enterprise ingestion and replay boundaries.

## Key handling

- Generate 4096-bit keys by default; 2048-bit keys exist for compatibility and fast local tests.
- Store private keys outside the repository and run storage.
- Tribunal verifies atomic 0600 private-key creation on the current pinned Kujo runtime. Local key files still depend on host account, backup, volume, and incident controls; deployments requiring managed custody use an external signer.
- Rotate and revoke keys through independently distributed trust policy. Tribunal validates lifecycle state but does not distribute or protect that policy for you.
- Never accept a public key copied from the same untrusted evidence bundle as its trust anchor.

## Deployment guidance

Use a dedicated service identity, a non-symlinked storage root with least-privilege permissions, explicit size/time limits, HTTPS remote adapters, and an allowlisted provider. Keep live credentials in process environment or a managed secret launcher. Prefer managed signing for production because portable restrictive key-file permissions are not yet a Kujo runtime contract. Run `tribunal doctor`, `tribunal audit --require-signature`, offline gates, and backup/restore exercises before promotion.

Known production boundaries are documented in [docs/ENTERPRISE_READINESS.md](docs/ENTERPRISE_READINESS.md). The [independent review commission](docs/security/INDEPENDENT_REVIEW_COMMISSION.md) is published but is not represented as a completed assessment.

## Managed trust and authorization

For shared/service use, enable a default-deny access policy and use an external signing provider. Signing adapters receive only an opaque key reference and recognized federated workload-identity variables. Long-lived cloud access-key variables are not forwarded.

Distribute trust policies independently from evidence. Revoked, expired, out-of-window, and target-ineligible keys fail closed. Treat access policies, trust policies, external governance records, deletion tombstones, telemetry receipts, and artifact-store indexes as high-integrity operational records.

Tribunal exposes no network API. The offline dashboard is escaped, script-free, and CSP-restricted but must still be hosted behind organizational authentication if published.

Run storage is an evidence-only boundary. Tribunal refuses dashboard, telemetry, bundle, archive, key, RunLedger, and CaseFile outputs that would land inside it. Lock acquisition never removes a stale-looking owner automatically; only the explicit operator recovery workflow may do so.
