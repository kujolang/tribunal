# Configuration

Tribunal loads `tribunal.config.json` from the current directory or the path given by `--config`/`TRIBUNAL_CONFIG`. JSON is used to keep the MVP dependency-light.

```json
{
  "tribunal": {
    "storageDir": "./tribunal-runs",
    "defaultPanel": "fast-two-model",
    "requireBlindFirstPass": true,
    "requireDecisionPacket": true,
    "stopTheLineEnabled": true
  },
  "kujoAi": {
    "defaultRuntime": "kujo-ai-sdk",
    "allowDirectProviderFallback": false,
    "mockMode": true,
    "sdkPath": "../ai-sdk",
    "kujoBin": "../kujo/target/debug/kujo",
    "provider": "openai"
  },
  "context": {
    "provider": "local",
    "packwritePath": "../packwrite",
    "kujoBin": "../kujo/target/debug/kujo"
  }
}
```

`requireBlindFirstPass` and `requireDecisionPacket` are safety invariants for completed runs. `allowDirectProviderFallback` must remain `false`. Valid providers are SDK presets (`openai`, `openrouter`, `deepseek`); Tribunal never calls them directly.

`context.provider` is `local` by default. Set it to `packwrite` or pass `--context-provider packwrite` to append PackWrite's lightweight, redacted repository context. PackWrite integration requires only its checkout and the Kujo runtime; it does not require an API key or make a model call.

Do not put secrets in this file. Live credentials must use the environment variable convention documented by Kujo AI SDK.
