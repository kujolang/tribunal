import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { DEFAULT_CONFIG } from "../src/config.js";
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
  assert.match(response.content, /Standardized AI SDK responses/);
});
