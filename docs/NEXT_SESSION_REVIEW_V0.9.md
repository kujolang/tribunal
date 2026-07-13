# Next-session review — external certification after v0.8 runtime hardening

Tribunal's locally achievable v0.8 runtime work is complete. The remaining work below depends on independent people, maintained infrastructure, organization identities, governance approval, or future released versions. Harnesses and fixtures must not be presented as completed certification.

## P0 — independent and platform evidence

- [ ] Import the independent assessor's signed, provenance-verified report and add one deterministic regression fixture for every accepted finding.
- [ ] Publish full-gate compatibility receipts for the v0.8 Tribunal candidate and Kujo revision `0d145a57584d7addcbc682efe1581fe362077785` on maintained macOS/Linux x86_64 runners; add arm64 support only after the same gates pass there.
- [ ] Run two or more real hosts against every claimed shared filesystem and publish filesystem/version/mount/contention/recovery receipts.

## P1 — organization deployment and distribution

- [ ] Re-run Vault Transit and authenticated HTTP-store profiles with organization-owned identities, audit logs, denial injection, backup restoration, primary-region failure, and secondary recovery.
- [ ] Publish the signed Kennel package through an approved immutable registry/mirror and preserve install, upgrade, rollback, and offline-cache restoration receipts.
- [ ] Test every pinned ecosystem integration against its next immutable released version and record explicit compatible/incompatible results.

## P2 — human and privacy evidence

- [ ] Complete the independent screen-reader, 400% zoom, forced-colors, and operator study; convert confirmed defects into deterministic fixtures where possible.
- [ ] Obtain privacy approval for the documentation opt-in endpoint, activate it without runtime telemetry, and publish only cohort-suppressed real conversion aggregates.
- [ ] Reopen the read-only service decision only after at least two independent named deployment cases exist and every authentication, tenancy, browser, TLS, rate, audit, and recovery contract is approved.

## Release boundary

- Every receipt must bind exact Tribunal/Kujo revisions, runtime digest, environment identity, platform/filesystem or service version, time, limitations, and verifiable provenance.
- External blockers remain incomplete until their evidence exists; planned jobs, empty registers, and reference fixtures do not satisfy them.
- The maintained compatibility workflow uses current `ubuntu-24.04`, `macos-15-intel`, and `macos-15` runner labels. Run `29226107970` confirms that GitHub Actions billing/spending authorization must be restored before those jobs can produce candidate receipts.
