# Operations

## Preflight

Run `tribunal doctor --json` under the same identity, working directory, environment, and configuration used in production. A nonzero exit means a required runtime, schema, manifest, storage parent, or version contract is unavailable. Warnings identify optional live SDK/PackWrite dependencies or weaker storage posture.

Validate dockets before opening hearings. Use explicit `--config`, `--storage-dir`, `--provider`, and timeout values in automation. Require signed verification before replay or ingestion.

## Storage and retention

Use a dedicated local filesystem directory that is not a symbolic link. Restrict it to the service identity and back it up as immutable evidence. A run is append/write-active until sealing; after `artifact-manifest.json` is written, any file change makes verification fail.

Retention and legal-hold policy are deployment responsibilities. Delete complete run directories only after policy approval; never delete individual sealed artifacts. Test restore by verifying restored signed runs against independently held public keys.

## Monitoring

Use `tribunal stats --json` for local counts, dispositions, model invocations, tokens, and average duration. Use `tribunal list --json` for inventory and status/panel filters. Monitor nonzero exit codes, stopped runs, integrity failures, process timeouts, secret-safety stops, and unexpectedly high token/duration trends.

## Incident response

1. Stop new ingestion when integrity or key compromise is suspected.
2. Preserve the run directory read-only and record its filesystem metadata.
3. Verify with an independently sourced public key.
4. Compare RunLedger/CaseFile idempotency receipts outside the sealed run.
5. Rotate compromised credentials or signing keys and apply organizational revocation controls.
6. Reopen work from the original docket; do not edit sealed evidence to repair it.

## Upgrade and rollback

Run the full offline gate suite before upgrading. Keep the previous Kujo binary and Tribunal commit available. Tribunal v0.3.0 verifies legacy v1.0.0 signature envelopes while emitting v1.1.0. Rollback does not authorize modifying runs created by a newer version.
