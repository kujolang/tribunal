# Configuration

Pass JSON configuration with `--config <path>`. Defaults are embedded in `src/config.kujo`; `tribunal.config.json` is the canonical example.

```json
{
  "tribunal": {
    "storage_dir": "./tribunal-runs",
    "default_panel": "fast-two-model",
    "require_blind_first_pass": true,
    "require_decision_packet": true,
    "stop_the_line_enabled": true
  },
  "kujo_ai": {
    "default_runtime": "kujo-ai-sdk",
    "allow_direct_provider_fallback": false,
    "mock_mode": true,
    "sdk_path": "../ai-sdk",
    "kujo_bin": "../kujo/target/release/kujo",
    "provider": "openai",
    "offline_fixture": false
  },
  "context": {
    "provider": "local",
    "packwrite_path": "../packwrite",
    "kujo_bin": "../kujo/target/release/kujo"
  }
}
```

Blind first pass, decision packets, Kujo AI SDK ownership, and disabled direct-provider fallback are hard invariants. Valid provider presets are `openai`, `openrouter`, and `deepseek`.

Set `context.provider` to `packwrite` to append PackWrite's deterministic, redacted repository context. No model is invoked for context enrichment.

Do not store secrets here. Live credentials must use the provider environment convention documented by Kujo AI SDK.
