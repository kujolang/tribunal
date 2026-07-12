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

Artifacts larger than 1 MiB use the v1 chunk contract: indexed PUT/GET endpoints under `/artifacts/<path>/chunks/<index>`, a 1 MiB maximum decoded chunk, exact offset/byte count, base64-payload digest, conditional create, and an idempotency key bound to version/path/index. A final `/complete` request binds the descriptor and whole-file SHA-256. Pull validates every chunk, final bytes, and final digest before trusted bundle import. At the 64 MiB artifact ceiling this uses at most 64 data requests plus one completion request and one temporary/final copy as documented in `PERFORMANCE_AND_SCALE.md`.

Tribunal's pull path reconstructs a temporary bundle, verifies it under the target trust policy, then atomically admits the run to empty local storage.
