import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const exec = promisify(execFile);
const cli = resolve("dist/src/cli.js");

test("CLI review, list, show, replay, and export work offline", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "tribunal-cli-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const docket = join(dir, "docket.md");
  const storage = join(dir, "runs");
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const privatePath = join(dir, "private.pem");
  const publicPath = join(dir, "public.pem");
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
  await writeFile(
    docket,
    "# CLI decision\n\n## Scope\n\nProve CLI contracts.\n",
  );

  const review = await exec(process.execPath, [
    cli,
    "review",
    docket,
    "--panel",
    "fast-two-model",
    "--storage-dir",
    storage,
    "--private-key",
    privatePath,
  ]);
  const runId = review.stdout.split("\n")[0]!;
  assert.match(runId, /^\d{4}-/);

  const listed = await exec(process.execPath, [
    cli,
    "list",
    "--storage-dir",
    storage,
  ]);
  assert.match(listed.stdout, new RegExp(runId));
  const shown = await exec(process.execPath, [
    cli,
    "show",
    runId,
    "--storage-dir",
    storage,
  ]);
  assert.match(shown.stdout, /Decision packet: available/);
  const replayed = await exec(process.execPath, [
    cli,
    "replay",
    runId,
    "--storage-dir",
    storage,
    "--public-key",
    publicPath,
  ]);
  assert.match(replayed.stdout, /integrity\t\d+ artifacts\tverified/);
  assert.match(replayed.stdout, /blind-first-pass/);
  const verified = await exec(process.execPath, [
    cli,
    "verify",
    runId,
    "--storage-dir",
    storage,
    "--public-key",
    publicPath,
  ]);
  assert.equal(JSON.parse(verified.stdout).signature, "verified");
  const exported = await exec(process.execPath, [
    cli,
    "export",
    runId,
    "--format",
    "json",
    "--storage-dir",
    storage,
  ]);
  assert.equal(JSON.parse(exported.stdout).runId, runId);
  const jsonl = await exec(process.execPath, [
    cli,
    "export",
    runId,
    "--format",
    "jsonl",
    "--storage-dir",
    storage,
  ]);
  assert.ok(
    jsonl.stdout
      .trim()
      .split("\n")
      .every((line) => JSON.parse(line).runId === runId),
  );

  await writeFile(join(storage, runId, "ruling.md"), "tampered\n");
  await assert.rejects(
    () =>
      exec(process.execPath, [
        cli,
        "replay",
        runId,
        "--storage-dir",
        storage,
        "--public-key",
        publicPath,
      ]),
    (error: unknown) => {
      assert.match(
        (error as { stderr: string }).stderr,
        /Replay verification failed/,
      );
      return true;
    },
  );
});

test("CLI catalog commands expose required presets and seats", async () => {
  const panels = await exec(process.execPath, [cli, "panels"]);
  for (const panel of ["executioner-only", "fast-two-model", "strategic-five"])
    assert.match(panels.stdout, new RegExp(panel));
  const seats = await exec(process.execPath, [cli, "seats"]);
  for (const seat of [
    "judge",
    "executioner",
    "builder",
    "operator",
    "market-lens",
  ])
    assert.match(seats.stdout, new RegExp(seat));
});
