# Read-only UI evaluation

## Decision

Continue providing an authorized offline HTML export in Tribunal 1.x; do not introduce a network API or hosted UI without an approved transport and tenancy contract.

## Rationale

The identity/role policy now defines application permissions, but a network service would additionally require authenticated subject binding, tenant isolation, rate limits, request limits, CORS/CSRF decisions, secure session/token handling, and deployment-specific TLS. Adding a server before those choices would broaden risk without improving the sealed evidence contract.

`tribunal dashboard-export --output <html>` instead creates a static, script-free, escaped, CSP-restricted view outside run storage. It refuses overwrites, shows aggregate cards and a cursor-bounded page of 100 recent runs, and requires `dashboard.export`; sealed evidence is unchanged.

## Accessibility and usability evaluation

The offline export targets WCAG 2.2 AA fundamentals: document language and title, semantic heading order, definition-list totals, a captioned table with scoped column headers, a keyboard skip link, keyboard-accessible overflow region, responsive horizontal scrolling, 16px base text, 1.6 line height, and high-contrast foreground/border colors. It contains no motion, scripts, forms, images, hidden state, or color-only status encoding. The CSP prevents network resources.

`scripts/dashboard_accessibility_gate.kujo` checks those deterministic properties and rejects raw unescaped docket/run values. Manual evaluation remains required for screen-reader pronunciation, browser zoom to 400%, forced-colors mode, and organization-specific usability. Any future hosted experience must add authenticated-session and dynamic-focus testing before approval.

An organization may publish the generated file only behind its existing authenticated static-hosting boundary. A native hosted UI remains a future product decision, not an implicit local default.
