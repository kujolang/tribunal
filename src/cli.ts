#!/usr/bin/env node
import { resolve } from "node:path";
import { PANELS, SEATS } from "./catalog.js";
import { loadConfig } from "./config.js";
import {
  LocalContextPackBuilder,
  PackWriteContextPackBuilder,
  type ContextPackBuilder,
} from "./context.js";
import { ArtifactIntegrity } from "./integrity.js";
import { SignedRunIngestion } from "./integrations.js";
import { KujoAiSdkBridge } from "./model/KujoAiSdkBridge.js";
import type { KujoModelClient } from "./model/KujoModelClient.js";
import { MockKujoModelClient } from "./model/MockKujoModelClient.js";
import { RunStore } from "./persistence.js";
import { Tribunal, TribunalStoppedError } from "./tribunal.js";
import type { TribunalConfig } from "./types.js";

interface ParsedArgs {
  command?: string;
  positionals: string[];
  flags: Map<string, string | true>;
}

async function main(argv: string[]): Promise<number> {
  const parsed = parseArgs(argv);
  if (
    !parsed.command ||
    parsed.command === "help" ||
    parsed.flags.has("help")
  ) {
    process.stdout.write(help());
    return 0;
  }

  const configPath = flagString(parsed, "config");
  const config = await loadConfig(configPath);
  applyCliOverrides(config, parsed);
  const store = new RunStore(config.tribunal.storageDir);

  switch (parsed.command) {
    case "review":
    case "kill": {
      const file = parsed.positionals[0];
      if (!file)
        throw new Error(
          `Usage: tribunal ${parsed.command} <file>${parsed.command === "review" ? " --panel <panel-name>" : ""}`,
        );
      const panel =
        parsed.command === "kill"
          ? "executioner-only"
          : (flagString(parsed, "panel") ?? config.tribunal.defaultPanel);
      const tribunal = new Tribunal(
        config,
        createClient(config),
        createContextBuilder(config),
      );
      try {
        const result = await tribunal.review(file, panel);
        const signingKey = flagString(parsed, "private-key");
        if (signingKey) {
          await new ArtifactIntegrity(store).seal(result.runId, signingKey);
        }
        process.stdout.write(
          `${result.runId}\n${result.record.ruling?.disposition ?? "unknown"}: ${result.record.ruling?.finalVerdict ?? "No ruling"}\n${result.runDir}\n`,
        );
        return 0;
      } catch (error) {
        if (error instanceof TribunalStoppedError) {
          const signingKey = flagString(parsed, "private-key");
          if (signingKey) {
            await new ArtifactIntegrity(store).seal(error.runId, signingKey);
          }
          process.stderr.write(
            `Tribunal stopped: ${error.message}\nRun: ${error.runId}\nRecord: ${error.runDir}\n`,
          );
          return 2;
        }
        throw error;
      }
    }
    case "list": {
      const runs = await store.list();
      if (!runs.length) {
        process.stdout.write("No Tribunal runs found.\n");
        return 0;
      }
      process.stdout.write(
        runs
          .map(
            (run) =>
              `${run.runId}\t${run.status}\t${run.panelId}\t${run.openedAt}`,
          )
          .join("\n") + "\n",
      );
      return 0;
    }
    case "show": {
      const runId = requiredRunId(parsed);
      const record = await store.readRecord(runId);
      process.stdout.write(renderSummary(record));
      return 0;
    }
    case "replay": {
      const runId = requiredRunId(parsed);
      const verification = await new ArtifactIntegrity(store).verify(
        runId,
        flagString(parsed, "public-key"),
      );
      if (!verification.ok) {
        throw new Error(
          `Replay verification failed: ${JSON.stringify(verification)}`,
        );
      }
      const events = await store.readEvents(runId);
      process.stdout.write(
        `integrity\t${verification.artifactsChecked} artifacts\t${verification.signature}\n` +
          events
            .map(
              (event) =>
                `${event.timestamp}\t${event.stageId}\t${event.seatId ?? "-"}\t${event.eventType}\t${event.summary}`,
            )
            .join("\n") +
          "\n",
      );
      return 0;
    }
    case "seal": {
      const runId = requiredRunId(parsed);
      const privateKey = flagString(parsed, "private-key");
      if (!privateKey) {
        throw new Error("Command 'seal' requires --private-key <Ed25519 PEM>.");
      }
      const sealed = await new ArtifactIntegrity(store).seal(runId, privateKey);
      process.stdout.write(
        JSON.stringify(
          {
            runId,
            artifacts: sealed.manifest.artifacts.length,
            keyId: sealed.signature?.keyId,
            manifestSha256: sealed.signature?.manifestSha256,
          },
          null,
          2,
        ) + "\n",
      );
      return 0;
    }
    case "verify": {
      const runId = requiredRunId(parsed);
      const verification = await new ArtifactIntegrity(store).verify(
        runId,
        flagString(parsed, "public-key"),
      );
      process.stdout.write(JSON.stringify(verification, null, 2) + "\n");
      return verification.ok ? 0 : 3;
    }
    case "ingest": {
      const runId = requiredRunId(parsed);
      const target = flagString(parsed, "target");
      const publicKeyPath = flagString(parsed, "public-key");
      if (!publicKeyPath) {
        throw new Error(
          "Signed ingestion requires --public-key <Ed25519 PEM>.",
        );
      }
      const ingestion = new SignedRunIngestion(store);
      if (target === "runledger") {
        const receipt = await ingestion.intoRunLedger(runId, {
          publicKeyPath,
          runledgerBin:
            flagString(parsed, "runledger-bin") ?? "../runledger/bin/runledger",
          kujoBin: flagString(parsed, "kujo-bin") ?? config.kujoAi.kujoBin,
          ledgerDir: flagString(parsed, "ledger") ?? "./.runledger",
        });
        process.stdout.write(JSON.stringify(receipt, null, 2) + "\n");
        return 0;
      }
      if (target === "casefile") {
        const receipt = await ingestion.intoCaseFile(runId, {
          publicKeyPath,
          casefilePath:
            flagString(parsed, "casefile-path") ?? "../casefile/casefile.kujo",
          kujoBin: flagString(parsed, "kujo-bin") ?? config.kujoAi.kujoBin,
          outputDir: flagString(parsed, "casefile-output") ?? "./.casefile",
        });
        process.stdout.write(JSON.stringify(receipt, null, 2) + "\n");
        return 0;
      }
      throw new Error("Ingestion target must be 'runledger' or 'casefile'.");
    }
    case "export": {
      const runId = requiredRunId(parsed);
      const format = flagString(parsed, "format") ?? "json";
      if (format === "json")
        process.stdout.write(
          JSON.stringify(await store.readRecord(runId), null, 2) + "\n",
        );
      else if (format === "jsonl") {
        process.stdout.write(
          (await store.readEvents(runId))
            .map((event) => JSON.stringify(event))
            .join("\n") + "\n",
        );
      } else throw new Error("Export format must be 'json' or 'jsonl'.");
      return 0;
    }
    case "panels":
      process.stdout.write(
        Object.values(PANELS)
          .map(
            (panel) =>
              `${panel.id}\t${panel.seatIds.join(",")}\t${panel.description}`,
          )
          .join("\n") + "\n",
      );
      return 0;
    case "seats":
      process.stdout.write(
        Object.values(SEATS)
          .map((seat) => `${seat.id}\t${seat.name}\t${seat.authority}`)
          .join("\n") + "\n",
      );
      return 0;
    default:
      throw new Error(
        `Unknown command '${parsed.command}'. Run 'tribunal help'.`,
      );
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command, ...rest] = argv;
  const flags = new Map<string, string | true>();
  const positionals: string[] = [];
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index]!;
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }
    const [name, inline] = token.slice(2).split("=", 2);
    if (!name) throw new Error(`Invalid flag '${token}'.`);
    if (inline !== undefined) flags.set(name, inline);
    else if (rest[index + 1] && !rest[index + 1]!.startsWith("--"))
      flags.set(name, rest[++index]!);
    else flags.set(name, true);
  }
  return { ...(command ? { command } : {}), positionals, flags };
}

