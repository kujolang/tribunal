# Release evidence

The tag workflow at `.github/workflows/release.yml` runs on a self-hosted runner labeled `kujo`. Repository variables provide the Kujo executable and an external signing-provider config. GitHub OIDC permission is available for federated HSM/KMS adapters; long-lived cloud secret variables are not forwarded by Tribunal.

The workflow checks every Kujo file and executes all four test suites and all gates. `scripts/release_evidence.kujo` then performs the release hearing, external seal, contract validation, bundle export, Kujo ZIP creation, and release receipt entirely in Kujo. CI uploads the evidence directory and attaches the ZIP to tagged releases.

Release approvers should retain:

- commit and tag;
- workflow run and runner identity;
- all gate output;
- signed bundle and ZIP SHA-256;
- signer reference and trusted-key policy version;
- benchmark results;
- deployment approval and rollback decision.

The provider and runner are deployment dependencies. A green workflow does not replace HSM audit logs or independent trust-policy distribution.
