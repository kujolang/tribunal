# Evidence encryption and recovery

Tribunal keeps authenticity separate from confidentiality. A run is first SHA-256 manifested and signed. Portable encryption then protects every artifact with a fresh AES-256-GCM data key and wraps that key for one primary RSA-OAEP recipient and, optionally, one independent recovery recipient.

The signed `artifact-manifest.json` and `signature.json` remain in the bundle's `integrity/` boundary. Their signature and every ciphertext digest can therefore be verified without a decryption key. Decryption still rechecks each GCM tag, plaintext digest, byte count, signed manifest, trusted signing key, and import target.

```bash
./bin/tribunal bundle-encrypt <run-id> \
  --output ./decision.packet \
  --recipient-public-key ./custody-primary-public.pem \
  --recovery-public-key ./custody-recovery-public.pem

./bin/tribunal bundle-decrypt ./decision.packet \
  --recipient-private-key ./custody-primary-private.pem \
  --trust-policy ./trust-policy.json \
  --target bundle-import

./bin/tribunal bundle-rekey ./decision.packet \
  --recipient-private-key ./custody-primary-private.pem \
  --recipient-public-key ./custody-successor-public.pem
```

Rekeying unwraps and rewraps only the data key; ciphertext remains unchanged. The recovery recipient survives primary rotation. A legal-hold snapshot travels in the envelope, but encryption, export, rekey, and recovery never delete or mutate the source run. Deletion remains controlled by Tribunal's external legal-hold and tombstone workflow.

Private recipient keys must be held outside the repository and run storage. For regulated deployment, replace local recipient-key access with a certified managed unwrap adapter and preserve tested recovery copies under split custody.
