# Authenticated immutable HTTP-store profile

Tribunal's remote store client requires HTTPS outside loopback development, a bearer token file, an explicit tenant ID, and an explicit region. Credentials are loaded per operation, sent only in the `Authorization` header, and never accepted in URLs or returned in errors. Every request also carries `X-Tribunal-Tenant` and `X-Tribunal-Region`.

Artifact uploads use `If-None-Match: *` and a content SHA-256. Version finalization uses `If-None-Match` or `If-Match` plus an idempotency key. Network, rate-limit, and server failures receive three bounded attempts. Failed multipart publication calls the version-staging cleanup endpoint before returning. Pull validates metadata, tenant-selected version, size limits, every signed artifact digest, the evidence signature, and the trust policy before accepting a run.

The live harness in [`scripts/http_store_conformance.kujo`](../scripts/http_store_conformance.kujo) requires seven independently administered profiles: primary, other tenant, partial-upload fault, corrupt replica, backup, unavailable primary-region fault, and secondary region. It certifies authenticated publication, a conditional-write race, tenant denial, partial-upload cleanup, corruption rejection, backup restore, primary-region failure, and secondary-region recovery. Test doubles do not establish a production certification claim; preserve the generated report with service audit logs, object-retention configuration, backup receipts, and fault-injection evidence.

Each profile is the `artifact_store` object from the Tribunal config:

```json
{
  "provider": "http-immutable",
  "root": "",
  "endpoint": "https://evidence.example.com",
  "tenant_id": "tenant-a",
  "bearer_token_file": "/run/secrets/evidence-token",
  "region": "us-east-1"
}
```
