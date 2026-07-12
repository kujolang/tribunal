# Tribunal command reference

Generated from `tribunal help`; edit the CLI help source and rerun `scripts/generate_cli_assets.kujo`.

## Commands

```text
tribunal review <file> --panel <panel-name> [--mock|--live] [--private-key <pem> --public-key <pem>]
tribunal resume <stopped-run-id> [--private-key <pem> --public-key <pem>]
tribunal compare <base-run-id> <candidate-run-id> --output <prefix>
tribunal re-review <base-run-id> <file> --panel <panel-name> --output <prefix> [--mock|--live]
tribunal kill <file> [--mock|--live] [--private-key <pem> --public-key <pem>]
tribunal validate <file> [--json]
tribunal list [--status <status> --panel <panel> --limit <n> --json]
tribunal show <run-id> [--json]
tribunal replay <run-id> [--public-key <pem> --require-signature]
tribunal keys --private-key <pem> --public-key <pem> [--bits 2048|4096]
tribunal seal <run-id> --private-key <pem> --public-key <pem>
tribunal verify <run-id> [--public-key <pem> --require-signature]
tribunal verify-bulk [--cursor <run-id> --limit <1-100> --public-key <pem> --require-signature]
tribunal ingest <run-id> --target runledger|casefile --public-key <pem>
tribunal export <run-id> --format json|jsonl
tribunal panels
tribunal seats
tribunal doctor [--json]
tribunal stats [--json]
tribunal contracts <run-id> [--json]
tribunal audit <run-id> [--public-key <pem>|--trust-policy <json> --target <name>] [--require-signature]
tribunal seal-provider <run-id> --provider-config <json>
tribunal verify-policy <run-id> --trust-policy <json> --target <name>
tribunal bundle-export <run-id> --output <directory>
tribunal bundle-import <directory> --trust-policy <json> --target <name>
tribunal bundle-encrypt <run-id> --output <directory> --recipient-public-key <pem> [--recovery-public-key <pem>]
tribunal bundle-decrypt <directory> --recipient-private-key <pem> --trust-policy <json> --target <name>
tribunal bundle-rekey <directory> --recipient-private-key <pem> --recipient-public-key <pem>
tribunal store-publish <run-id> [--expected-version <sha256>]
tribunal store-pull <run-id> [--version <sha256>] --trust-policy <json>
tribunal telemetry-export [--collector jsonl|http --destination <path|url>]
tribunal locks-recover [--stale-after-ms <n>]
tribunal index-check [--json]
tribunal index-rebuild [--json]
tribunal index-repair [--json]
tribunal delete <run-id> --reason <text> [--force-expired]
tribunal auth-check --permission <permission>
tribunal dashboard-export --output <html>
tribunal legal-hold <run-id> --enable|--release --reason <text>
tribunal provenance-sign <document> --kind <kind> --sequence <n> --private-key <pem> --public-key <pem> --output <json> --anchor <json> [--previous <json>]
tribunal provenance-verify <document> --provenance <json> --public-key <pem> --anchor <json>
tribunal version
```

Exit codes: `0` success, `1` runtime failure, `2` usage/configuration or stopped hearing, and `3` integrity failure. All commands accept `--config`, `--storage-dir`, `--identity`, and `--access-policy` where applicable.
