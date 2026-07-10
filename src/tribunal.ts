import { getPanel, getSeats, SEATS } from "./catalog.js";
import { RunStore } from "./persistence.js";
import {
  createRunId,
  findSecretExposure,
  loadDocket,
  now,
  numberValue,
  safeStructured,
  stringArray,
  stringValue,
} from "./util.js";
import type { KujoModelClient } from "./model/KujoModelClient.js";
import type {
  CrossExamination,
  DecisionPacket,
  Docket,
  KillPass,
  Panel,
  Receipt,
  Ruling,
  Seat,
  Testimony,
  TribunalConfig,
  TribunalEvent,
  TribunalEventType,
  TribunalManifest,
  TribunalRecord,
  TribunalStage,
} from "./types.js";

export interface ReviewResult {
  runId: string;
  runDir: string;
  record: TribunalRecord;
}

export class Tribunal {
  private readonly store: RunStore;

  constructor(
    private readonly config: TribunalConfig,
    private readonly client: KujoModelClient,
  ) {
    this.store = new RunStore(config.tribunal.storageDir);
  }

  async review(
    sourcePath: string,
    panelId = this.config.tribunal.defaultPanel,
  ): Promise<ReviewResult> {
    const runId = createRunId();
    const runDir = await this.store.createRun(runId);
    const startedAt = now();
    const startedMs = Date.now();
    let panel: Panel = {
      id: panelId,
      name: panelId,
      description: "Unvalidated panel",
      seatIds: [],
    };
    let seats: Seat[] = [];
    let docket: Docket | undefined;
    const completedStages: TribunalStage[] = [];
    const testimonies: Testimony[] = [];
    const crossExaminations: CrossExamination[] = [];
    let killPass: KillPass | undefined;
    let ruling: Ruling | undefined;
    let decisionPacket: DecisionPacket | undefined;
    let invocations = 0;
    let failures = 0;
    let totalTokens = 0;

    const manifest: TribunalManifest = {
      schemaVersion: "1.0.0",
      runId,
      status: "running",
      openedAt: startedAt,
      panelId,
      seatIds: [],
      docketSource: sourcePath,
      mockMode: this.config.kujoAi.mockMode,
      blindFirstPassRequired: this.config.tribunal.requireBlindFirstPass,
      sdkBoundary: "KujoModelClient",
    };

    const emit = async (
      stageId: TribunalStage,
      eventType: TribunalEventType,
      summary: string,
      metadata: Record<string, unknown> = {},
      seatId?: string,
    ): Promise<void> => {
      const event: TribunalEvent = {
        timestamp: now(),
        runId,
        stageId,
        ...(seatId ? { seatId } : {}),
        eventType,
        summary,
        metadata: redactMetadata(metadata),
      };
      await this.store.appendEvent(runId, event);
    };

    const startStage = async (stage: TribunalStage): Promise<void> => {
      await emit(stage, "stage_started", `Stage started: ${stage}.`);
    };

    try {
      await this.store.writeManifest(runId, manifest);
      await emit("open-docket", "run_opened", "Tribunal run opened.", {
        panelId,
      });
      await startStage("open-docket");
      panel = getPanel(panelId);
      seats = getSeats(panel);
      manifest.seatIds = panel.seatIds;
      await this.store.writeManifest(runId, manifest);
      const loadedDocket = await loadDocket(sourcePath);
      completedStages.push("open-docket");

      await startStage("validate-scope");
      const secretKind = findSecretExposure(loadedDocket.content);
      if (secretKind)
        throw new Error(
          `Unsafe secret exposure detected in docket (${secretKind}).`,
        );
      if (this.config.tribunal.requireBlindFirstPass !== true) {
        throw new Error(
          "Blind first pass must remain enabled for Tribunal reviews.",
        );
      }
      docket = loadedDocket;
      await this.store.writeText(runId, "docket.md", docket.content);
      completedStages.push("validate-scope");
      await emit(
        "validate-scope",
        "docket_validated",
        "Docket scope and safety checks passed.",
        {
          contentSha256: docket.contentSha256,
        },
      );

      await startStage("build-context-pack");
      const context = renderContext(docket, panel, seats);
      await this.store.writeText(runId, "context.md", context);
      completedStages.push("build-context-pack");
      await emit(
        "build-context-pack",
        "context_pack_created",
        "Local context pack created.",
        {
          integration: "PackWrite-ready",
        },
      );

      await startStage("blind-first-pass");
      const blindResults = await Promise.all(
        seats.map(async (seat) => {
          const systemPrompt = seatPrompt(seat, true);
          const input = blindInput(docket!, context);
          await this.store.writeText(
            runId,
            `prompts/blind-${seat.id}.md`,
            promptArtifact(systemPrompt, input),
          );
          invocations += 1;
          await emit(
            "blind-first-pass",
            "model_invocation_requested",
            `Blind testimony requested from ${seat.name}.`,
            { modelPreference: seat.defaultModelPreference },
            seat.id,
          );
          const response = await this.client.invoke({
            runId,
            stageId: "blind-first-pass",
            seatId: seat.id,
            modelPreference: seat.defaultModelPreference,
            systemPrompt,
            input,
            outputSchema: seat.requiredOutputSchema,
          });
          if (response.error) {
            failures += 1;
            await emit(
              "blind-first-pass",
              "model_invocation_failed",
              `Blind testimony failed for ${seat.name}.`,
              {
                code: response.error.code,
                retryable: response.error.retryable,
              },
              seat.id,
            );
            throw new Error(
              `Model invocation failed for ${seat.name}: ${response.error.message}`,
            );
          }
          totalTokens += response.metadata.totalTokens ?? 0;
          await emit(
            "blind-first-pass",
            "model_invocation_completed",
            `Blind testimony completed for ${seat.name}.`,
            { ...response.metadata },
            seat.id,
          );
          return {
            seatId: seat.id,
            stageId: "blind-first-pass",
            capturedAt: now(),
            content: response.content,
            structured: safeStructured(response.structured),
            metadata: response.metadata,
            blind: true,
          } satisfies Testimony;
        }),
      );
      testimonies.push(...blindResults);
      for (const testimony of testimonies) {
        await this.store.writeText(
          runId,
          `testimony/${testimony.seatId}.md`,
          renderTestimony(testimony),
        );
        await emit(
          "blind-first-pass",
          "testimony_captured",
          `Blind testimony captured for ${testimony.seatId}.`,
          { blind: true },
          testimony.seatId,
        );
      }
      completedStages.push("blind-first-pass");

      await startStage("cross-examination");
      const transcript = renderTestimonyTranscript(testimonies);
      for (const seat of seats) {
        const systemPrompt = seatPrompt(seat, false);
        const input = `${context}\n\n# Blind testimony from all seats\n\n${transcript}`;
        await this.store.writeText(
          runId,
          `prompts/cross-${seat.id}.md`,
          promptArtifact(systemPrompt, input),
        );
        invocations += 1;
        await emit(
          "cross-examination",
          "model_invocation_requested",
          `Cross-examination requested from ${seat.name}.`,
          { modelPreference: seat.defaultModelPreference },
          seat.id,
        );
        const response = await this.client.invoke({
          runId,
          stageId: "cross-examination",
          seatId: seat.id,
          modelPreference: seat.defaultModelPreference,
          systemPrompt,
          input,
          outputSchema: seat.requiredOutputSchema,
        });
        if (response.error) {
          failures += 1;
          await emit(
            "cross-examination",
            "model_invocation_failed",
            `Cross-examination failed for ${seat.name}.`,
            { code: response.error.code, retryable: response.error.retryable },
            seat.id,
          );
          throw new Error(
            `Model invocation failed for ${seat.name}: ${response.error.message}`,
          );
        }
        totalTokens += response.metadata.totalTokens ?? 0;
        crossExaminations.push({
          seatId: seat.id,
          capturedAt: now(),
          content: response.content,
          structured: safeStructured(response.structured),
          metadata: response.metadata,
        });
        await emit(
          "cross-examination",
          "model_invocation_completed",
          `Cross-examination completed for ${seat.name}.`,
          { ...response.metadata },
          seat.id,
        );
      }
      await this.store.writeText(
        runId,
        "cross-examination.md",
        renderCrossExamination(crossExaminations),
      );
      completedStages.push("cross-examination");
      await emit(
        "cross-examination",
        "cross_examination_captured",
        "Cross-examination transcript captured.",
      );

      await startStage("executioner-kill-pass");
      const executioner = seats.find((seat) => seat.id === "executioner");
      if (!executioner)
        throw new Error(
          "Invalid panel config: an Executioner is required for the kill pass.",
        );
      const killInput = `${context}\n\n${transcript}\n\n${renderCrossExamination(crossExaminations)}`;
      await this.store.writeText(
        runId,
        "prompts/kill-executioner.md",
        promptArtifact(seatPrompt(executioner, false), killInput),
      );
      invocations += 1;
      await emit(
        "executioner-kill-pass",
        "model_invocation_requested",
        "Executioner kill pass requested.",
        { modelPreference: executioner.defaultModelPreference },
        executioner.id,
      );
      const killResponse = await this.client.invoke({
        runId,
        stageId: "executioner-kill-pass",
        seatId: "executioner",
        modelPreference: executioner.defaultModelPreference,
        systemPrompt: seatPrompt(executioner, false),
        input: killInput,
        outputSchema: killPassSchema,
      });
      if (killResponse.error) {
        failures += 1;
        await emit(
          "executioner-kill-pass",
          "model_invocation_failed",
          "Executioner kill pass failed.",
          {
            code: killResponse.error.code,
            retryable: killResponse.error.retryable,
          },
          "executioner",
        );
        throw new Error(
          `Executioner kill pass failed: ${killResponse.error.message}`,
        );
      }
      totalTokens += killResponse.metadata.totalTokens ?? 0;
      killPass = normalizeKillPass(killResponse);
      await this.store.writeText(
        runId,
        "kill-pass.md",
        renderKillPass(killPass),
      );
      completedStages.push("executioner-kill-pass");
      await emit(
        "executioner-kill-pass",
        "model_invocation_completed",
        "Executioner kill pass completed.",
        { ...killResponse.metadata },
        "executioner",
      );
      await emit(
        "executioner-kill-pass",
        "kill_pass_captured",
        "Executioner kill pass captured.",
        { recommendation: killPass.recommendation },
        "executioner",
      );

      await startStage("judge-ruling");
      const judge = seats.find((seat) => seat.id === "judge");
      if (judge) {
        const rulingInput = `${killInput}\n\n${renderKillPass(killPass)}`;
        await this.store.writeText(
          runId,
          "prompts/ruling-judge.md",
          promptArtifact(seatPrompt(judge, false), rulingInput),
        );
        invocations += 1;
        await emit(
          "judge-ruling",
          "model_invocation_requested",
          "Judge ruling requested.",
          { modelPreference: judge.defaultModelPreference },
          judge.id,
        );
        const response = await this.client.invoke({
          runId,
          stageId: "judge-ruling",
          seatId: judge.id,
          modelPreference: judge.defaultModelPreference,
          systemPrompt: seatPrompt(judge, false),
          input: rulingInput,
          outputSchema: rulingSchema,
        });
        if (response.error) {
          failures += 1;
          await emit(
            "judge-ruling",
            "model_invocation_failed",
            "Judge ruling failed.",
            {
              code: response.error.code,
              retryable: response.error.retryable,
            },
            judge.id,
          );
          throw new Error(`Judge ruling failed: ${response.error.message}`);
        }
        totalTokens += response.metadata.totalTokens ?? 0;
        ruling = normalizeRuling(response);
        await emit(
          "judge-ruling",
          "model_invocation_completed",
          "Judge ruling completed.",
          { ...response.metadata },
          judge.id,
        );
      } else {
        ruling = proceduralRuling(killPass);
      }
      await this.store.writeText(runId, "ruling.md", renderRuling(ruling));
      completedStages.push("judge-ruling");
      await emit(
        "judge-ruling",
        "ruling_generated",
        "Human-readable ruling generated.",
        { disposition: ruling.disposition },
      );

      await startStage("decision-packet");
      if (judge) {
        const packetInput = `${renderRuling(ruling)}\n\nDocket scope: ${docket.scope}`;
        invocations += 1;
        await emit(
          "decision-packet",
          "model_invocation_requested",
          "Decision packet requested.",
          { modelPreference: judge.defaultModelPreference },
          judge.id,
        );
        const response = await this.client.invoke({
          runId,
          stageId: "decision-packet",
          seatId: judge.id,
          modelPreference: judge.defaultModelPreference,
          systemPrompt:
            "Convert the ruling into a concise, agent-executable decision packet. Return only the required JSON object.",
          input: packetInput,
          outputSchema: decisionPacketSchema,
        });
        if (response.error) {
          failures += 1;
          await emit(
            "decision-packet",
            "model_invocation_failed",
            "Decision packet generation failed.",
            {
              code: response.error.code,
              retryable: response.error.retryable,
            },
            judge.id,
          );
          throw new Error(
            `Decision packet generation failed: ${response.error.message}`,
          );
        }
        totalTokens += response.metadata.totalTokens ?? 0;
        decisionPacket = normalizeDecisionPacket(
          response.structured,
          docket,
          ruling,
        );
      } else {
        decisionPacket = proceduralDecisionPacket(docket, ruling);
      }
      await this.store.writeText(
        runId,
        "decision-packet.md",
        renderDecisionPacket(decisionPacket),
      );
      if (
        this.config.tribunal.requireDecisionPacket &&
        !decisionPacket.decision
      ) {
        throw new Error("Required decision packet missing or invalid.");
      }
      completedStages.push("decision-packet");
      await emit(
        "decision-packet",
        "decision_packet_generated",
        "Agent-readable decision packet generated.",
      );

      await startStage("persist-record");
      completedStages.push("persist-record");
      const completedAt = now();
      const artifactPaths = [
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
      ];
      const record: TribunalRecord = {
        schemaVersion: "1.0.0",
        runId,
        status: "completed",
        startedAt,
        completedAt,
        docket,
        panel,
        seats,
        stagesCompleted: completedStages,
        testimonies,
        crossExaminations,
        killPass,
        ruling,
        decisionPacket,
        artifactPaths,
      };
      const recordSha256 = await this.store.writeRecord(runId, record);
      await emit(
        "persist-record",
        "record_persisted",
        "Structured Tribunal record persisted.",
        { recordSha256 },
      );
      const receipt = createReceipt(
        runId,
        "completed",
        startedAt,
        completedAt,
        Date.now() - startedMs,
        panel.id,
        invocations,
        failures,
        totalTokens,
        this.config.kujoAi.mockMode,
        recordSha256,
      );
      await this.store.writeReceipt(runId, receipt);
      await emit("persist-record", "run_completed", "Tribunal run completed.", {
        durationMs: receipt.durationMs,
      });
      manifest.status = "completed";
      manifest.completedAt = completedAt;
      await this.store.writeManifest(runId, manifest);
      return { runId, runDir, record };
    } catch (error) {
      const reason = (error as Error).message;
      const completedAt = now();
      try {
        await emit(
          completedStages.at(-1) ?? "open-docket",
          "stop_the_line_triggered",
          "Tribunal stopped on a fatal condition.",
          {
            reason,
          },
        );
        const partial: TribunalRecord = {
          schemaVersion: "1.0.0",
          runId,
          status: "stopped",
          startedAt,
          completedAt,
          ...(docket ? { docket } : {}),
          panel,
          seats,
          stagesCompleted: completedStages,
          testimonies,
          crossExaminations,
          ...(killPass ? { killPass } : {}),
          ...(ruling ? { ruling } : {}),
          ...(decisionPacket ? { decisionPacket } : {}),
          stopReason: reason,
          artifactPaths: [
            "manifest.json",
            "events.jsonl",
            "record.json",
            "receipt.json",
          ],
        };
        const hash = await this.store.writeRecord(runId, partial);
        await this.store.writeReceipt(
          runId,
          createReceipt(
            runId,
            "stopped",
            startedAt,
            completedAt,
            Date.now() - startedMs,
            panelId,
            invocations,
            failures,
            totalTokens,
            this.config.kujoAi.mockMode,
            hash,
          ),
        );
        manifest.status = "stopped";
        manifest.completedAt = completedAt;
        await this.store.writeManifest(runId, manifest);
      } catch {
        // The original fatal condition remains authoritative when persistence itself failed.
      }
      throw new TribunalStoppedError(runId, runDir, reason);
    }
  }
}

