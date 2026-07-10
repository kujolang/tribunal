# Tribunal architecture

## Boundary

`Tribunal` is the orchestration aggregate. It validates a docket, selects a panel, advances explicit stages, controls what each seat can observe, persists artifacts, and triggers stop-the-line behavior.

`KujoModelClient` is the only inference port:

```text
CLI -> Tribunal -> KujoModelClient -> MockKujoModelClient
                                  -> KujoAiSdkBridge -> Kujo AI SDK -> provider preset
    -> RunStore -> Markdown + JSON + JSONL
```

`KujoAiSdkBridge` copies the two SDK source modules and the small bridge entrypoint to a temporary workspace, invokes the selected Kujo runtime, consumes the SDK's normalized contract, and deletes the workspace. This keeps Tribunal in TypeScript without duplicating provider transport, retry, normalization, usage, or capability behavior.

## Blindness invariant

Blind requests are constructed only from `context.md` and `docket.md`. All blind invocations are launched before any response is incorporated into a later prompt. Only after every response resolves are testimony artifacts created and a combined transcript passed to cross-examination. Model request capture in the mock client makes this invariant directly testable.

## Persistence

`RunStore` constrains run IDs, uses atomic temporary-file replacement for snapshots, creates prompts/testimony directories at run open, and treats `record.json` as the complete structured hearing. Events use one append operation per line so concurrent blind-seat completions cannot overwrite one another.

## Failure model

Fatal conditions throw into one stop handler. The handler emits `stop_the_line_triggered`, writes a partial record and compatible receipt, and marks the manifest stopped. If persistence itself is unavailable, the original error wins and the CLI reports the run directory for forensic inspection.

## Security

- No config or request type has a credential field.
- Events drop secret-shaped metadata keys and redact common provider-key patterns.
- Dockets containing obvious private keys or credential assignments are rejected before model invocation.
- Live credentials are resolved only by Kujo AI SDK from its provider conventions.
- Run IDs are validated before path construction.
- Direct provider fallback is rejected during config loading.
