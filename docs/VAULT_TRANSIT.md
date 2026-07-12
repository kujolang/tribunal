# Vault Transit managed-signing profile

Tribunal includes a Kujo-only HashiCorp Vault Transit adapter and a fail-closed live certification harness. Transit performs RSA signing without exporting private key material; Tribunal authenticates with a short-lived workload JWT and retains only the public key, signature, Vault request ID, key version, attempt count, and workload entity ID.

## Vault boundary

Create an RSA-2048 or RSA-4096 Transit key with signing enabled. Give the workload role only `read` on `transit/keys/<key>` and `update` on `transit/sign/<key>`. Give a separate negative-test role no Transit permissions. Bind both JWT roles to an exact issuer, audience, subject, and repository/service identity. Do not issue static Vault tokens to Tribunal.

The adapter supports `TRIBUNAL_WORKLOAD_IDENTITY_TOKEN_FILE`, AWS web-identity token files, Azure federated token files, and GitHub Actions OIDC. It rejects non-HTTPS remote endpoints, embedded credentials, unsafe paths, unbounded retries, malformed keys, private-key responses, and unsupported algorithms.

## Certification

Prepare three provider files using [`examples/signing-provider.json`](../examples/signing-provider.json): an active key, a denied role, and a rotated successor key. Then run:

```bash
export TRIBUNAL_HOME="$PWD"
export KUJO_BIN=../kujo/target/release/kujo
export TRIBUNAL_WORKLOAD_IDENTITY_TOKEN_FILE=/run/secrets/tribunal-oidc.jwt
export TRIBUNAL_KMS_PRIMARY_CONFIG=/secure/primary.json
export TRIBUNAL_KMS_DENIED_CONFIG=/secure/denied.json
export TRIBUNAL_KMS_ROTATED_CONFIG=/secure/rotated.json
export TRIBUNAL_KMS_REPORT=/secure/evidence/kms-conformance.json
"$KUJO_BIN" run scripts/kms_conformance.kujo
```

Certification succeeds only when workload identity, Vault audit IDs, denial, bounded retry, key rotation, old-key rejection, signature verification, and non-export are all proven. Preserve the report with the matching Vault audit records. A fixture run or an unconfigured repository is not a certification claim.

HashiCorp references: [JWT login API](https://developer.hashicorp.com/vault/api-docs/auth/jwt#jwt-login), [Transit sign API](https://developer.hashicorp.com/vault/api-docs/secret/transit#sign-data), and [Transit key API](https://developer.hashicorp.com/vault/api-docs/secret/transit#read-key).