export class TribunalStoppedError extends Error {
  constructor(
    readonly runId: string,
    readonly runDir: string,
    message: string,
  ) {
    super(message);
    this.name = "TribunalStoppedError";
  }
}

function createReceipt(
  runId: string,
  status: "completed" | "stopped",
  startedAt: string,
  completedAt: string,
  durationMs: number,
  panelId: string,
  modelInvocations: number,
  failedInvocations: number,
  totalTokens: number,
  mock: boolean,
  recordSha256: string,
): Receipt {
  return {
    schemaVersion: "1.0.0",
    runId,
    status,
    startedAt,
    completedAt,
    durationMs,
    panelId,
    modelInvocations,
    failedInvocations,
    ...(totalTokens > 0 ? { totalTokens } : {}),
    recordSha256,
    integration: {
      runLedger: "compatible-receipt",
      modelRuntime: mock ? "mock-kujo" : "kujo-ai-sdk",
    },
  };
}

function seatPrompt(seat: Seat, blind: boolean): string {
  return [
    `You occupy the Tribunal ${seat.name} seat.`,
    `Authority: ${seat.authority}`,
    `Non-goals: ${seat.nonGoals.join("; ")}`,
    `Escalate when: ${seat.escalationTriggers.join("; ")}`,
    blind
      ? "This is a blind first pass. You have not been given any other seat's testimony. Evaluate independently."
      : "This is a later adversarial stage. Identify agreements, contradictions, missing evidence, and changed conclusions.",
    "Return only a JSON object matching the supplied schema. Never include secrets.",
  ].join("\n");
}

