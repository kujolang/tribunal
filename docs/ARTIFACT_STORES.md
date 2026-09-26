# Artifact stores and signed bundles

Bundles contain `bundle.json` plus the exact run artifacts. Export requires `signature.json`; import requires a trusted-key policy and performs full signature/artifact verification before accepting the run.

The local immutable store is the reference provider. Versions are the 64-character manifest SHA-256. Publication requires the caller's expected current version. Existing object versions cannot be replaced.

The HTTP contract uses:

- `PUT /runs/{run}/versions/{version}/artifacts/{path}` with `If-None-Match: *` and `Content-SHA256`;
- `POST /runs/{run}/versions` with `If-None-Match: *` for the first version or `If-Match: {current-version}` for updates, plus `Idempotency-Key` and bundle metadata to finalize a version;
- `GET /runs/{run}/current` or `GET /runs/{run}/versions/{version}` for metadata;
- `GET /runs/{run}/versions/{version}/artifacts/{path}` for exact objects.

Finalization requires exactly one condition: `If-None-Match: *` or `If-Match` containing the current lowercase SHA-256 digest. Missing, malformed or conflicting conditions and invalid bundle metadata return HTTP 400 before publication.

The server must authenticate identities, enforce tenant/run ownership, preserve immutable versions, implement conditional writes atomically, verify body digests, bound request sizes, and log all operations. Non-loopback endpoints must use HTTPS. Partial uploads are not current until finalization succeeds.

Tribunal validates bundle metadata before downloads/copies, rejects duplicate and unsafe paths, and caps artifact count, individual size, and aggregate bundle size. The local store root must remain outside run storage.

Artifacts use the v1.1 binary file-transfer contract at `/artifacts/<path>`. Upload streams the file body with conditional create, content SHA-256, content length, and an idempotency key bound to version/path. Pull streams into a same-directory temporary file, enforces the 64 MiB limit, and atomically publishes only after completion. Tribunal verifies the transfer receipt's byte count and SHA-256 against the signed bundle descriptor before trusted import. Legacy base64 chunk routes remain server-side compatibility surfaces only and are no longer emitted by the Tribunal client.

Tribunal's pull path reconstructs a temporary bundle, verifies it under the target trust policy, then atomically admits the run to empty local storage.

Encrypted imports preflight envelope count, unique inventory, metadata/descriptor agreement, and the 1 GiB plaintext aggregate before reading a recipient key or staging plaintext. Integrity-only checks also enforce the existing 65 MiB ciphertext ceiling before hashing. Descriptor-free legacy bundles remain supported. The reference HTTP adapter rejects unsafe run IDs and non-hexadecimal versions on reads, writes, and staging cleanup.

Local publication holds an exclusive `<store-root>/.locks/<run-id>.lock` from the expected-version check through object export and atomic index publication. A contending writer fails explicitly; retry only after reading the current version and deciding whether that update is still intended. Different run IDs use separate locks. Do not run older writers against the same store concurrently: they bypass this coordination. This is a cooperating-process local-filesystem contract, not shared-filesystem certification.

Version history is capped at the existing 10,000-entry schema limit before exporting another object. Failed publication can leave an unindexed object; preserve and reconcile it instead of deleting immutable evidence automatically. After a confirmed crash, stop all publishers for that store, preserve the lock/index/object evidence, and reconcile ownership before using `locks-recover --storage-dir <store-root>` with an appropriate stale threshold. Normal publication never steals a lock by age.
