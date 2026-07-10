import {
  createPrivateKey,
  createPublicKey,
  sign as signBytes,
  verify as verifyBytes,
} from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import { isAbsolute, join, normalize, relative, resolve, sep } from "node:path";
import type { RunStore } from "./persistence.js";
import { now, sha256 } from "./util.js";

export const INTEGRITY_MANIFEST = "artifact-manifest.json";
export const INTEGRITY_SIGNATURE = "signature.json";

export interface ArtifactDigest {
  path: string;
  bytes: number;
  sha256: string;
}

export interface ArtifactManifest {
  schemaVersion: "1.0.0";
  runId: string;
  generatedAt: string;
  algorithm: "sha256";
  exclusions: ["artifact-manifest.json", "signature.json"];
  artifacts: ArtifactDigest[];
}

export interface SignatureEnvelope {
  schemaVersion: "1.0.0";
  runId: string;
  algorithm: "Ed25519";
  manifestSha256: string;
  keyId: string;
  signedAt: string;
  signature: string;
}

export interface IntegrityVerification {
  ok: boolean;
  runId: string;
  manifestSha256?: string;
  artifactsChecked: number;
  missing: string[];
  unexpected: string[];
  mismatched: Array<{
    path: string;
    expectedSha256: string;
    actualSha256: string;
    expectedBytes: number;
    actualBytes: number;
  }>;
  signature: "absent" | "present-unverified" | "verified" | "invalid";
  keyId?: string;
  errors: string[];
}

export class ArtifactIntegrity {
  constructor(private readonly store: RunStore) {}

  async seal(
    runId: string,
    privateKeyPath?: string,
  ): Promise<{
    manifest: ArtifactManifest;
    signature?: SignatureEnvelope;
  }> {
    await rm(join(this.store.runDir(runId), INTEGRITY_SIGNATURE), {
      force: true,
    });
    const names = (await this.store.artifactNames(runId)).filter(
      (name) => name !== INTEGRITY_MANIFEST && name !== INTEGRITY_SIGNATURE,
    );
    const artifacts: ArtifactDigest[] = [];
    for (const name of names) {
      const contents = await readFile(
        safeArtifactPath(this.store, runId, name),
      );
      artifacts.push({
        path: name,
        bytes: contents.byteLength,
        sha256: sha256(contents),
      });
    }
    const manifest: ArtifactManifest = {
      schemaVersion: "1.0.0",
      runId,
      generatedAt: now(),
      algorithm: "sha256",
      exclusions: [INTEGRITY_MANIFEST, INTEGRITY_SIGNATURE],
      artifacts,
    };
    await this.store.writeJson(runId, INTEGRITY_MANIFEST, manifest);
    if (!privateKeyPath) return { manifest };

    const manifestBytes = await readFile(
      join(this.store.runDir(runId), INTEGRITY_MANIFEST),
    );
    const privateKey = createPrivateKey(
      await readFile(resolve(privateKeyPath)),
    );
    if (privateKey.asymmetricKeyType !== "ed25519") {
      throw new Error("Tribunal signing keys must be Ed25519 private keys.");
    }
    const publicKey = createPublicKey(privateKey);
    const keyId = sha256(
      publicKey.export({ type: "spki", format: "der" }) as Buffer,
    ).slice(0, 32);
    const signature: SignatureEnvelope = {
      schemaVersion: "1.0.0",
      runId,
      algorithm: "Ed25519",
      manifestSha256: sha256(manifestBytes),
      keyId,
      signedAt: now(),
      signature: signBytes(null, manifestBytes, privateKey).toString("base64"),
    };
    await this.store.writeJson(runId, INTEGRITY_SIGNATURE, signature);
    return { manifest, signature };
  }