function blindInput(docket: Docket, context: string): string {
  return `${context}\n\n# Docket under review\n\n${docket.content}`;
}

function promptArtifact(systemPrompt: string, input: string): string {
  return `# System prompt\n\n${systemPrompt}\n\n# Input\n\n${input}`;
}

function renderContext(docket: Docket, panel: Panel, seats: Seat[]): string {
  return `# Tribunal Context Pack\n\n- Docket: ${docket.title}\n- Source: ${docket.sourcePath}\n- Content SHA-256: ${docket.contentSha256}\n- Panel: ${panel.name} (${panel.id})\n- Seats: ${seats.map((seat) => seat.name).join(", ")}\n- Scope: ${docket.scope}\n\n## Context policy\n\nThis local context is immutable for the blind first pass. Other seats' testimony is deliberately excluded until cross-examination.`;
}

function renderTestimony(testimony: Testimony): string {
  return `# Blind Testimony · ${testimony.seatId}\n\n- Captured: ${testimony.capturedAt}\n- Blind: yes\n- Model: ${testimony.metadata.model ?? "unknown"}\n\n${testimony.content}`;
}

function renderTestimonyTranscript(testimonies: Testimony[]): string {
  return testimonies.map(renderTestimony).join("\n\n---\n\n");
}

function renderCrossExamination(items: CrossExamination[]): string {
  return `# Cross-Examination\n\n${items
    .map(
      (item) =>
        `## ${item.seatId}\n\n- Captured: ${item.capturedAt}\n\n${item.content}`,
    )
    .join("\n\n")}`;
}

function normalizeKillPass(
  response: Awaited<ReturnType<KujoModelClient["invoke"]>>,
): KillPass {
  const data = safeStructured(response.structured);
  const recommendation = data.recommendation;
  return {
    seatId: "executioner",
    capturedAt: now(),
    fatalFlaws: stringArray(data.fatalFlaws),
    survivableRisks: stringArray(data.survivableRisks),
    requiredChanges: stringArray(data.requiredChanges),
    recommendation:
      recommendation === "kill" || recommendation === "redesign"
        ? recommendation
        : "survive",
    content: response.content,
    metadata: response.metadata,
  };
}

function renderKillPass(kill: KillPass): string {
  return `# Executioner Kill Pass\n\n## Recommendation\n\n${kill.recommendation}\n\n## Fatal flaws\n\n${list(kill.fatalFlaws)}\n\n## Survivable risks\n\n${list(kill.survivableRisks)}\n\n## Required changes\n\n${list(kill.requiredChanges)}`;
}

