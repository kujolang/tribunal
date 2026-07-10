import {
  appendFile,
  mkdir,
  readFile,
  readdir,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { sha256 } from "./util.js";
import type {
  Receipt,
  TribunalEvent,
  TribunalManifest,
  TribunalRecord,
} from "./types.js";

const RUN_ID_PATTERN = /^[0-9TZa-f-]+$/;

export class RunStore {
  readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  async createRun(runId: string): Promise<string> {
    assertRunId(runId);
    const runDir = join(this.root, runId);
    await mkdir(join(runDir, "prompts"), { recursive: true });
    await mkdir(join(runDir, "testimony"), { recursive: true });
    return runDir;
  }

  runDir(runId: string): string {
    assertRunId(runId);
    return join(this.root, runId);
  }

  async writeJson(runId: string, name: string, value: unknown): Promise<void> {
    await atomicWrite(
      join(this.runDir(runId), name),
      JSON.stringify(value, null, 2) + "\n",
    );
  }

  async writeText(runId: string, name: string, value: string): Promise<void> {
    await atomicWrite(
      join(this.runDir(runId), name),
      value.endsWith("\n") ? value : value + "\n",
    );
  }

  async appendEvent(runId: string, event: TribunalEvent): Promise<void> {
    const path = join(this.runDir(runId), "events.jsonl");
    await appendFile(path, JSON.stringify(event) + "\n", {
      encoding: "utf8",
      mode: 0o600,
    });
  }

  async writeManifest(
    runId: string,
    manifest: TribunalManifest,
  ): Promise<void> {
    await this.writeJson(runId, "manifest.json", manifest);
  }

  async writeRecord(runId: string, record: TribunalRecord): Promise<string> {
    const serialized = JSON.stringify(record, null, 2) + "\n";
    await atomicWrite(join(this.runDir(runId), "record.json"), serialized);
    return sha256(serialized);
  }

  async writeReceipt(runId: string, receipt: Receipt): Promise<void> {
    await this.writeJson(runId, "receipt.json", receipt);
  }

  async readRecord(runId: string): Promise<TribunalRecord> {
    return JSON.parse(
      await readFile(join(this.runDir(runId), "record.json"), "utf8"),
    ) as TribunalRecord;
  }

  async readManifest(runId: string): Promise<TribunalManifest> {
    return JSON.parse(
      await readFile(join(this.runDir(runId), "manifest.json"), "utf8"),
    ) as TribunalManifest;
  }

  async readEvents(runId: string): Promise<TribunalEvent[]> {
    const raw = await readFile(
      join(this.runDir(runId), "events.jsonl"),
      "utf8",
    );
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as TribunalEvent);
  }

  async list(): Promise<TribunalManifest[]> {
    try {
      const entries = await readdir(this.root, { withFileTypes: true });
      const manifests: TribunalManifest[] = [];
      for (const entry of entries
        .filter((item) => item.isDirectory())
        .sort((a, b) => b.name.localeCompare(a.name))) {
        try {
          manifests.push(await this.readManifest(entry.name));
        } catch {
          // Ignore unrelated/corrupted directories in list; show by ID still surfaces the error.
        }
      }
      return manifests;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  async artifactNames(runId: string): Promise<string[]> {
    const runDir = this.runDir(runId);
    const names: string[] = [];
    async function walk(dir: string, prefix = ""): Promise<void> {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const relative = join(prefix, entry.name);
        if (entry.isDirectory()) await walk(join(dir, entry.name), relative);
        else if ((await stat(join(dir, entry.name))).isFile())
          names.push(relative);
      }
    }
    await walk(runDir);
    return names.sort();
  }
}

async function atomicWrite(path: string, contents: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temp, contents, { encoding: "utf8", mode: 0o600 });
  await rename(temp, path);
}

function assertRunId(runId: string): void {
  if (!RUN_ID_PATTERN.test(runId) || runId.includes(".."))
    throw new Error(`Invalid run ID '${runId}'.`);
}
