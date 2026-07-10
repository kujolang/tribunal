# Tribunal

Tribunal is a local-first, Kujo-first CLI for structured adversarial decision review. It runs a fixed hearing lifecycle, preserves blind first-pass testimony, performs cross-examination and an Executioner kill pass, issues a ruling, and writes an agent-readable decision packet plus a durable JSON/JSONL record.

Tribunal owns the decision flow. Every model call crosses the `KujoModelClient` boundary. The default `MockKujoModelClient` is deterministic, offline, and credential-free. Live mode uses `KujoAiSdkBridge`, which stages the Kujo AI SDK in a temporary workspace and invokes its normalized `chat_completion` contract. Tribunal never imports or calls a provider SDK.

## Quick start

```bash
npm install
npm run build
node dist/src/cli.js panels
node dist/src/cli.js review examples/product-decision.md --panel fast-two-model
```

After `npm link`, use the installed command:

```bash
tribunal review examples/product-decision.md --panel strategic-five
tribunal kill examples/product-decision.md
tribunal list
tribunal show <run-id>
tribunal replay <run-id>
tribunal export <run-id> --format json
tribunal export <run-id> --format jsonl
tribunal panels
tribunal seats
```

The current package maps the ecosystem-style `kujo tribunal ...` shape to the standalone `tribunal ...` executable. Until the Kujo CLI gains a subcommand registry, run `npm run tribunal -- <command>` or install/link the binary.

## Hearing lifecycle

Every completed review records these explicit stages:

1. open docket
2. validate scope
3. build context pack
4. blind first pass
5. cross-examination
6. Executioner kill pass
7. Judge ruling
8. decision packet
9. persist record

The blind stage invokes every seat with only the immutable docket/context. Tribunal waits until all blind testimony is captured before constructing cross-examination prompts. The invariant is covered by an offline test.

## Panels and seats

- `executioner-only`: focused fatal-flaw review; its ruling is procedurally derived from the kill pass.
- `fast-two-model`: Executioner and Judge.
- `strategic-five`: Executioner, Builder, Operator, Market Lens, and Judge.

Each seat declares authority, non-goals, stage responsibilities, structured output requirements, a provider-neutral Kujo model preference, and escalation triggers. Run `tribunal seats` for the catalog.

## Run records

Runs are stored under `tribunal-runs/<timestamp-slug>/` by default:

```text
docket.md
manifest.json
context.md
prompts/
testimony/
cross-examination.md
kill-pass.md
ruling.md
decision-packet.md
record.json
events.jsonl
receipt.json
```

`record.json` contains the full hearing. `events.jsonl` is append-oriented stage/model evidence. `receipt.json` is shaped for later RunLedger ingestion. Markdown artifacts are self-contained and ready for Strata or CaseFile indexing.

## Mock and live Kujo AI SDK modes

Mock mode is the default and needs no keys or network:

```bash
tribunal review examples/product-decision.md --mock
```

Live mode requires a Kujo runtime, the adjacent AI SDK checkout, and the credential convention owned by the selected Kujo AI SDK provider:

```bash
export OPENAI_API_KEY="..."
tribunal review examples/product-decision.md --live \
  --ai-sdk-path ../ai-sdk \
  --kujo-bin ../kujo/target/debug/kujo
```

The bridge does not accept, log, or persist keys. It inherits the process environment so the Kujo AI SDK can resolve its own provider credential. The provider can be selected in `tribunal.config.json`; direct provider fallback is permanently disabled.

## Stop the line

Fatal docket, panel, model, blind-isolation, secret-safety, directory, or persistence failures stop the hearing. Tribunal attempts to leave `manifest.json`, `events.jsonl`, `record.json`, and `receipt.json` with `status: stopped` and the non-secret reason. A persistence failure may prevent some or all partial artifacts by definition.

## Configuration

See [docs/configuration.md](docs/configuration.md). Configuration is JSON in the MVP; no secret field is supported. `--storage-dir` safely overrides run storage. Live model selection remains provider-neutral in seat definitions and is resolved by Kujo AI SDK.

## Development

```bash
npm run build
npm run typecheck
npm run lint
npm test
npm run format:check
```

All tests use the mock Kujo model client. No real provider, local model server, API key, or network is required.

## Architecture and integrations

- [Architecture](docs/architecture.md)
- [Configuration](docs/configuration.md)
- [KUJO ecosystem integrations](docs/integrations.md)
- [Paperclip skill stub](docs/paperclip-skill.md)
- [BZBY analytics path](docs/bzby.md)
- Machine-readable contracts: [`schemas/`](schemas/)

## Current limitations

- JSON configuration is supported; YAML is deferred to avoid runtime dependency weight.
- Live mode supports the OpenAI, OpenRouter, and DeepSeek presets currently exposed by Kujo AI SDK. Model preference classes are recorded but provider/model policy resolution is still intentionally narrow.
- Replay inspects the original event sequence; it does not re-run models.
- RunLedger, ChangeBucket, PackWrite, Muzzle, CaseFile, Concord, Strata, Paperclip, and BZBY integrations are contract/documentation seams, not hard dependencies.
- A web UI is intentionally outside the MVP.

## Next

The next useful slice is an SDK-owned model preference resolver plus signed RunLedger/CaseFile ingestion. After that, add replay verification (hashing every artifact), Concord schema gates, and optional PackWrite context construction without changing Tribunal's orchestration boundary.
