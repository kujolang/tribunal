import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { DEFAULT_CONFIG } from "../src/config.js";
import { PackWriteContextPackBuilder } from "../src/context.js";
import { ArtifactIntegrity } from "../src/integrity.js";
import { SignedRunIngestion } from "../src/integrations.js";
import { KujoAiSdkBridge } from "../src/model/KujoAiSdkBridge.js";
import { MockKujoModelClient } from "../src/model/MockKujoModelClient.js";
import { RunStore } from "../src/persistence.js";
import { Tribunal, TribunalStoppedError } from "../src/tribunal.js";
import type { TribunalConfig } from "../src/types.js";

async function fixture(): Promise<{
  dir: string;
  docket: string;
  config: TribunalConfig;
}> {
  const dir = await mkdtemp(join(tmpdir(), "tribunal-test-"));
  const docket = join(dir, "docket.md");
  await import("node:fs/promises").then(({ writeFile }) =>
    writeFile(
      docket,
      "# Ship a bounded change\n\n## Scope\n\nAdd the smallest testable capability.\n\n## Non-goals\n\n- No web UI\n",
    ),
  );
  const config = structuredClone(DEFAULT_CONFIG);
  config.tribunal.storageDir = join(dir, "runs");
  return { dir, docket, config };
}

test("mock review executes every stage and writes the durable record", async (t) => {
  const f = await fixture();
  t.after(() => rm(f.dir, { recursive: true, force: true }));
  const client = new MockKujoModelClient();
  const result = await new Tribunal(f.config, client).review(
    f.docket,
    "strategic-five",
  );
  const store = new RunStore(f.config.tribunal.storageDir);

  assert.equal(result.record.status, "completed");
  assert.equal(result.record.testimonies.length, 5);
  assert.equal(result.record.crossExaminations.length, 5);
  assert.deepEqual(result.record.stagesCompleted, [
    "open-docket",
    "validate-scope",
    "build-context-pack",
    "blind-first-pass",
    "cross-examination",
    "executioner-kill-pass",
    "judge-ruling",
    "decision-packet",
    "persist-record",
  ]);

  const artifacts = await store.artifactNames(result.runId);
  for (const required of [
    "docket.md",
    "manifest.json",
    "context.md",
    "cross-examination.md",
    "kill-pass.md",
    "ruling.md",
    "decision-packet.md",
    "record.json",
    "events.jsonl",
    "receipt.json",
    "artifact-manifest.json",
  ]) {
    assert.ok(artifacts.includes(required), `missing ${required}`);
  }
  assert.equal(
    artifacts.filter((name) => name.startsWith("testimony/")).length,
    5,
  );
  assert.ok(
    artifacts.filter((name) => name.startsWith("prompts/")).length >= 12,
  );
});

test("artifact manifests cover every run artifact and detect tampering", async (t) => {
  const f = await fixture();
  t.after(() => rm(f.dir, { recursive: true, force: true }));
  const result = await new Tribunal(f.config, new MockKujoModelClient()).review(
    f.docket,
  );
  const store = new RunStore(f.config.tribunal.storageDir);
  const integrity = new ArtifactIntegrity(store);
  const verified = await integrity.verify(result.runId);
  assert.equal(verified.ok, true);
  assert.equal(verified.signature, "absent");
  assert.ok(verified.artifactsChecked >= 15);

  await writeFile(join(result.runDir, "ruling.md"), "tampered\n");
  const tampered = await integrity.verify(result.runId);
  assert.equal(tampered.ok, false);
  assert.deepEqual(
    tampered.mismatched.map((item) => item.path),
    ["ruling.md"],
  );
});

