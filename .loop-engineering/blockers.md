# External Blockers

blockers:
  - id: independent-security-assessment
    command: "scripts/security_review_gate.kujo"
    evidence: "The commissioned report must be authored by an assessor independent from implementation, bind the exact Tribunal and Kujo revisions, carry verifiable signed provenance, and supply findings that maintainers can map to regression fixtures. A self-review or empty register cannot satisfy this requirement."
    status: external-assessor-required
    next_action: "Engage the commissioned assessor and import the signed report plus accepted-finding fixtures."
  - id: maintained-platform-and-shared-filesystem-runners
    command: ".github/workflows/compatibility.yml; scripts/multi_host_worker.kujo; scripts/multi_host_report.kujo"
    evidence: "The v0.7 x86 receipts remain preserved, but the v0.8 candidate has no maintained arm runner receipt and no two-host NFS/SMB/shared-filesystem mounts were available. Local processes or synthetic mounts are not represented as multi-host certification."
    status: external-infrastructure-required
    next_action: "Run the exact revision and runtime digest on maintained arm64 plus every claimed shared filesystem, then publish mount/version/contention/recovery receipts."
  - id: organization-live-certification
    command: "scripts/vault_live_certification.kujo; scripts/http_store_conformance.kujo"
    evidence: "No organization-owned Vault workload identity, authenticated HTTP-store profiles, audit-log export, backup administration, or regional fault environment was available. Reference fixtures do not establish deployment certification."
    status: external-credentials-and-infrastructure-required
    next_action: "Supply approved organization profiles and preserve identity/audit/denial/backup/recovery evidence bound to the release revision."
  - id: signed-kennel-publication
    command: "kennel publish/install/upgrade/rollback/offline restore"
    evidence: "No approved registry/mirror signing identity or publication authorization was available, and loop policy blocks release actions. Local Kennel validation is not package publication."
    status: release-authorization-required
    next_action: "Authorize the approved registry/mirror and signing identity, then publish and capture immutable checksum/provenance lifecycle receipts."
  - id: next-ecosystem-releases
    command: "scripts/integration_matrix_gate.kujo"
    evidence: "The adjacent repositories do not currently expose a next released version for every pinned Tribunal integration. Testing mutable HEAD would not satisfy the released-version requirement."
    status: external-release-required
    next_action: "When each next version is released, pin its immutable tag/commit and publish explicit compatible or incompatible gate results."
  - id: human-accessibility-and-adoption-evidence
    command: "manual screen reader/operator protocol; scripts/adoption_report.kujo"
    evidence: "No independent screen-reader/operator participants, approved privacy review, activated opt-in endpoint, or real cohort-suppressed conversion observations were available. Automated accessibility and zero-count fixtures are not substitutes."
    status: external-human-and-governance-evidence-required
    next_action: "Complete the approved human study and privacy review, then publish only schema-valid suppressed aggregate adoption data."
