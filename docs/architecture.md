# Tribunal architecture

## Boundary

`Tribunal` is the orchestration aggregate. It validates a docket, selects a panel, advances explicit stages, controls what each seat can observe, persists artifacts, and triggers stop-the-line behavior.

`KujoModelClient` is the only inference port:

```text
CLI -> Tribunal -> KujoModelClient -> MockKujoModelClient
                                  -> KujoAiSdkBridge -> Kujo AI SDK model resolver -> provider preset
    -> ContextPackBuilder -> Local | PackWrite redacted repository context
    -> RunStore -> Markdown + JSON + JSONL -> ArtifactIntegrity -> Ed25519 signature
    -> SignedRunIngestion -> RunLedger | CaseFile
```

`KujoAiSdkBridge` copies the two SDK source modules and the small bridge entrypoint to a temporary workspace, invokes the selected Kujo runtime, consumes the SDK's normalized contract, and deletes the workspace. It sends the complete model preference to the SDK-owned resolver and records the chosen model, preference class, and resolution source. This keeps Tribunal in TypeScript without duplicating provider routing, transport, retry, normalization, usage, or capability behavior.

`ContextPackBuilder` defaults to the local deterministic context. The PackWrite implementation stages only PackWrite's redacted repository-context modules and never invokes PackWrite's model adapter.

## Blindness invariant

Blind requests are constructed only from `context.md` and `docket.md`. All blind invocations are launched before any response is incorporated into a later prompt. Only after every response resolves are testimony artifacts created and a combined transcript passed to cross-examination. Model request capture in the mock client makes this invariant directly testable.

## Persistence

`RunStore` constrains run IDs, uses atomic temporary-file replacement for snapshots, creates prompts/testimony directories at run open, and treats `record.json` as the complete structured hearing. Events use one append operation per line so concurrent blind-seat completions cannot overwrite one another.

After final persistence, `ArtifactIntegrity` enumerates every artifact except the integrity manifest and its signature, recording byte length and SHA-256. Replay requires an exact artifact-set and digest match. Ed25519 sealing signs the raw manifest bytes. Trusted ingestion requires both a clean artifact verification and a signature matching the separately supplied public key.

RunLedger and CaseFile outputs are written outside the sealed run directory. This preserves source immutability while downstream receipts retain the manifest digest and signing-key fingerprint.

## Failure model

Fatal conditions throw into one stop handler. The handler emits `stop_the_line_triggered`, writes a partial record and compatible receipt, and marks the manifest stopped. If persistence itself is unavailable, the original error wins and the CLI reports the run directory for forensic inspection.

## Security

- No config or request type has a credential field.
- Events drop secret-shaped metadata keys and redact common provider-key patterns.
- Dockets containing obvious private keys or credential assignments are rejected before model invocation.
- Live credentials are resolved only by Kujo AI SDK from its provider conventions.
- Run IDs are validated before path construction.
- Direct provider fallback is rejected during config loading.
- Private signing keys are read only for sealing, are never copied into run artifacts, and must be managed outside the repository.
- Signed ingestion rejects absent, untrusted, malformed, or tampered evidence before invoking downstream tools.