test("Ed25519-sealed runs verify and ingest into RunLedger and CaseFile", async (t) => {
  const f = await fixture();
  t.after(() => rm(f.dir, { recursive: true, force: true }));
  const result = await new Tribunal(f.config, new MockKujoModelClient()).review(
    f.docket,
  );
  const store = new RunStore(f.config.tribunal.storageDir);
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const privatePath = join(f.dir, "signing-private.pem");
  const publicPath = join(f.dir, "signing-public.pem");
  await writeFile(
    privatePath,
    privateKey.export({ type: "pkcs8", format: "pem" }),
    { mode: 0o600 },
  );
  await writeFile(
    publicPath,
    publicKey.export({ type: "spki", format: "pem" }),
    { mode: 0o600 },
  );
  const integrity = new ArtifactIntegrity(store);
  const sealed = await integrity.seal(result.runId, privatePath);
  assert.ok(sealed.signature?.keyId);
  const verified = await integrity.verify(result.runId, publicPath);
  assert.equal(verified.ok, true);
  assert.equal(verified.signature, "verified");

  const ingestion = new SignedRunIngestion(store);
  const ledgerDir = join(f.dir, "ledger");
  const runledger = await ingestion.intoRunLedger(result.runId, {
    publicKeyPath: publicPath,
    runledgerBin: resolve("../runledger/bin/runledger"),
    kujoBin: resolve("../kujo/target/debug/kujo"),
    ledgerDir,
  });
  assert.equal(runledger.target, "runledger");
  const ledgerRecord = JSON.parse(
    await readFile(runledger.targetPath, "utf8"),
  ) as { status: string; notes: Array<{ text: string }> };
  assert.equal(ledgerRecord.status, "pass");
  assert.match(ledgerRecord.notes[0]?.text ?? "", /Verified Tribunal run/);

  const casefile = await ingestion.intoCaseFile(result.runId, {
    publicKeyPath: publicPath,
    casefilePath: resolve("../casefile/casefile.kujo"),
    kujoBin: resolve("../kujo/target/debug/kujo"),
    outputDir: join(f.dir, "casefiles"),
  });
  assert.equal(casefile.target, "casefile");
  assert.equal(
    JSON.parse(
      await readFile(
        join(casefile.targetPath, "tribunal-ingestion.json"),
        "utf8",
      ),
    ).manifestSha256,
    verified.manifestSha256,
  );
  assert.equal(
    JSON.parse(
      await readFile(
        join(casefile.targetPath, "tribunal-evidence", "signature.json"),
        "utf8",
      ),
    ).keyId,
    verified.keyId,
  );
});

test("PackWrite optionally enriches Tribunal context without model calls", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "tribunal-packwrite-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const config = structuredClone(DEFAULT_CONFIG);
  config.tribunal.storageDir = join(dir, "runs");
  const builder = new PackWriteContextPackBuilder(
    resolve("../packwrite"),
    resolve("../kujo/target/debug/kujo"),
  );
  const result = await new Tribunal(
    config,
    new MockKujoModelClient(),
    builder,
  ).review(resolve("examples/product-decision.md"));
  const content = await readFile(join(result.runDir, "context.md"), "utf8");
  assert.match(content, /Repository context \(lightweight, redacted\)/);
  assert.match(content, /Languages\/runtime: node/);
  assert.doesNotMatch(content, /node_modules\//);
  const events = await new RunStore(config.tribunal.storageDir).readEvents(
    result.runId,
  );
  assert.ok(
    events.some(
      (event) =>
        event.eventType === "context_pack_created" &&
        event.metadata.integration === "packwrite",
    ),
  );
});

test("blind testimony inputs are isolated before cross-examination", async (t) => {
  const f = await fixture();
  t.after(() => rm(f.dir, { recursive: true, force: true }));
  const client = new MockKujoModelClient();
  await new Tribunal(f.config, client).review(f.docket, "strategic-five");

  const blind = client.requests.filter(
    (request) => request.stageId === "blind-first-pass",
  );
  assert.equal(blind.length, 5);
  for (const request of blind) {
    assert.doesNotMatch(
      request.input,
      /Blind testimony from all seats|# Blind Testimony/,
    );
    assert.match(request.systemPrompt, /blind first pass/i);
  }
  const cross = client.requests.filter(
    (request) => request.stageId === "cross-examination",
  );
  assert.equal(cross.length, 5);
  assert.ok(
    cross.every((request) =>
      request.input.includes("Blind testimony from all seats"),
    ),
  );
});

test("events are replayable JSONL with stage and model evidence", async (t) => {
  const f = await fixture();
  t.after(() => rm(f.dir, { recursive: true, force: true }));
  const result = await new Tribunal(f.config, new MockKujoModelClient()).review(
    f.docket,
  );
  const events = await new RunStore(f.config.tribunal.storageDir).readEvents(
    result.runId,
  );
  assert.equal(events[0]?.eventType, "run_opened");
  assert.equal(events.at(-1)?.eventType, "run_completed");
  assert.ok(
    events.some((event) => event.eventType === "model_invocation_requested"),
  );
  assert.ok(events.some((event) => event.eventType === "record_persisted"));
  assert.ok(
    events.every((event) => event.runId === result.runId && event.stageId),
  );
});

test("executioner-only kill produces a procedural ruling and decision packet", async (t) => {
  const f = await fixture();
  t.after(() => rm(f.dir, { recursive: true, force: true }));
  const result = await new Tribunal(f.config, new MockKujoModelClient()).review(
    f.docket,
    "executioner-only",
  );
  assert.equal(result.record.seats.length, 1);
  assert.equal(result.record.ruling?.metadata.provider, "tribunal-procedural");
  assert.ok(result.record.decisionPacket?.decision);
});

