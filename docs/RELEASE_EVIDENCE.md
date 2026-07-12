# Release evidence

The tag workflow at `.github/workflows/release.yml` runs on a self-hosted runner labeled `kujo`. Repository variables provide the Kujo executable and an external signing-provider config. GitHub OIDC permission is available for federated HSM/KMS adapters; long-lived cloud secret variables are not forwarded by Tribunal.

The workflow checks every Kujo file and executes all four test suites plus schema, drift, Spec, Eval, performance, index, load/chaos, adversarial, accessibility, independent-review-register, integration-matrix, and gallery gates. `scripts/release_evidence.kujo` performs the release hearing, external seal, strict audit, contract validation, bundle export, and signed-evidence receipt. `scripts/release_archive.kujo` separately creates two byte-identical source ZIP builds, an SPDX 2.3 SBOM, an in-toto/SLSA-style provenance statement, checksums, and a reproducibility receipt from pinned source/runtime inputs.

Release approvers should retain:

- commit and tag;
- workflow run and runner identity;
- all gate output;
- signed bundle and ZIP SHA-256;
- `audit-report.json` and its receipt digest;
- signer reference and trusted-key policy version;
- benchmark results;
- reproducible archive receipt, SBOM, provenance, platform compatibility receipts, and integration matrix;
- deployment approval and rollback decision.

The provider and runner are deployment dependencies. The exported signer public key supports audit reproducibility but is not, by itself, a trust anchor. Follow `docs/RELEASE_VERIFICATION.md`; a green workflow does not replace HSM audit logs, independent trust-policy distribution, or the commissioned external security assessment.
