import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { TribunalConfig } from "./types.js";

export const DEFAULT_CONFIG: TribunalConfig = {
  tribunal: {
    storageDir: "./tribunal-runs",
    defaultPanel: "fast-two-model",
    requireBlindFirstPass: true,
    requireDecisionPacket: true,
    stopTheLineEnabled: true,
  },
  kujoAi: {
    defaultRuntime: "kujo-ai-sdk",
    allowDirectProviderFallback: false,
    mockMode: true,
    sdkPath: "../ai-sdk",
    kujoBin: "../kujo/target/debug/kujo",
    provider: "openai",
  },
};

export async function loadConfig(configPath?: string): Promise<TribunalConfig> {
  const candidate = resolve(
    configPath ?? process.env.TRIBUNAL_CONFIG ?? "tribunal.config.json",
  );
  let override: Partial<TribunalConfig> = {};
  try {
    override = JSON.parse(
      await readFile(candidate, "utf8"),
    ) as Partial<TribunalConfig>;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT")
      throw new Error(
        `Invalid Tribunal config '${candidate}': ${(error as Error).message}`,
      );
  }

  const tribunal = { ...DEFAULT_CONFIG.tribunal, ...override.tribunal };
  const kujoAi = { ...DEFAULT_CONFIG.kujoAi, ...override.kujoAi };
  if (
    tribunal.requireBlindFirstPass !== true ||
    tribunal.requireDecisionPacket !== true ||
    tribunal.stopTheLineEnabled !== true
  ) {
    throw new Error(
      "Tribunal safety invariants require blind first pass, decision packets, and stop-the-line behavior.",
    );
  }
  if (kujoAi.allowDirectProviderFallback !== false) {
    throw new Error("Direct provider fallback is prohibited; use Kujo AI SDK.");
  }
  if (!["openai", "openrouter", "deepseek"].includes(kujoAi.provider)) {
    throw new Error(
      `Unsupported Kujo AI SDK provider preset '${kujoAi.provider}'.`,
    );
  }
  return { tribunal, kujoAi } as TribunalConfig;
}
