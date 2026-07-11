# Read-only UI evaluation

## Decision

Continue providing an authorized offline HTML export in v0.5.0; do not introduce a network API or hosted UI without an approved transport and tenancy contract.

## Rationale

The identity/role policy now defines application permissions, but a network service would additionally require authenticated subject binding, tenant isolation, rate limits, request limits, CORS/CSRF decisions, secure session/token handling, and deployment-specific TLS. Adding a server before those choices would broaden risk without improving the sealed evidence contract.

`tribunal dashboard-export --output <html>` instead creates a static, script-free, escaped, CSP-restricted view outside run storage. It refuses overwrites, shows aggregate cards and up to 500 recent runs, and requires `dashboard.export`; sealed evidence is unchanged.

An organization may publish the generated file only behind its existing authenticated static-hosting boundary. A native hosted UI remains a future product decision, not an implicit local default.
