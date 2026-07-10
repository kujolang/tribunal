import { mkdtemp, mkdir, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import type { KujoModelClient } from "./KujoModelClient.js";
import type { KujoModelRequest, KujoModelResponse } from "../types.js";

interface SdkResult {
  ok?: boolean;
  provider?: string;
  model?: string;
  request_id?: string;
  contract_version?: string;
  output_text?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  error?: { code?: string; message?: string; retryable?: boolean };
}

export interface KujoAiSdkBridgeOptions {
  sdkPath: string;
  kujoBin: string;
  provider: "openai" | "openrouter" | "deepseek";
  offlineFixture?: boolean;
}

/**
 * Executes the real Kujo AI SDK in an isolated temporary Kujo workspace.
 * No provider SDK is imported by Tribunal and no credential is accepted in the request.
 */
export class KujoAiSdkBridge implements KujoModelClient {
  constructor(private readonly options: KujoAiSdkBridgeOptions) {}

  async invoke(request: KujoModelRequest): Promise<KujoModelResponse> {
    const started = Date.now();
    const workspace = await mkdtemp(resolve(tmpdir(), "tribunal-kujo-ai-"));
    try {
      await mkdir(resolve(workspace, "src"), { recursive: true });
      await copyFile(
        resolve(this.options.sdkPath, "src/ai_sdk.kujo"),
        resolve(workspace, "src/ai_sdk.kujo"),
      );
      await copyFile(
        resolve(this.options.sdkPath, "src/providers.kujo"),
        resolve(workspace, "src/providers.kujo"),
      );
      const here = dirname(fileURLToPath(import.meta.url));
      await copyFile(
        resolve(here, "../../../integrations/kujo-ai-sdk-bridge.kujo"),
        resolve(workspace, "bridge.kujo"),
      );

      const payload = JSON.stringify({
        provider: this.options.provider,
        model:
          request.modelPreference.preferred[0] ??
          request.modelPreference.fallback,
        systemPrompt: request.systemPrompt,
        input: request.input,
        outputSchema: request.outputSchema ?? null,
        timeoutMs: request.timeoutMs ?? 45_000,
        offlineFixture: this.options.offlineFixture ?? false,
      });
      const raw = await runKujo(
        this.options.kujoBin,
        workspace,
        payload,
        request.timeoutMs ?? 60_000,
      );
      const sdk = JSON.parse(raw) as SdkResult;
      const usage = sdk.usage ?? {};
      const content = sdk.output_text ?? "";
      let structured: unknown;
      try {
        structured = content ? JSON.parse(content) : undefined;
      } catch {
        structured = undefined;
      }
      return {
        content,
        ...(structured === undefined ? {} : { structured }),
        metadata: {
          ...(sdk.provider ? { provider: sdk.provider } : {}),
          ...(sdk.model ? { model: sdk.model } : {}),
          ...(sdk.request_id ? { requestId: sdk.request_id } : {}),
          ...(sdk.contract_version
            ? { contractVersion: sdk.contract_version }
            : {}),
          latencyMs: Date.now() - started,
          ...(usage.input_tokens === undefined
            ? {}
            : { inputTokens: usage.input_tokens }),
          ...(usage.output_tokens === undefined
            ? {}
            : { outputTokens: usage.output_tokens }),
          ...(usage.total_tokens === undefined
            ? {}
            : { totalTokens: usage.total_tokens }),
        },
        ...(!sdk.ok
          ? {
              error: {
                code: sdk.error?.code ?? "kujo_ai_sdk_error",
                message: redact(
                  sdk.error?.message ?? "Kujo AI SDK invocation failed.",
                ),
                retryable: sdk.error?.retryable ?? false,
              },
            }
          : {}),
      };
    } catch (error) {
      return {
        content: "",
        metadata: { latencyMs: Date.now() - started },
        error: {
          code: "kujo_ai_sdk_bridge_error",
          message: redact((error as Error).message),
          retryable: false,
        },
      };
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  }
}

async function runKujo(
  bin: string,
  cwd: string,
  payload: string,
  timeoutMs: number,
): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(resolve(bin), ["run", "bridge.kujo", "--interpreter"], {
      cwd,
      env: { ...process.env, KUJO_TRIBUNAL_PAYLOAD: payload },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
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
      clearTimeout(timer);
      if (code !== 0 && !stdout.trim())
        return reject(
          new Error(`Kujo bridge exited ${code}: ${redact(stderr)}`),
        );
      const line = stdout
        .trim()
        .split("\n")
        .reverse()
        .find((candidate) => candidate.trim().startsWith("{"));
      if (!line)
        return reject(new Error("Kujo bridge returned no JSON response."));
      resolvePromise(line);
    });
  });
}

function redact(value: string): string {
  return value
    .replace(/(sk-[A-Za-z0-9_-]{8})[A-Za-z0-9_-]+/g, "$1…REDACTED")
    .replace(
      /(api[_-]?key|authorization|token)([\s:="']+)[^\s,}"']+/gi,
      "$1$2[REDACTED]",
    );
}
