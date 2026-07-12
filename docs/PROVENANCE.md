# Signed rollback-resistant provenance

Tribunal can bind access policies, trust policies, external governance registries, deletion tombstones, and artifact-store indexes to signed, sequence-numbered provenance records. Every record commits to the document digest, document kind, sequence, predecessor provenance digest, signing-key fingerprint, and time.

Rollback resistance requires the generated anchor to be stored outside the mutable document boundary—for example in a WORM bucket, transparency log, managed ledger, or separately administered policy repository. Verification fails if the signed record is older than, different from, or inconsistent with that anchor. Keeping the anchor beside the document proves tampering but does not protect against an administrator rolling both files back.

Use a distinct governance signing key from evidence-signing and encryption-recipient keys. Start each document lineage at sequence 1, retain each predecessor, publish the new anchor before activating a policy or registry, and require provenance verification in deployment automation. The Kujo API is `sign_provenance(...)` and `verify_provenance(...)` in [`src/provenance.kujo`](../src/provenance.kujo); the executable record and anchor contracts are in [`schemas/`](../schemas/).
