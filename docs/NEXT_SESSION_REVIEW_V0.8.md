# Next-session review — beyond v0.7.0

Tribunal 0.7.0 completes the prior application, scale, security-depth, adoption, and release-contract review. The items below are deliberately future work or external evidence; none should be represented as already certified.

## P0 — close external evidence

- [ ] Complete the commissioned independent threat-model/code review, verify assessor independence and signed report provenance, and add a regression fixture for every accepted finding.
- [ ] Preserve passing release compatibility receipts for macOS x86_64 and Linux x86_64; add macOS arm64 or Linux arm64 only after a maintained runner passes the same pinned-runtime gates.
- [ ] Run the multi-host worker/report harness against each supported shared filesystem and publish filesystem/version/mount-specific contention and recovery receipts.

## P1 — Kujo runtime capability follow-through

- [x] Fix Kujo `parallel_map` nested-runtime panics upstream, then lift Tribunal's effective-concurrency gate only after isolation, stable order, provider-rate, cancellation, and live SDK cwd tests pass.
- [x] Add portable Kujo filesystem device-ID and restrictive-permission primitives; enable same-mount enforcement and atomically verified private-key modes without weakening managed signing guidance.
- [x] Add streaming authenticated-encryption primitives so encrypted bundles can maintain constant memory rather than the current bounded whole-artifact contract.
- [x] Add binary request/response file streaming to Kujo HTTP so remote chunk transport can remove base64 expansion while preserving digest and idempotency contracts.

## P1 — deployment and ecosystem certification

- [ ] Re-run Vault Transit and authenticated HTTP-store live profiles for the 0.7.x release revision with organization-owned identities, audit logs, denial/failure injection, backup, and regional recovery evidence.
- [ ] Publish a signed Kennel package through an approved registry/mirror with immutable checksum, package provenance, install/upgrade/rollback receipts, and offline-cache restoration.
- [ ] Exercise each pinned ecosystem integration against its next released version and publish explicit compatible/incompatible results instead of advancing ranges optimistically.

## P2 — usability and adoption evidence

- [ ] Perform the manual screen-reader, 400% zoom, forced-colors, and operator usability study; turn confirmed dashboard or workflow issues into deterministic fixtures where possible.
- [ ] Activate the documentation opt-in endpoint only after privacy review, then publish cohort-suppressed Tribunal-to-Kujo arrival and first-run conversion data.
- [x] Evaluate whether repeated deployment demand now justifies the read-only service; retain the current no-service decision unless all authentication, tenancy, browser, TLS, rate, audit, and recovery contracts are approved first.

## Exit criteria

- External reports and receipts bind exact revisions, runtime digests, platforms/filesystems, identities, and limitations.
- Runtime-gated features remain disabled until upstream primitives and Tribunal regressions both pass.
- No future checklist completion is inferred from a harness, reference fixture, empty register, or planned CI job alone.
- All changes remain Kujo-native, schema-versioned, documented, tested, committed, pushed, and free of unsupported production claims.
