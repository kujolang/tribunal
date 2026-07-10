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
tribunal seal <run-id> --private-key ./tribunal-private.pem
tribunal verify <run-id> --public-key ./tribunal-public.pem
tribunal ingest <run-id> --target runledger --public-key ./tribunal-public.pem
tribunal ingest <run-id> --target casefile --public-key ./tribunal-public.pem
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
artifact-manifest.json
signature.json  # present on signed runs
```

`record.json` contains the full hearing. `events.jsonl` is append-oriented stage/model evidence. `artifact-manifest.json` hashes every non-integrity artifact and rejects missing, changed, or unexpected files during replay. Markdown artifacts are self-contained and ready for Strata indexing.

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

The bridge does not accept, log, or persist keys. It inherits the process environment so the Kujo AI SDK can resolve its own provider credential. The provider can be selected in `tribunal.config.json`; direct provider fallback is permanently disabled. Tribunal forwards the seat's provider-neutral preference object to Kujo AI SDK's `resolve_model_preference(...)` contract. The SDK owns class mapping and returns the selected model plus resolution provenance, both of which are persisted in model metadata.

## Integrity, signing, and ingestion

Every completed or stopped run receives an unsigned SHA-256 artifact manifest. `replay` verifies the complete artifact set before showing events. Seal a run with a local Ed25519 key when it must cross a trust boundary:

```bash
openssl genpkey -algorithm ED25519 -out tribunal-private.pem
openssl pkey -in tribunal-private.pem -pubout -out tribunal-public.pem

tribunal review examples/product-decision.md \
  --private-key ./tribunal-private.pem
tribunal verify <run-id> --public-key ./tribunal-public.pem
```

Never commit the private key. A signature without a separately trusted public key is not accepted for ingestion.

Signed ingestion verifies every artifact and the trusted key before mutating either downstream tool:

```bash
tribunal ingest <run-id> \
  --target runledger \
  --public-key ./tribunal-public.pem \
  --ledger ./.runledger \
  --runledger-bin ../runledger/bin/runledger

tribunal ingest <run-id> \
  --target casefile \
  --public-key ./tribunal-public.pem \
  --casefile-output ./.casefile \
  --casefile-path ../casefile/casefile.kujo
```

RunLedger receives provider/model identity, aggregate usage, verdict, signed-manifest evidence, and required next actions. CaseFile receives a manual case plus `tribunal-evidence/` containing the signed manifest, signature, ruling, decision packet, and receipt. Ingestion outputs are external to the sealed Tribunal directory so the source signature remains valid.

## Optional PackWrite context

Local context remains the default. Opt into PackWrite's deterministic, secret-filtered repository summary without invoking a model:

```bash
tribunal review examples/product-decision.md \
  --context-provider packwrite \
  --packwrite-path ../packwrite \
  --kujo-bin ../kujo/target/debug/kujo
```

PackWrite enrichment is appended before blind testimony, so every seat receives the same immutable context and the blindness invariant is unchanged.

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
npm run schema:gate
npm run concord:gate
```

Validation exercises the mock model, Kujo AI SDK offline fixture, PackWrite context bridge, RunLedger, CaseFile, Concord, Spec/Eval metadata, signing, and tamper detection. No real provider, local model server, API key, or network is required.

## Architecture and integrations

- [Architecture](docs/architecture.md)
- [Configuration](docs/configuration.md)
- [KUJO ecosystem integrations](docs/integrations.md)
- [Paperclip skill stub](docs/paperclip-skill.md)
- [BZBY analytics path](docs/bzby.md)
- Machine-readable contracts: [`schemas/`](schemas/)

## Current limitations

- JSON configuration is supported; YAML is deferred to avoid runtime dependency weight.
- Live mode supports the OpenAI, OpenRouter, and DeepSeek presets currently exposed by Kujo AI SDK. Provider class mappings currently resolve to each preset's conservative default unless an explicit resolved ID or provider override is supplied.
- Replay verifies and inspects the original event sequence; it intentionally does not re-run models.
- RunLedger, CaseFile, PackWrite, and Concord are optional local integrations. ChangeBucket, Muzzle, Strata, Paperclip, and BZBY remain contract/documentation seams.
- Key generation, storage, rotation, revocation, and organizational trust policy remain the caller's responsibility.
- A web UI is intentionally outside the MVP.

## Next

The completed post-MVP foundation is ready for organizational key policy and automation. The next slice is KMS/HSM-backed signing and key rotation, CI publication of signed decision bundles, and a downstream analytics index that links Tribunal, RunLedger, CaseFile, and change evidence without modifying sealed run directories.
