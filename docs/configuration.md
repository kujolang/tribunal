# Configuration

Pass JSON configuration with `--config <path>`. Defaults are embedded in `src/config.kujo`; `examples/tribunal.config.json` is the canonical example.

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
    "kujo_bin": "../kujo/target/release/kujo",
    "plugin_manifest_path": "",
    "plugin_provenance_path": "",
    "plugin_public_key_path": "",
    "plugin_anchor_path": ""
  },
  "limits": {
    "max_docket_bytes": 1048576,
    "max_context_bytes": 4194304,
    "max_model_output_bytes": 1048576,
    "max_process_output_bytes": 8388608,
    "model_timeout_ms": 60000
  },
  "execution": {
    "blind_parallelism": 3,
    "provider_max_concurrency": 2,
    "cancel_on_failure": true,
    "live_parallel_enabled": false
  },
  "panels": { "catalog_path": "", "provenance_path": "", "public_key_path": "", "anchor_path": "" },
  "decision_packet": { "template_path": "", "policy_path": "", "policy_provenance_path": "", "policy_public_key_path": "", "policy_anchor_path": "" },
  "security": { "organization_secret_patterns_path": "", "require_same_mount": false, "private_key_permission_mode": "managed-provider-required" },
  "authorization": {
    "mode": "local",
    "identity": "local-operator",
    "policy_path": "./examples/access-policy.json"
  },
  "governance": {
    "retention_class": "standard",
    "retention_days": 365,
    "legal_hold": false,
    "owner": "local-operator"
  },
  "artifact_store": {
    "provider": "local-immutable",
    "root": "./.tribunal/artifact-store",
    "endpoint": "",
    "tenant_id": "",
    "bearer_token_file": "",
    "region": ""
  },
  "telemetry": {
    "collector": "jsonl",
    "destination": "./.tribunal/telemetry.jsonl"
  }
}
```

Blind first pass, decision packets, Kujo AI SDK ownership, and disabled direct-provider fallback are hard invariants. Valid provider presets are `openai`, `openrouter`, and `deepseek`.

Set `context.provider` to `packwrite` to append PackWrite's deterministic, redacted repository context. Set it to `plugin` only with a signed and externally anchored connector manifest; adapters are Kujo files, receive a request-file path through an isolated environment, and must return bounded content plus source digests. No model is invoked for context enrichment.

Custom panels likewise require a schema-valid signed catalog, fixed `{{context}}`/`{{seat}}` placeholders, and blind permission boundaries. Decision templates are deterministic post-model transforms. Organization policy is signed, evaluated explicitly, and records that model behavior was not modified.

Do not store secrets here. Live credentials must use the provider environment convention documented by Kujo AI SDK.

Unknown fields and invalid types are rejected. Limits have guarded ranges: docket/context/process output up to 64 MiB, model output up to 16 MiB, and timeouts from 1 to 600 seconds. CLI `--model-timeout-ms` overrides the configured timeout for a run.

Execution concurrency fields record desired/provider bounds and mandatory cancellation, but Kujo 1.0.0 parallel execution is runtime-gated to effective concurrency one. Portable same-mount enforcement and private-key permission modes also remain fail-closed because the runtime does not expose device IDs or chmod-like primitives. Production uses managed signing.

`authorization.mode=local` is intentionally single-operator and accepts only `local-operator`. Set `mode=policy`, select an identity, and provide a default-deny policy for service or multi-user automation. CLI `--identity` and `--access-policy` provide explicit overrides.

Governance metadata is sealed into every new run. Post-seal legal-hold changes are stored in the external `.governance/` registry so evidence remains immutable. Artifact stores support `local-immutable` roots or authenticated deployment-owned `http-immutable` endpoints. Remote artifact-store and telemetry endpoints require HTTPS except for explicit loopback development. Local store, telemetry, and all other external output paths must be outside `tribunal.storage_dir`.

See `examples/access-policy.json`, `examples/trust-policy.json`, and `examples/signing-provider.json` for the policy/provider contracts. These files contain no credentials or private key material.
