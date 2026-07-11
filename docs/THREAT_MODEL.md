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
| Path/symlink/namespace escape | constrained run IDs and artifact paths, exclusive run creation, symlink rejection, external-output boundaries | symlinked ancestors and underlying filesystem compromise |
| Resource exhaustion | docket/context/model/process/artifact/manifest/bundle/policy limits and timeouts | aggregate scheduling/capacity and response buffering |
| Secret leakage | docket/model scans, redaction, child environment allowlists | novel secret formats and malicious providers |
| Unauthorized deletion | retention, serialized legal hold, permission gate, precommitted whole-run tombstone | external tombstone/governance registry custody |
| Telemetry mutation | external-only redacted projection | collector compromise or retention failure |
| Store replay/race | validated bounded metadata, expected-version conditional finalization, immutable objects, HTTPS outside loopback | incorrect HTTP adapter semantics |
| UI injection | HTML escaping, no scripts, restrictive CSP | unsafe third-party hosting transformations |
| Supply-chain release | full gates and externally signed CI evidence | runner/action/adaptor compromise |

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

Review this model whenever a new provider, store, collector, filesystem, identity system, or network surface is introduced.
