# Artifact stores and signed bundles

Bundles contain `bundle.json` plus the exact run artifacts. Export requires `signature.json`; import requires a trusted-key policy and performs full signature/artifact verification before accepting the run.

The local immutable store is the reference provider. Versions are the 64-character manifest SHA-256. Publication requires the caller's expected current version. Existing object versions cannot be replaced.

The HTTP contract uses:

- `PUT /runs/{run}/versions/{version}/artifacts/{path}` with `If-None-Match: *` and `Content-SHA256`;
- `POST /runs/{run}/versions` with `If-None-Match: *` for the first version or `If-Match: {current-version}` for updates, plus `Idempotency-Key` and bundle metadata to finalize a version;
- `GET /runs/{run}/current` or `GET /runs/{run}/versions/{version}` for metadata;
- `GET /runs/{run}/versions/{version}/artifacts/{path}` for exact objects.

The server must authenticate identities, enforce tenant/run ownership, preserve immutable versions, implement conditional writes atomically, verify body digests, bound request sizes, and log all operations. Non-loopback endpoints must use HTTPS. Partial uploads are not current until finalization succeeds.

Tribunal validates bundle metadata before downloads/copies, rejects duplicate and unsafe paths, and caps artifact count, individual size, and aggregate bundle size. The local store root must remain outside run storage.

Artifacts use the v1.1 binary file-transfer contract at `/artifacts/<path>`. Upload streams the file body with conditional create, content SHA-256, content length, and an idempotency key bound to version/path. Pull streams into a same-directory temporary file, enforces the 64 MiB limit, and atomically publishes only after completion. Tribunal verifies the transfer receipt's byte count and SHA-256 against the signed bundle descriptor before trusted import. Legacy base64 chunk routes remain server-side compatibility surfaces only and are no longer emitted by the Tribunal client.

Tribunal's pull path reconstructs a temporary bundle, verifies it under the target trust policy, then atomically admits the run to empty local storage.
