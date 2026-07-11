# Security policy

## Supported version

Security fixes are applied to the latest release on `main`. The `typescript` branch is historical and is not supported for security updates.

## Reporting

Do not open a public issue for a suspected vulnerability. Send a private report to the repository owner with the affected version, reproduction, impact, and any suggested mitigation. Do not include live credentials, private keys, or customer evidence.

## Trust model

Tribunal treats dockets, model output, context providers, run directories, and downstream tool output as untrusted. It rejects obvious secret material; bounds docket, context, model, process, artifact, and integrity-document sizes; constrains relative artifact paths; rejects symlinked evidence; and isolates subprocess environments.

An unsigned SHA-256 manifest proves internal consistency, not provenance. A signed run establishes provenance only when its public key was obtained through a separate trusted channel. `--require-signature` should be mandatory at enterprise ingestion and replay boundaries.

## Key handling

- Generate 4096-bit keys by default; 2048-bit keys exist for compatibility and fast local tests.
- Store private keys outside the repository and run storage.
- Apply operating-system permissions and organizational custody controls immediately after generation.
- Rotate and revoke keys according to organizational policy. Tribunal does not provide a revocation registry.
- Never accept a public key copied from the same untrusted evidence bundle as its trust anchor.

## Deployment guidance

Use a dedicated service identity, a non-symlinked storage root with least-privilege permissions, explicit size/time limits, and an allowlisted provider. Keep live credentials in process environment or a managed secret launcher. Run `tribunal doctor`, strict verification, offline gates, and backup/restore exercises before promotion.

Known production gaps are documented in [docs/ENTERPRISE_READINESS.md](docs/ENTERPRISE_READINESS.md).

## Managed trust and authorization

For shared/service use, enable a default-deny access policy and use an external signing provider. Signing adapters receive only an opaque key reference and recognized federated workload-identity variables. Long-lived cloud access-key variables are not forwarded.

Distribute trust policies independently from evidence. Revoked, expired, out-of-window, and target-ineligible keys fail closed. Treat access policies, trust policies, external governance records, deletion tombstones, telemetry receipts, and artifact-store indexes as high-integrity operational records.

Tribunal exposes no network API. The offline dashboard is escaped, script-free, and CSP-restricted but must still be hosted behind organizational authentication if published.
