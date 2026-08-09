# Read-only service decision

Decision: do not ship a Tribunal network service in the v1 line.

The offline dashboard and Kujo library API cover current read-only use without creating a new authentication or tenancy boundary. A service is justified only when a named deployment cannot use static authenticated hosting or embed the library.

Before implementation, an approved design must define mutually authenticated transport or an equivalent workload/user identity protocol; exact tenant binding at authorization and storage layers; per-identity and per-tenant rate/request/response limits; CSRF posture for browser credentials; explicit CORS allowlists; TLS versions and certificate lifecycle; secure headers; cache policy; audit event schemas; session/token rotation and revocation; pagination and backpressure; denial and abuse tests; and regional recovery. Default deny, no ambient credentials, and immutable source evidence are mandatory.

This is a deliberate non-goal, not a missing implicit endpoint. Publishing the static dashboard behind an organization-controlled authenticated static host does not turn Tribunal into a service and must not expose run storage directly.

## v1 release review — 2026-08-08

No submitted deployment case demonstrates repeated demand that cannot use the offline dashboard, authenticated static hosting, or the Kujo library API. No approved authentication, tenancy, browser, TLS, rate, audit, or regional-recovery design exists. The no-service decision therefore remains in force. Reconsideration requires a demand register with at least two independent named deployment cases and approval of every security contract above; usage speculation, repository interest, or an empty fixture is not demand evidence.
