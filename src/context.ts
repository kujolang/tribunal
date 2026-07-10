import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, parse, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Docket } from "./types.js";

export interface ContextPackResult {
  content: string;
  provider: "local" | "packwrite";
  warnings: string[];
}

export interface ContextPackBuilder {
  enrich(baseContext: string, docket: Docket): Promise<ContextPackResult>;
}

export class LocalContextPackBuilder implements ContextPackBuilder {
  enrich(baseContext: string): Promise<ContextPackResult> {
    return Promise.resolve({
      content: baseContext,
      provider: "local",
      warnings: [],
    });
  }
}

export class PackWriteContextPackBuilder implements ContextPackBuilder {
  constructor(
    private readonly packwritePath: string,
    private readonly kujoBin: string,
  ) {}

  async enrich(
    baseContext: string,
    docket: Docket,
  ): Promise<ContextPackResult> {
    const workspace = await mkdtemp(resolve(tmpdir(), "tribunal-packwrite-"));
    try {
      await mkdir(resolve(workspace, "src"), { recursive: true });
      await copyFile(
        resolve(this.packwritePath, "src/repo_context.kujo"),
        resolve(workspace, "src/repo_context.kujo"),
      );
      await copyFile(
        resolve(this.packwritePath, "src/util.kujo"),
        resolve(workspace, "src/util.kujo"),
      );
      const here = dirname(fileURLToPath(import.meta.url));
      await copyFile(
        resolve(here, "../../integrations/packwrite-context-bridge.kujo"),
        resolve(workspace, "bridge.kujo"),
      );
      const raw = await runBridge(
        resolve(this.kujoBin),
        workspace,
        findRepositoryRoot(dirname(docket.sourcePath)),
      );
      const parsed = JSON.parse(raw) as {
        ok?: boolean;
        markdown?: string;
        warnings?: unknown[];
        error?: string;
      };
      if (!parsed.ok || typeof parsed.markdown !== "string") {
        throw new Error(
          parsed.error ??
            "PackWrite context bridge returned an invalid response.",
        );
      }
      return {
        content: `${baseContext}\n\n${parsed.markdown}`,
        provider: "packwrite",
        warnings: Array.isArray(parsed.warnings)
          ? parsed.warnings.filter(
              (value): value is string => typeof value === "string",
            )
          : [],
      };
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  }
}

function findRepositoryRoot(start: string): string {
  let current = resolve(start);
  const filesystemRoot = parse(current).root;
  while (true) {
    if (
      existsSync(resolve(current, ".git")) ||
      existsSync(resolve(current, "package.json")) ||
      existsSync(resolve(current, "kujo.toml"))
    ) {
      return current;
    }
    if (current === filesystemRoot) return resolve(start);
    current = dirname(current);
  }
}

async function runBridge(
  bin: string,
  cwd: string,
  repositoryRoot: string,
): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(bin, ["run", "bridge.kujo", "--interpreter"], {
      cwd,
      env: { ...process.env, TRIBUNAL_CONTEXT_ROOT: repositoryRoot },
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
      if (code !== 0)
        return reject(
          new Error(
            `PackWrite context bridge exited ${code}: ${stderr.trim()}`,
          ),
        );
      const json = stdout
        .trim()
        .split("\n")
        .reverse()
        .find((line) => line.startsWith("{"));
      if (!json)
        return reject(new Error("PackWrite context bridge returned no JSON."));
      resolvePromise(json);
    });
  });
}
