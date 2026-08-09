# Independent security review commission

Commission ID: `tribunal-independent-review-2026-07`

Tribunal invites an assessor who did not author the implementation to review the threat model and Kujo source. The assessor must be organizationally independent of implementation approval and receive the exact commit digest, Kujo runtime version, supported deployment profiles, test evidence, and this scope before starting.

Scope includes filesystem and symlink boundaries; signature, trust, provenance, encryption, and key rotation; stopped/resumed lineage; provider and connector isolation; HTTP store and telemetry clients; resource exhaustion and malicious response handling; authorization, retention, legal hold, deletion; release provenance; and all claims in README and enterprise-readiness documentation.

The assessor should deliver a signed report with methodology, tested revision, severity rationale, reproduction steps, and explicit limitations. Maintainers triage every item in `accepted-findings.json`. Each accepted item must name an executable regression fixture before the security review gate can pass. Rejected items require rationale in the assessor report; risk acceptance requires an owner and expiry date in a separate governance record.

Status is `commissioned`. This repository does not claim that an independent assessment has completed; changing status to `complete` requires the assessor's signed report to be added under this directory and referenced from the findings register.
