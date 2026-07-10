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
```

Tribunal contains no provider-specific SDK, endpoint, transport, retry, or credential logic. In live mode `src/model.kujo` invokes `integrations/kujo-ai-sdk-bridge.kujo` with the same Kujo runtime while the adjacent AI SDK repository supplies `src.ai_sdk` and `src.providers`.

## Blindness invariant

Blind prompts are built only from the immutable `context.md` content and the current seat contract. The prompt explicitly records that peer testimony is unavailable. Only after all blind testimony is persisted does Tribunal serialize the complete testimony record into cross-examination prompts.

## Persistence and integrity

`src/storage.kujo` constrains run IDs, atomically replaces snapshot files, creates prompt/testimony directories, and appends one JSON event per line. `record.json` is the complete hearing.

After persistence, `src/integrity.kujo` recursively enumerates every artifact except `artifact-manifest.json` and `signature.json`, then records length and SHA-256. Replay requires an exact file set and matching digests.

Signing uses Kujo runtime `rsa_generate_keypair`, `rsa_sign`, and `rsa_verify`. The signature envelope records `RSA-PKCS1v15-SHA256`, the raw manifest digest, and the trusted public-key fingerprint. Private keys are never copied into a run.

RunLedger and CaseFile output is written outside the sealed run so downstream operations cannot invalidate source evidence.

## Failure model

Each fatal result is routed through one stopped-run writer. It emits `stop_the_line_triggered`, writes the best available partial record and receipt, marks the manifest stopped, and seals an integrity manifest. The CLI returns exit code 2 for stopped hearings.

## Security

- No config, request, event, or record contract accepts credentials.
- Obvious key assignments, bearer headers, and private-key material stop the line before model invocation.
- Provider credentials are resolved only inside Kujo AI SDK.
- Run IDs and artifact-relative paths are constrained before file access.
- Signed ingestion requires both complete artifact verification and a separately supplied trusted public key.
