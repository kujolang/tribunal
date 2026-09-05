# Operations

## Preflight and identity

Run `tribunal doctor --json` under the production service identity and exact configuration. Use `tribunal auth-check --permission <permission>` to prove the selected identity/policy decision before automation. Use `tribunal audit <run-id> --trust-policy <path> --target audit --require-signature --json` as the normal production evidence gate. `local` mode is single-operator only; multi-user and service execution must use `policy` mode with `defaultDeny: true`.

Validate dockets before opening hearings. Require `verify-policy` with a separately distributed trust policy before replay, import, publication, or ingestion.

## Signing and trust

Use `seal-provider` for HSM/KMS custody. The provider config contains an opaque key reference and Kujo adapter command, never private key material. Only federated workload-identity variables are forwarded. Rotate by adding the successor key, setting the predecessor to `rotating`, populating `rotatesTo`, and later marking it `revoked` or `expired`. Revoked keys fail verification policy immediately.

## Locks and crash recovery

Every hearing holds an atomic lock under `<storage>/.locks/`. Seal replacements use `<storage>/.seal-transactions/`. After a confirmed process crash, run:

```bash
tribunal locks-recover --stale-after-ms 300000 --json
```

This removes stale writer locks and rolls interrupted sealing back to the prior manifest/signature. Normal acquisition never steals a stale-looking lock. Never run recovery merely because a live hearing is slow; confirm process death and preserve recovery evidence first.

## Immutable storage and disaster recovery

Publish signed evidence with an explicit expected version:

```bash
tribunal store-publish <run-id> --expected-version ""
tribunal store-pull <run-id> --version <manifest-sha256> \
  --trust-policy ./trust-policy.json --target store-pull
```

The local provider is a deterministic reference implementation. HTTP deployments must implement conditional version finalization, immutable object PUT/GET, content digests, authentication/mTLS, tenant isolation, and audit logging. A restored run is accepted only after trusted signature verification.

## Retention, legal hold, and deletion

Retention class/days, owner, and initial legal-hold state are sealed into each run. Post-seal changes use the external governance registry:

```bash
tribunal legal-hold <run-id> --enable --reason "Matter 2026-17"
tribunal legal-hold <run-id> --release --reason "Matter closed"
```

Deletion is whole-run only. It is denied during retention or any legal hold. After policy approval, `delete` writes an external tombstone containing actor, reason, record/manifest hashes, key ID, and governance metadata. `--force-expired` bypasses time retention only; it never bypasses legal hold and should be restricted to governance administrators.

## Monitoring and read-only projection

Export redacted metrics/audit data without modifying evidence:

```bash
tribunal telemetry-export --collector jsonl --destination /var/log/tribunal/audit.jsonl
tribunal dashboard-export --output /var/lib/tribunal/dashboard.html
```

The dashboard is static, script-free, CSP-restricted, and capped at 500 rows. Treat it as an offline projection. Do not expose it through an unauthenticated server.

## Incident response

1. Stop new ingestion/publication when integrity, identity, or key compromise is suspected.
2. Preserve run, lock, transaction, trust-policy, and external receipt metadata.
3. Mark the key revoked in the trusted-key policy and distribute the policy through the trusted channel.
4. Run `verify-policy`, `contracts`, and bundle/store verification against preserved evidence.
5. Apply legal hold when investigation or litigation requires retention.
6. Rotate federated identity and signing references; do not edit sealed evidence.

## Release and rollback

Tag releases run all Kujo checks, four main test suites plus focused hardening regressions, every executable schema, compatibility and documentation gates, Concord, Spec, Eval, performance/scale/index/load/chaos, adversarial, accessibility, security-register, integration, gallery, Kennel, doctor, and archive/package smoke gates on a self-hosted Kujo runner. CI always uploads the reproducible package, SBOM, provenance, checksums, and receipt. When `TRIBUNAL_SIGNING_PROVIDER_CONFIG` names an approved provider, CI additionally creates and uploads signed evidence; an absent provider does not block the local/operator-controlled release profile. See [release verification](RELEASE_VERIFICATION.md) and the [release checklist](launch-checklist.md).

Tribunal 1.0.0 verifies signature schemas v1.0, v1.1, and v1.2. These are independent evidence-envelope versions. Rollback does not authorize modifying newer runs.

## Index consistency

The index is a rebuildable projection, not sealed evidence. `index-check` compares both the cached manifest and its digest against storage and rejects duplicate run IDs across shards. Use `index-repair` after a failed check. Index reads, writes, rebuilds and repairs now share an exclusive `<storage>/.index.lock` directory. Do not run older Tribunal versions against this storage concurrently; they bypass the new coordination. Each listing call sees a consistent page set; separate cursor calls are not a snapshot across concurrent changes. Acquisition uses a 30-second contention budget checked between helper calls; each helper has its own 10-second timeout. Exhaustion fails explicitly. No lock is reclaimed by age. A failed mutation leaves `<storage>/.index-dirty`; ordinary operations refuse it until `index-repair` or `index-rebuild` succeeds.

After a confirmed crash, stop **all** processes using this storage, preserve the index/lock evidence, and remove only the empty `.index.lock` directory with `rmdir`. Then run `tribunal index-repair --json` before restarting users. Do not remove `.index-dirty` manually. `locks-recover` handles per-run locks and does not remove the storage-wide index lock. Index coordination does not make an entire hearing, bundle import, deletion or multi-call analytics traversal one transaction; verification during such operations can still observe changes to source manifests.

Exclusive directory claims use `/bin/mkdir` without `-p` on supported macOS/Linux hosts because Kujo `create_dir` recursively creates directories and accepts existing paths. Doctor checks this required helper. A timed-out helper can leave a claimed directory; confirm process death and reconcile ownership before removal.
