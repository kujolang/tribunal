# Read-only service decision

Decision: do not ship a Tribunal network service in v0.7.0.

The offline dashboard and Kujo library API cover current read-only use without creating a new authentication or tenancy boundary. A service is justified only when a named deployment cannot use static authenticated hosting or embed the library.

Before implementation, an approved design must define mutually authenticated transport or an equivalent workload/user identity protocol; exact tenant binding at authorization and storage layers; per-identity and per-tenant rate/request/response limits; CSRF posture for browser credentials; explicit CORS allowlists; TLS versions and certificate lifecycle; secure headers; cache policy; audit event schemas; session/token rotation and revocation; pagination and backpressure; denial and abuse tests; and regional recovery. Default deny, no ambient credentials, and immutable source evidence are mandatory.

This is a deliberate non-goal, not a missing implicit endpoint. Publishing the static dashboard behind an organization-controlled authenticated static host does not turn Tribunal into a service and must not expose run storage directly.