function normalizeRuling(
  response: Awaited<ReturnType<KujoModelClient["invoke"]>>,
): Ruling {
  const data = safeStructured(response.structured);
  const rawDisposition = data.disposition;
  const disposition =
    rawDisposition === "pause" ||
    rawDisposition === "redesign" ||
    rawDisposition === "reject"
      ? rawDisposition
      : "proceed";
  return {
    finalVerdict: stringValue(
      data.finalVerdict,
      "The evidence supports only a conditional decision.",
    ),
    bestArgumentFor: stringValue(
      data.bestArgumentFor,
      "The proposal may create value if its assumptions hold.",
    ),
    bestArgumentAgainst: stringValue(
      data.bestArgumentAgainst,
      "The proposal's assumptions remain insufficiently evidenced.",
    ),
    panelAgreement: stringArray(data.panelAgreement, [
      "Execution must remain bounded and testable.",
    ]),
    unresolved: stringArray(data.unresolved, [
      "Outcome evidence remains incomplete.",
    ]),
    requiredChanges: stringArray(data.requiredChanges, [
      "Produce acceptance and rollback evidence.",
    ]),
    confidence: Math.max(1, Math.min(10, numberValue(data.confidence, 5))),
    disposition,
    generatedAt: now(),
    metadata: response.metadata,
  };
}

