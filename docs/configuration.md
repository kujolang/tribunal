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
  }
}
```

`requireBlindFirstPass` and `requireDecisionPacket` are safety invariants for completed runs. `allowDirectProviderFallback` must remain `false`. Valid providers are SDK presets (`openai`, `openrouter`, `deepseek`); Tribunal never calls them directly.

Do not put secrets in this file. Live credentials must use the environment variable convention documented by Kujo AI SDK.
