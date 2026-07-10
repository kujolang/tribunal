/* global process */
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = resolve(import.meta.dirname, "..");
const temp = await mkdtemp(join(tmpdir(), "tribunal-schema-gate-"));
const storage = join(temp, "runs");
try {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const schemaFiles = {
    config: "tribunal-config.schema.json",
    record: "tribunal-record.schema.json",
    event: "tribunal-event.schema.json",
    manifest: "artifact-manifest.schema.json",
    signature: "signature.schema.json",
    ingestion: "ingestion-receipt.schema.json",
  };
  const validators = {};
  for (const [name, file] of Object.entries(schemaFiles)) {
    const schema = JSON.parse(
      await readFile(join(root, "schemas", file), "utf8"),
    );
    validators[name] = ajv.compile(schema);
  }

  validate(
    validators.config,
    JSON.parse(await readFile(join(root, "tribunal.config.json"), "utf8")),
    "config",
  );
  const docket = join(temp, "docket.md");
  await writeFile(
    docket,
    "# Schema gate docket\n\n## Scope\n\nValidate emitted contracts.\n",
  );
  const { privateKey } = generateKeyPairSync("ed25519");
  const privatePath = join(temp, "private.pem");
  await writeFile(
    privatePath,
    privateKey.export({ type: "pkcs8", format: "pem" }),
    { mode: 0o600 },
  );
  const review = run(process.execPath, [
    join(root, "dist/src/cli.js"),
    "review",
    docket,
    "--storage-dir",
    storage,
    "--private-key",
    privatePath,
  ]);
  const runId = review.stdout.trim().split("\n")[0];
  if (!runId) throw new Error("Schema gate review returned no run ID.");
  const runDir = join(storage, runId);
  validate(
    validators.record,
    JSON.parse(await readFile(join(runDir, "record.json"), "utf8")),
    "record",
  );
  for (const [index, line] of (
    await readFile(join(runDir, "events.jsonl"), "utf8")
  )
    .split("\n")
    .filter(Boolean)
    .entries()) {
    validate(validators.event, JSON.parse(line), `event[${index}]`);
  }
  const manifest = JSON.parse(
    await readFile(join(runDir, "artifact-manifest.json"), "utf8"),
  );
  const signature = JSON.parse(
    await readFile(join(runDir, "signature.json"), "utf8"),
  );
  validate(validators.manifest, manifest, "artifact manifest");
  validate(validators.signature, signature, "signature");
  validate(
    validators.ingestion,
    {
      schemaVersion: "1.0.0",
      target: "runledger",
      tribunalRunId: runId,
      manifestSha256: signature.manifestSha256,
      keyId: signature.keyId,
      ingestedAt: new Date().toISOString(),
      targetId: "schema-gate-target",
      targetPath: "/tmp/schema-gate-target.json",
    },
    "ingestion receipt",
  );
  process.stdout.write(
    `Schema gate passed: ${Object.keys(validators).length} schemas; ${manifest.artifacts.length} artifacts; emitted record and events validated.\n`,
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}

function validate(validator, value, label) {
  if (!validator(value)) {
    throw new Error(
      `${label} failed schema validation: ${JSON.stringify(validator.errors)}`,
    );
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `${command} exited ${result.status}: ${result.stderr || result.stdout}`,
    );
  }
  return result;
}