function proceduralRuling(kill: KillPass): Ruling {
  const disposition =
    kill.recommendation === "kill"
      ? "reject"
      : kill.recommendation === "redesign"
        ? "redesign"
        : "proceed";
  return {
    finalVerdict: `Executioner-only review recommends: ${disposition}.`,
    bestArgumentFor: "The proposal survived the focused fatal-flaw pass.",
    bestArgumentAgainst:
      kill.fatalFlaws[0] ??
      kill.survivableRisks[0] ??
      "A broader panel has not reviewed the proposal.",
    panelAgreement: ["This ruling is limited to an Executioner-only review."],
    unresolved: [
      "Builder, Operator, Market Lens, and Judge testimony was outside this panel.",
    ],
    requiredChanges: kill.requiredChanges,
    confidence: 5,
    disposition,
    generatedAt: now(),
    metadata: { provider: "tribunal-procedural", model: "executioner-derived" },
  };
}

function renderRuling(ruling: Ruling): string {
  return `# Tribunal Ruling\n\n## Final verdict\n\n${ruling.finalVerdict}\n\n## Best argument for the proposal\n\n${ruling.bestArgumentFor}\n\n## Best argument against the proposal\n\n${ruling.bestArgumentAgainst}\n\n## What the panel agrees on\n\n${list(ruling.panelAgreement)}\n\n## What remains unresolved\n\n${list(ruling.unresolved)}\n\n## Required changes before execution\n\n${list(ruling.requiredChanges)}\n\n## Decision confidence\n\n${ruling.confidence}/10\n\n## Disposition\n\n${ruling.disposition}`;
}