function flagString(args: ParsedArgs, name: string): string | undefined {
  const value = args.flags.get(name);
  return typeof value === "string" ? value : undefined;
}

function requiredRunId(args: ParsedArgs): string {
  const runId = args.positionals[0];
  if (!runId) throw new Error(`Command '${args.command}' requires a run ID.`);
  return runId;
}

function applyCliOverrides(config: TribunalConfig, args: ParsedArgs): void {
  const storage = flagString(args, "storage-dir");
  if (storage) config.tribunal.storageDir = resolve(storage);
  if (args.flags.has("live")) config.kujoAi.mockMode = false;
  if (args.flags.has("mock")) config.kujoAi.mockMode = true;
  const sdkPath = flagString(args, "ai-sdk-path");
  if (sdkPath) config.kujoAi.sdkPath = resolve(sdkPath);
  const kujoBin = flagString(args, "kujo-bin");
  if (kujoBin) config.kujoAi.kujoBin = resolve(kujoBin);
  const contextProvider = flagString(args, "context-provider");
  if (contextProvider === "local" || contextProvider === "packwrite") {
    config.context.provider = contextProvider;
  } else if (contextProvider) {
    throw new Error("Context provider must be 'local' or 'packwrite'.");
  }
  const packwritePath = flagString(args, "packwrite-path");
  if (packwritePath) config.context.packwritePath = resolve(packwritePath);
  if (kujoBin) config.context.kujoBin = resolve(kujoBin);
}

