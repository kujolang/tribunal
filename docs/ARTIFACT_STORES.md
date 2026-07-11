# Artifact stores and signed bundles

Bundles contain `bundle.json` plus the exact run artifacts. Export requires `signature.json`; import requires a trusted-key policy and performs full signature/artifact verification before accepting the run.

The local immutable store is the reference provider. Versions are the 64-character manifest SHA-256. Publication requires the caller's expected current version. Existing object versions cannot be replaced.

The HTTP contract uses:

- `PUT /runs/{run}/versions/{version}/artifacts/{path}` with `If-None-Match: *` and `Content-SHA256`;
- `POST /runs/{run}/versions` with `If-None-Match: *` for the first version or `If-Match: {current-version}` for updates, plus `Idempotency-Key` and bundle metadata to finalize a version;
- `GET /runs/{run}/current` or `GET /runs/{run}/versions/{version}` for metadata;
- `GET /runs/{run}/versions/{version}/artifacts/{path}` for exact objects.

The server must authenticate identities, enforce tenant/run ownership, preserve immutable versions, implement conditional writes atomically, verify body digests, bound request sizes, and log all operations. Partial uploads are not current until finalization succeeds.

Tribunal's pull path reconstructs a temporary bundle, verifies it under the target trust policy, then atomically admits the run to empty local storage.
