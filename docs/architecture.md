# Tribunal architecture

## Kujo-native boundary

`tribunal.kujo` is a thin entrypoint into `src/cli.kujo`. All application modules are Kujo source:

```text
tribunal.kujo
  -> src/cli.kujo
  -> src/tribunal.kujo       hearing orchestration and blindness
  -> src/model.kujo          mock boundary or Kujo AI SDK bridge
  -> src/context.kujo        local or PackWrite context
  -> src/storage.kujo        Markdown, JSON, JSONL persistence
  -> src/integrity.kujo      SHA-256 and RSA-SHA256 signing
  -> src/integrations.kujo   RunLedger and CaseFile Kujo CLIs
  -> src/diagnostics.kujo    local dependency/readiness checks
  -> src/analytics.kujo      local run/usage aggregation
  -> src/policy.kujo         identity/role and trusted-key policy
  -> src/signing_provider.kujo external HSM/KMS signing contract
  -> src/locking.kujo        per-run locks and stale-writer recovery
  -> src/governance.kujo     retention, legal holds, deletion tombstones
  -> src/bundles.kujo        signed evidence export/import
  -> src/artifact_store.kujo conditional immutable object versions
  -> src/contracts.kujo      executable JSON Schema validation
  -> src/audit.kujo          combined integrity/contract/trust report
  -> src/telemetry.kujo      external metrics/audit projection
  -> src/dashboard.kujo      offline read-only HTML projection
```

Tribunal contains no provider-specific SDK, endpoint, transport, retry, or credential logic. In live mode `src/model.kujo` invokes `src/bridges/ai_sdk_bridge.kujo` with the same Kujo runtime while the adjacent AI SDK repository supplies `src.ai_sdk` and `src.providers`.

## Blindness invariant

Blind prompts are built only from the immutable `context.md` content and the current seat contract. The prompt explicitly records that peer testimony is unavailable. Only after all blind testimony is persisted does Tribunal serialize the complete testimony record into cross-examination prompts.

## Persistence and integrity

`src/storage.kujo` constrains run IDs, exclusively creates run directories, atomically replaces snapshot files, creates prompt/testimony directories, and appends one JSON event per line. Hidden operational namespaces and URL/path metacharacters cannot be addressed as run IDs. `record.json` is the complete hearing.

After persistence, `src/integrity.kujo` recursively enumerates every artifact except `artifact-manifest.json` and `signature.json`, rejects unsafe paths and symbolic links, enforces size limits, then records byte length and SHA-256. Replay requires an exact file set and matching digests.

Signing uses Kujo runtime `rsa_generate_keypair`, `rsa_sign`, and `rsa_verify`. The v1.1 envelope signs a canonical payload containing the run ID, algorithm, manifest digest, trusted public-key fingerprint, and signing time. Private keys are never copied into a run. Verification remains backward-compatible with legacy v1.0 envelopes.

External signing emits v1.2 envelopes with provider and signer-reference provenance. The external Kujo adapter owns key access and receives only an opaque key reference plus federated workload identity. A separate trust policy resolves independently distributed public keys and enforces lifecycle/target rules.

Seal replacement is journaled outside run directories. A crash leaves a recoverable transaction that restores the prior manifest/signature. Per-run atomic directory locks prevent concurrent writers. Acquisition never steals a stale-looking lock; only an explicit operator recovery command can remove one after a confirmed crash.

Bundles copy exact signed artifacts into external portable directories. Local and HTTP artifact-store providers use manifest SHA-256 as the immutable version and require conditional expected-version writes. Pull/import always re-verifies against a trust policy before accepting a run.

Bundle and store imports validate metadata before copying, reject duplicates and unsafe paths, and enforce per-file, aggregate-byte, and artifact-count limits. Non-loopback remote endpoints require HTTPS. `src/audit.kujo` combines complete integrity, executable contracts, signature verification, and optional lifecycle trust policy into one report.

RunLedger and CaseFile output is written outside the sealed run so downstream operations cannot invalidate source evidence.

## Failure model

Each fatal result is routed through one stopped-run writer. It emits `stop_the_line_triggered`, writes the best available partial record and receipt, marks the manifest stopped, and seals an integrity manifest. The CLI returns exit code 2 for stopped hearings.

## Security

- No config, request, event, or record contract accepts credentials.
- Obvious key assignments, bearer headers, and private-key material stop the line before model invocation.
- Provider credentials are resolved only inside Kujo AI SDK.
- SDK and integration subprocesses receive explicit environment allowlists instead of the full parent environment.
- Run IDs and artifact-relative paths are constrained before file access.
- Signed ingestion requires both complete artifact verification and a separately supplied trusted public key.
