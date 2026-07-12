# Cryptographic algorithm migration

Tribunal's algorithm registry is a fail-closed compatibility contract. The current Kujo runtime exposes RSA signing and verification using PKCS#1 v1.5 with SHA-256, so that algorithm remains the only write algorithm. Existing envelope versions 1.0.0, 1.1.0, and 1.2.0 remain verifiable under an explicit trust policy.

RSA-PSS-SHA256 and Ed25519 are defined as migration targets for envelope 2.0.0. Tribunal rejects both until the Kujo runtime exposes the required primitives and a deployment policy explicitly enables the selected algorithm. It never relabels PKCS#1 v1.5 signatures as PSS or Ed25519.

Migration sequence:

1. Add and regression-test native Kujo sign/verify primitives and known-answer fixtures.
2. Change the matching registry entry to `runtimeAvailable: true` without disabling legacy verification.
3. Enable the algorithm in a signed trust policy and issue a distinct managed key.
4. Dual-publish representative evidence during the overlap window, verify both paths, and preserve old public keys.
5. Stop new PKCS#1 v1.5 signatures only after all consumers accept envelope 2.0.0; retain read support for archived evidence.

The executable registry is emitted by [`src/algorithms.kujo`](../src/algorithms.kujo) and validated by [`schemas/algorithm-registry.schema.json`](../schemas/algorithm-registry.schema.json).