test("secret exposure stops the line and leaves a partial record", async (t) => {
  const f = await fixture();
  t.after(() => rm(f.dir, { recursive: true, force: true }));
  await import("node:fs/promises").then(({ appendFile }) =>
    appendFile(f.docket, "\napi_key = sk-abcdefghijklmnopqrstuvwxyz123456\n"),
  );
  const tribunal = new Tribunal(f.config, new MockKujoModelClient());
  await assert.rejects(
    () => tribunal.review(f.docket),
    (error: unknown) => {
      assert.ok(error instanceof TribunalStoppedError);
      return true;
    },
  );
  const [manifest] = await new RunStore(f.config.tribunal.storageDir).list();
  assert.equal(manifest?.status, "stopped");
  const store = new RunStore(f.config.tribunal.storageDir);
  const record = await store.readRecord(manifest!.runId);
  assert.equal(record.status, "stopped");
  assert.match(record.stopReason ?? "", /secret exposure/i);
  assert.equal(record.docket, undefined);
  assert.ok(
    !(await store.artifactNames(manifest!.runId)).includes("docket.md"),
  );
  assert.doesNotMatch(
    await readFile(join(store.runDir(manifest!.runId), "record.json"), "utf8"),
    /sk-abcdefghijklmnopqrstuvwxyz/,
  );
});

test("missing docket stops the line and preserves minimum artifacts", async (t) => {
  const f = await fixture();
  t.after(() => rm(f.dir, { recursive: true, force: true }));
  await assert.rejects(() =>
    new Tribunal(f.config, new MockKujoModelClient()).review(
      join(f.dir, "missing.md"),
    ),
  );
  const [manifest] = await new RunStore(f.config.tribunal.storageDir).list();
  assert.equal(manifest?.status, "stopped");
  const names = await new RunStore(f.config.tribunal.storageDir).artifactNames(
    manifest!.runId,
  );
  assert.ok(names.includes("manifest.json"));
  assert.ok(names.includes("events.jsonl"));
  assert.ok(names.includes("record.json"));
  assert.ok(names.includes("receipt.json"));
});

test("required Markdown formats contain every contract section", async (t) => {
  const f = await fixture();
  t.after(() => rm(f.dir, { recursive: true, force: true }));
  const result = await new Tribunal(f.config, new MockKujoModelClient()).review(
    f.docket,
  );
  const packet = await readFile(
    join(result.runDir, "decision-packet.md"),
    "utf8",
  );
  const ruling = await readFile(join(result.runDir, "ruling.md"), "utf8");
  for (const heading of [
    "Decision",
    "Scope",
    "Non-goals",
    "Required next actions",
    "Suggested owner role",
    "Suggested model level",
    "Acceptance criteria",
    "Escalation triggers",
    "Evidence required before marking complete",
    "Stop-the-line conditions",
  ])
    assert.match(packet, new RegExp(`## ${heading}`));
  for (const heading of [
    "Final verdict",
    "Best argument for the proposal",
    "Best argument against the proposal",
    "What the panel agrees on",
    "What remains unresolved",
    "Required changes before execution",
    "Decision confidence",
    "Disposition",
  ])
    assert.match(ruling, new RegExp(`## ${heading}`));
});

test("real Kujo AI SDK bridge normalizes an offline SDK fixture", async () => {
  const bridge = new KujoAiSdkBridge({
    sdkPath: resolve("../ai-sdk"),
    kujoBin: resolve("../kujo/target/debug/kujo"),
    provider: "openai",
    offlineFixture: true,
  });
  const response = await bridge.invoke({
    runId: "bridge-test",
    stageId: "blind-first-pass",
    seatId: "judge",
    modelPreference: {
      class: "frontier_reasoning",
      preferred: ["gpt-4.1-mini"],
      fallback: "local-reasoning",
    },
    systemPrompt: "Return a concise assessment.",
    input: "Assess the fixture.",
  });
  assert.equal(response.error, undefined);
  assert.equal(response.metadata.provider, "openai");
  assert.equal(response.metadata.contractVersion, "1.0.0");
  assert.equal(response.metadata.model, "gpt-4.1-mini");
  assert.equal(response.metadata.preferenceClass, "frontier_reasoning");
  assert.equal(response.metadata.resolutionSource, "provider_class");
  assert.match(response.content, /Standardized AI SDK responses/);
});
