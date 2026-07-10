import { spawn } from "node:child_process";
import { copyFile, mkdir, realpath, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { ArtifactIntegrity } from "./integrity.js";
import type { RunStore } from "./persistence.js";
import { now } from "./util.js";
import type { TribunalRecord } from "./types.js";

export interface RunLedgerIngestionOptions {
  publicKeyPath: string;
  runledgerBin: string;
  kujoBin: string;
  ledgerDir: string;
}

export interface CaseFileIngestionOptions {
  publicKeyPath: string;
  casefilePath: string;
  kujoBin: string;
  outputDir: string;
}

export interface IngestionReceipt {
  schemaVersion: "1.0.0";
  target: "runledger" | "casefile";
  tribunalRunId: string;
  manifestSha256: string;
  keyId: string;
  ingestedAt: string;
  targetId: string;
  targetPath: string;
}

export class SignedRunIngestion {
  private readonly integrity: ArtifactIntegrity;

  constructor(private readonly store: RunStore) {
    this.integrity = new ArtifactIntegrity(store);
  }

  async intoRunLedger(
    runId: string,
    options: RunLedgerIngestionOptions,
  ): Promise<IngestionReceipt> {
    const verified = await this.requireTrustedSignature(
      runId,
      options.publicKeyPath,
    );
    const record = await this.store.readRecord(runId);
    const provider = record.ruling?.metadata.provider ?? "tribunal";
    const model = record.ruling?.metadata.model ?? "mixed-panel";
    const task = `Tribunal: ${record.docket?.title ?? runId}`;
    const repoPath = record.docket
      ? dirname(record.docket.sourcePath)
      : process.cwd();
    const promptPath = join(this.store.runDir(runId), "decision-packet.md");
    const common = ["--ledger", resolve(options.ledgerDir)];
    const started = await runProcess(
      resolve(options.runledgerBin),
      [
        "start",
        "--provider",
        provider,
        "--model",
        model,
        "--task",
        task,
        "--prompt",
        promptPath,
        "--repo",
        repoPath,
        ...common,
      ],
      process.cwd(),
      { KUJO: resolve(options.kujoBin) },
    );
    const targetId = /^Started run:\s+(.+)$/m.exec(started.stdout)?.[1]?.trim();
    if (!targetId) throw new Error("RunLedger did not return a run ID.");

    const usage = aggregateUsage(record);
    if (usage.input > 0 || usage.output > 0) {
      await runProcess(
        resolve(options.runledgerBin),
        [
          "usage",
          targetId,
          "--input",
          String(usage.input),
          "--output",
          String(usage.output),
          ...common,
        ],
        process.cwd(),
        { KUJO: resolve(options.kujoBin) },
      );
    }
    await runProcess(
      resolve(options.runledgerBin),
      [
        "note",
        targetId,
        `Verified Tribunal run ${runId}; manifest ${verified.manifestSha256}; key ${verified.keyId}.`,
        ...common,
      ],
      process.cwd(),
      { KUJO: resolve(options.kujoBin) },
    );
    for (const followup of record.decisionPacket?.requiredNextActions ?? []) {
      await runProcess(
        resolve(options.runledgerBin),
        ["followup", targetId, followup, ...common],
        process.cwd(),
        { KUJO: resolve(options.kujoBin) },
      );
    }
    const status = runLedgerStatus(record);
    await runProcess(
      resolve(options.runledgerBin),
      [
        "finish",
        targetId,
        "--status",
        status,
        "--verdict",
        record.ruling?.finalVerdict ??
          record.stopReason ??
          "Tribunal run ingested.",
        "--repo",
        repoPath,
        ...common,
      ],
      process.cwd(),
      { KUJO: resolve(options.kujoBin) },
    );
    return {
      schemaVersion: "1.0.0",
      target: "runledger",
      tribunalRunId: runId,
      manifestSha256: verified.manifestSha256,
      keyId: verified.keyId,
      ingestedAt: now(),
      targetId,
      targetPath: join(resolve(options.ledgerDir), "runs", `${targetId}.json`),
    };
  }

  async intoCaseFile(
    runId: string,
    options: CaseFileIngestionOptions,
  ): Promise<IngestionReceipt> {
    const verified = await this.requireTrustedSignature(
      runId,
      options.publicKeyPath,
    );
    const record = await this.store.readRecord(runId);
    const outputRoot = resolve(options.outputDir);
    await mkdir(dirname(outputRoot), { recursive: true });
    const notes = [
      `Verified signed Tribunal run ${runId}.`,
      `Manifest SHA-256: ${verified.manifestSha256}.`,
      `Trusted key: ${verified.keyId}.`,
      `Disposition: ${record.ruling?.disposition ?? "stopped"}.`,
    ].join(" ");
    const captured = await runProcess(
      resolve(options.kujoBin),
      [
        "run",
        "--interpreter",
        resolve(options.casefilePath),
        "--",
        "capture",
        "--manual",
        "--name",
        `tribunal-${runId}`,
        "--notes",
        notes,
        "--format",
        "json",
        "--output-dir",
        basename(outputRoot),
      ],
      dirname(outputRoot),
    );
    const caseJson = parseLastJson(captured.stdout) as {
      case?: { id?: string; path?: string };
    };
    const targetId = caseJson.case?.id;
    const rawTargetPath = caseJson.case?.path;
    if (!targetId || !rawTargetPath)
      throw new Error("CaseFile did not return a case identity.");
    const targetPath = await realpath(
      resolve(dirname(outputRoot), rawTargetPath),
    );
    const canonicalOutputRoot = await realpath(outputRoot);
    const relativeTarget = relative(canonicalOutputRoot, targetPath);
    if (
      relativeTarget === "" ||
      relativeTarget === ".." ||
      relativeTarget.startsWith(".." + sep)
    ) {
      throw new Error(
        "CaseFile returned a case path outside the requested output root.",
      );
    }
    const evidenceDir = join(targetPath, "tribunal-evidence");
    await mkdir(evidenceDir, { recursive: true });
    for (const name of [
      "artifact-manifest.json",
      "signature.json",
      "decision-packet.md",
      "ruling.md",
      "receipt.json",
    ]) {
      await copyFile(
        join(this.store.runDir(runId), name),
        join(evidenceDir, name),
      );
    }
    const receipt: IngestionReceipt = {
      schemaVersion: "1.0.0",
      target: "casefile",
      tribunalRunId: runId,
      manifestSha256: verified.manifestSha256,
      keyId: verified.keyId,
      ingestedAt: now(),
      targetId,
      targetPath,
    };
    await writeFile(
      join(targetPath, "tribunal-ingestion.json"),
      JSON.stringify(receipt, null, 2) + "\n",
      { mode: 0o600 },
    );
    return receipt;
  }

  private async requireTrustedSignature(runId: string, publicKeyPath: string) {
    const verified = await this.integrity.verify(runId, publicKeyPath);
    if (
      !verified.ok ||
      verified.signature !== "verified" ||
      !verified.manifestSha256 ||
      !verified.keyId
    ) {
      throw new Error(
        `Signed ingestion refused: ${[
          ...verified.errors,
          ...verified.missing.map((value) => `missing ${value}`),
          ...verified.unexpected.map((value) => `unexpected ${value}`),
          ...verified.mismatched.map((value) => `mismatched ${value.path}`),
          verified.signature !== "verified"
            ? `signature ${verified.signature}`
            : "",
        ]
          .filter(Boolean)
          .join("; ")}`,
      );
    }
    return {
      manifestSha256: verified.manifestSha256,
      keyId: verified.keyId,
    };
  }
}

function aggregateUsage(record: TribunalRecord): {
  input: number;
  output: number;
} {
  const metadata = [
    ...record.testimonies.map((item) => item.metadata),
    ...record.crossExaminations.map((item) => item.metadata),
    ...(record.killPass ? [record.killPass.metadata] : []),
    ...(record.ruling ? [record.ruling.metadata] : []),
  ];
  return metadata.reduce(
    (sum, item) => ({
      input: sum.input + (item.inputTokens ?? 0),
      output: sum.output + (item.outputTokens ?? 0),
    }),
    { input: 0, output: 0 },
  );
}

function runLedgerStatus(record: TribunalRecord): "pass" | "partial" | "fail" {
  if (record.status === "stopped" || record.ruling?.disposition === "reject")
    return "fail";
  if (
    record.ruling?.disposition === "pause" ||
    record.ruling?.disposition === "redesign"
  )
    return "partial";
  return "pass";
}

async function runProcess(
  command: string,
  args: string[],
  cwd: string,
  env: Record<string, string> = {},
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on(
      "data",
      (chunk: Buffer) => (stdout += chunk.toString("utf8")),
    );
    child.stderr.on(
      "data",
      (chunk: Buffer) => (stderr += chunk.toString("utf8")),
    );
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `${basename(command)} exited ${code}: ${redact(stderr || stdout)}`,
          ),
        );
      } else {
        resolvePromise({ stdout, stderr });
      }
    });
  });
}

function parseLastJson(output: string): unknown {
  const start = output.lastIndexOf("\n{");
  const text = (start >= 0 ? output.slice(start + 1) : output).trim();
  return JSON.parse(text);
}

function redact(value: string): string {
  return value.replace(
    /(api[_-]?key|authorization|token)([\s:="']+)[^\s,}"']+/gi,
    "$1$2[REDACTED]",
  );
}