function normalizeDecisionPacket(
  value: unknown,
  docket: Docket,
  ruling: Ruling,
): DecisionPacket {
  const data = safeStructured(value);
  return {
    decision: stringValue(data.decision, ruling.finalVerdict),
    scope: stringValue(data.scope, docket.scope),
    nonGoals: stringArray(data.nonGoals, docket.nonGoals),
    requiredNextActions: stringArray(
      data.requiredNextActions,
      ruling.requiredChanges,
    ),
    suggestedOwnerRole: stringValue(data.suggestedOwnerRole, "technical owner"),
    suggestedModelLevel: stringValue(
      data.suggestedModelLevel,
      "frontier reasoning for consequential review",
    ),
    acceptanceCriteria: stringArray(data.acceptanceCriteria, [
      "Required changes are completed and verified.",
    ]),
    escalationTriggers: stringArray(
      data.escalationTriggers,
      SEATS.judge?.escalationTriggers ?? [],
    ),
    evidenceRequired: stringArray(data.evidenceRequired, [
      "Test output",
      "Reviewable implementation evidence",
    ]),
    stopTheLineConditions: stringArray(data.stopTheLineConditions, [
      "Secret exposure",
      "Unbounded destructive action",
    ]),
    generatedAt: now(),
  };
}

function proceduralDecisionPacket(
  docket: Docket,
  ruling: Ruling,
): DecisionPacket {
  return normalizeDecisionPacket({}, docket, ruling);
}