function createClient(config: TribunalConfig): KujoModelClient {
  if (config.kujoAi.mockMode) return new MockKujoModelClient();
  return new KujoAiSdkBridge({
    sdkPath: resolve(config.kujoAi.sdkPath),
    kujoBin: resolve(config.kujoAi.kujoBin),
    provider: config.kujoAi.provider,
  });
}

function createContextBuilder(config: TribunalConfig): ContextPackBuilder {
  if (config.context.provider === "packwrite") {
    return new PackWriteContextPackBuilder(
      resolve(config.context.packwritePath),
      resolve(config.context.kujoBin),
    );
  }
  return new LocalContextPackBuilder();
}

function renderSummary(
  record: Awaited<ReturnType<RunStore["readRecord"]>>,
): string {
  return [
    `Run: ${record.runId}`,
    `Status: ${record.status}`,
    `Panel: ${record.panel.id}`,
    `Docket: ${record.docket?.title ?? "unavailable"}`,
    `Disposition: ${record.ruling?.disposition ?? "unavailable"}`,
    `Verdict: ${record.ruling?.finalVerdict ?? record.stopReason ?? "unavailable"}`,
    `Stages: ${record.stagesCompleted.join(" -> ")}`,
    `Decision packet: ${record.decisionPacket ? "available" : "unavailable"}`,
    "",
  ].join("\n");
}

function help(): string {
  return `Tribunal — structured adversarial decision review\n\nUsage:\n  tribunal review <file> --panel <panel-name> [--mock|--live] [--private-key <pem>]\n  tribunal kill <file> [--mock|--live] [--private-key <pem>]\n  tribunal list\n  tribunal show <run-id>\n  tribunal replay <run-id> [--public-key <pem>]\n  tribunal seal <run-id> --private-key <Ed25519 PEM>\n  tribunal verify <run-id> [--public-key <Ed25519 PEM>]\n  tribunal ingest <run-id> --target runledger|casefile --public-key <Ed25519 PEM>\n  tribunal export <run-id> --format json|jsonl\n  tribunal panels\n  tribunal seats\n\nGlobal options:\n  --config <path>              JSON configuration file\n  --storage-dir <path>         Override the run storage directory\n  --ai-sdk-path <path>         Kujo AI SDK checkout (live mode)\n  --kujo-bin <path>            Kujo runtime binary (live/integration mode)\n  --context-provider <name>    local or packwrite\n  --packwrite-path <path>      PackWrite checkout (packwrite context mode)\n\nMock mode is the safe, credential-free default. Live mode invokes models only through Kujo AI SDK. Signed ingestion requires a trusted Ed25519 public key and a verified artifact manifest.\n`;
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    process.stderr.write(`tribunal: ${(error as Error).message}\n`);
    process.exitCode = 1;
  });