  async verify(
    runId: string,
    publicKeyPath?: string,
  ): Promise<IntegrityVerification> {
    const missing: string[] = [];
    const unexpected: string[] = [];
    const mismatched: IntegrityVerification["mismatched"] = [];
    const errors: string[] = [];
    let manifest: ArtifactManifest;
    let manifestBytes: Buffer;
    try {
      manifestBytes = await readFile(
        join(this.store.runDir(runId), INTEGRITY_MANIFEST),
      );
      manifest = JSON.parse(manifestBytes.toString("utf8")) as ArtifactManifest;
    } catch (error) {
      return {
        ok: false,
        runId,
        artifactsChecked: 0,
        missing: [INTEGRITY_MANIFEST],
        unexpected,
        mismatched,
        signature: "absent",
        errors: [
          `Integrity manifest is missing or invalid: ${(error as Error).message}`,
        ],
      };
    }

    if (
      manifest.schemaVersion !== "1.0.0" ||
      manifest.runId !== runId ||
      manifest.algorithm !== "sha256" ||
      !Array.isArray(manifest.artifacts)
    ) {
      errors.push("Integrity manifest contract is invalid.");
    }

    const expectedNames = new Set<string>();
    let checked = 0;
    for (const artifact of manifest.artifacts ?? []) {
      try {
        const path = safeArtifactPath(this.store, runId, artifact.path);
        if (expectedNames.has(artifact.path)) {
          errors.push(`Duplicate integrity entry: ${artifact.path}`);
          continue;
        }
        expectedNames.add(artifact.path);
        const contents = await readFile(path);
        checked += 1;
        const actualSha256 = sha256(contents);
        if (
          actualSha256 !== artifact.sha256 ||
          contents.byteLength !== artifact.bytes
        ) {
          mismatched.push({
            path: artifact.path,
            expectedSha256: artifact.sha256,
            actualSha256,
            expectedBytes: artifact.bytes,
            actualBytes: contents.byteLength,
          });
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          missing.push(artifact.path);
        } else {
          errors.push(`${artifact.path}: ${(error as Error).message}`);
        }
      }
    }

    const actualNames = (await this.store.artifactNames(runId)).filter(
      (name) => name !== INTEGRITY_MANIFEST && name !== INTEGRITY_SIGNATURE,
    );
    for (const name of actualNames) {
      if (!expectedNames.has(name)) unexpected.push(name);
    }

    let signatureStatus: IntegrityVerification["signature"] = "absent";
    let keyId: string | undefined;
    try {
      const signature = JSON.parse(
        await readFile(
          join(this.store.runDir(runId), INTEGRITY_SIGNATURE),
          "utf8",
        ),
      ) as SignatureEnvelope;
      signatureStatus = "present-unverified";
      keyId = signature.keyId;
      if (
        signature.schemaVersion !== "1.0.0" ||
        signature.runId !== runId ||
        signature.algorithm !== "Ed25519" ||
        signature.manifestSha256 !== sha256(manifestBytes)
      ) {
        signatureStatus = "invalid";
        errors.push(
          "Signature envelope does not match the integrity manifest.",
        );
      } else if (publicKeyPath) {
        const publicKey = createPublicKey(
          await readFile(resolve(publicKeyPath)),
        );
        const trustedKeyId = sha256(
          publicKey.export({ type: "spki", format: "der" }) as Buffer,
        ).slice(0, 32);
        const valid =
          trustedKeyId === signature.keyId &&
          verifyBytes(
            null,
            manifestBytes,
            publicKey,
            Buffer.from(signature.signature, "base64"),
          );
        signatureStatus = valid ? "verified" : "invalid";
        if (!valid)
          errors.push("Signature did not verify with the trusted public key.");
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT" && publicKeyPath) {
        errors.push(
          "A trusted public key was supplied but signature.json is missing.",
        );
      } else if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        signatureStatus = "invalid";
        errors.push(
          `Signature envelope is invalid: ${(error as Error).message}`,
        );
      }
    }

    return {
      ok:
        missing.length === 0 &&
        unexpected.length === 0 &&
        mismatched.length === 0 &&
        errors.length === 0,
      runId,
      manifestSha256: sha256(manifestBytes),
      artifactsChecked: checked,
      missing,
      unexpected,
      mismatched,
      signature: signatureStatus,
      ...(keyId ? { keyId } : {}),
      errors,
    };
  }
}

function safeArtifactPath(
  store: RunStore,
  runId: string,
  name: string,
): string {
  if (!name || isAbsolute(name) || normalize(name).split(sep).includes("..")) {
    throw new Error(`Unsafe artifact path '${name}'.`);
  }
  const root = resolve(store.runDir(runId));
  const target = resolve(root, name);
  if (relative(root, target).startsWith(".." + sep) || target === root) {
    throw new Error(`Artifact path escapes run directory: '${name}'.`);
  }
  return target;
}
