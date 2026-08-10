# Threat model

## Assets and trust boundaries

Assets are docket content, model output, sealed evidence, private signing material, public trust policy, identity policy, governance records, telemetry, bundles, and artifact-store versions.

Trust boundaries exist at CLI input, config/policy files, docket/context/model output, Kujo AI SDK, signing provider, filesystem, telemetry collector, artifact store, RunLedger/CaseFile, CI, and any operator viewing exported HTML.

## Threats and controls

| Threat | Built-in control | Residual deployment risk |
| --- | --- | --- |
| Privilege escalation | default-deny identity/role permissions; disabled identities | identity proofing and policy-file custody |
| Key theft | opaque signing references; external provider; federated env allowlist | adapter/HSM compromise |
| Revoked-key acceptance | status/validity/target trust policy | stale policy distribution |
| Evidence tampering | byte hashes, exact file set, signed metadata, schema validation | compromised trusted key |
| Concurrent corruption | atomic per-run locks, owner tokens, non-stealing acquisition, seal rollback journal | multi-host/NFS atomicity differs by deployment |
| Path/symlink/namespace escape | ASCII artifact components, canonical-root containment, symlink-ancestor inspection, external-output boundaries, portable device-ID comparison | deployment mount topology and administrator-selected storage roots remain trust inputs |
| Resource exhaustion | cursor pages, 1 MiB transfer/encryption frames, body/header/artifact/aggregate limits, bounded parallelism, timeouts, rate bounds | deployment capacity, external-provider quotas, and operator-selected limits remain environment-specific |
| Secret leakage | built-in, entropy-aware, and organization patterns; match-free findings; redaction; child environment allowlists | novel low-entropy formats and compromised runtime |
| Malicious remote peer | shared slow/truncated/duplicate/bomb/header validation and Kujo-only provider/plugin/store/telemetry fixture server | transport/proxy behavior differs by deployment |
| Resume/re-review substitution | sealed checkpoint and record digests, stable idempotency keys, immutable lineage, source digest recheck | provider must honor idempotency for live replay |
| Custom prompt privilege expansion | signed catalog provenance, schema limits, fixed placeholders, blind peer-denial permission | trusted catalog signer compromise |
| Unauthorized deletion | retention, serialized legal hold, permission gate, precommitted whole-run tombstone | external tombstone/governance registry custody |
| Telemetry mutation | external-only redacted projection | collector compromise or retention failure |
| Store replay/race | validated bounded metadata, expected-version conditional finalization, immutable objects, HTTPS outside loopback | incorrect HTTP adapter semantics |
| UI injection | HTML escaping, no scripts, restrictive CSP | unsafe third-party hosting transformations |
| Supply-chain release | full gates, reproducible archive, checksums, SBOM, provenance, receipts, and optional externally signed CI evidence | release-channel compromise; unsigned releases rely on GitHub repository governance and independently checked archive digests |
| Package/runtime substitution | pinned Kennel/runtime revisions, reproducible archive, SBOM, provenance, platform receipts | trust-policy and release-channel compromise |

## Security invariants

- Tribunal never accepts direct provider SDK ownership.
- Private HSM/KMS key material never enters Tribunal.
- Trust anchors come from a separate policy channel.
- Blind testimony remains isolated until all blind responses persist.
- No post-seal data is added inside a run directory.
- External outputs refuse destinations inside run storage.
- Legal hold cannot be bypassed by forced time expiry.
- Imports and pulls fail closed unless trusted signature verification passes.
- No network API or hosted UI is enabled by this release.
- Private-key file generation remains a development convenience; production custody uses managed signing until Kujo exposes portable restrictive permissions.
- Accepted independent-review findings cannot close without an executable regression fixture.

Review this model whenever a new provider, store, collector, filesystem, identity system, or network surface is introduced. The independent review commission and accepted-finding register live under `docs/security/`.