function renderDecisionPacket(packet: DecisionPacket): string {
  return `# Tribunal Decision Packet\n\n## Decision\n\n${packet.decision}\n\n## Scope\n\n${packet.scope}\n\n## Non-goals\n\n${list(packet.nonGoals)}\n\n## Required next actions\n\n${list(packet.requiredNextActions)}\n\n## Suggested owner role\n\n${packet.suggestedOwnerRole}\n\n## Suggested model level\n\n${packet.suggestedModelLevel}\n\n## Acceptance criteria\n\n${list(packet.acceptanceCriteria)}\n\n## Escalation triggers\n\n${list(packet.escalationTriggers)}\n\n## Evidence required before marking complete\n\n${list(packet.evidenceRequired)}\n\n## Stop-the-line conditions\n\n${list(packet.stopTheLineConditions)}`;
}

function list(items: string[]): string {
  return items.length
    ? items.map((item) => `- ${item}`).join("\n")
    : "- None identified.";
}

function redactMetadata(
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(
        ([key]) =>
          !/(api.?key|authorization|secret|token(?!s$)|credential)/i.test(key),
      )
      .map(([key, value]) => [
        key,
        typeof value === "string"
          ? value.replace(/sk-[A-Za-z0-9_-]{8,}/g, "[REDACTED]")
          : value,
      ]),
  );
}

const killPassSchema = {
  type: "object",
  required: [
    "fatalFlaws",
    "survivableRisks",
    "requiredChanges",
    "recommendation",
  ],
  properties: {
    fatalFlaws: { type: "array", items: { type: "string" } },
    survivableRisks: { type: "array", items: { type: "string" } },
    requiredChanges: { type: "array", items: { type: "string" } },
    recommendation: { enum: ["survive", "redesign", "kill"] },
  },
};

const rulingSchema = {
  type: "object",
  required: [
    "finalVerdict",
    "bestArgumentFor",
    "bestArgumentAgainst",
    "panelAgreement",
    "unresolved",
    "requiredChanges",
    "confidence",
    "disposition",
  ],
};

const decisionPacketSchema = {
  type: "object",
  required: [
    "decision",
    "scope",
    "nonGoals",
    "requiredNextActions",
    "suggestedOwnerRole",
    "suggestedModelLevel",
    "acceptanceCriteria",
    "escalationTriggers",
    "evidenceRequired",
    "stopTheLineConditions",
  ],
};
