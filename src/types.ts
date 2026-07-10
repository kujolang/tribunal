export type TribunalStage =
  | "open-docket"
  | "validate-scope"
  | "build-context-pack"
  | "blind-first-pass"
  | "cross-examination"
  | "executioner-kill-pass"
  | "judge-ruling"
  | "decision-packet"
  | "persist-record";

export const TRIBUNAL_STAGES: readonly TribunalStage[] = [
  "open-docket",
  "validate-scope",
  "build-context-pack",
  "blind-first-pass",
  "cross-examination",
  "executioner-kill-pass",
  "judge-ruling",
  "decision-packet",
  "persist-record",
] as const;

export interface ModelPreference {
  class: string;
  preferred: string[];
  fallback: string;
}

export interface Docket {
  id: string;
  title: string;
  sourcePath: string;
  content: string;
  scope: string;
  nonGoals: string[];
  openedAt: string;
  contentSha256: string;
}

export interface SeatOutputSchema {
  type: "object";
  required: string[];
  properties: Record<string, unknown>;
}

export interface Seat {
  id: string;
  name: string;
  authority: string;
  nonGoals: string[];
  stageResponsibilities: TribunalStage[];
  requiredOutputSchema: SeatOutputSchema;
  defaultModelPreference: ModelPreference;
  escalationTriggers: string[];
}

export interface Panel {
  id: string;
  name: string;
  description: string;
  seatIds: string[];
}

export type TribunalEventType =
  | "run_opened"
  | "docket_validated"
  | "context_pack_created"
  | "stage_started"
  | "model_invocation_requested"
  | "model_invocation_completed"
  | "model_invocation_failed"
  | "testimony_captured"
  | "cross_examination_captured"
  | "kill_pass_captured"
  | "ruling_generated"
  | "decision_packet_generated"
  | "record_persisted"
  | "run_completed"
  | "stop_the_line_triggered";

export interface TribunalEvent {
  timestamp: string;
  runId: string;
  stageId: TribunalStage;
  seatId?: string;
  eventType: TribunalEventType;
  summary: string;
  metadata: Record<string, unknown>;
}

export interface KujoModelMetadata {
  provider?: string;
  model?: string;
  requestId?: string;
  contractVersion?: string;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  reasoningTokens?: number;
}

export interface KujoModelError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface KujoModelRequest {
  runId: string;
  stageId: TribunalStage;
  seatId: string;
  modelPreference: ModelPreference;
  systemPrompt: string;
  input: string;
  outputSchema?: unknown;
  timeoutMs?: number;
}

export interface KujoModelResponse {
  content: string;
  structured?: unknown;
  metadata: KujoModelMetadata;
  error?: KujoModelError;
}

export interface Testimony {
  seatId: string;
  stageId: "blind-first-pass";
  capturedAt: string;
  content: string;
  structured: Record<string, unknown>;
  metadata: KujoModelMetadata;
  blind: true;
}

export interface CrossExamination {
  seatId: string;
  capturedAt: string;
  content: string;
  structured: Record<string, unknown>;
  metadata: KujoModelMetadata;
}

export interface KillPass {
  seatId: "executioner";
  capturedAt: string;
  fatalFlaws: string[];
  survivableRisks: string[];
  requiredChanges: string[];
  recommendation: "survive" | "redesign" | "kill";
  content: string;
  metadata: KujoModelMetadata;
}

export type RulingDisposition = "proceed" | "pause" | "redesign" | "reject";

export interface Ruling {
  finalVerdict: string;
  bestArgumentFor: string;
  bestArgumentAgainst: string;
  panelAgreement: string[];
  unresolved: string[];
  requiredChanges: string[];
  confidence: number;
  disposition: RulingDisposition;
  generatedAt: string;
  metadata: KujoModelMetadata;
}

export interface DecisionPacket {
  decision: string;
  scope: string;
  nonGoals: string[];
  requiredNextActions: string[];
  suggestedOwnerRole: string;
  suggestedModelLevel: string;
  acceptanceCriteria: string[];
  escalationTriggers: string[];
  evidenceRequired: string[];
  stopTheLineConditions: string[];
  generatedAt: string;
}

export interface TribunalManifest {
  schemaVersion: "1.0.0";
  runId: string;
  status: "running" | "completed" | "stopped";
  openedAt: string;
  completedAt?: string;
  panelId: string;
  seatIds: string[];
  docketSource: string;
  mockMode: boolean;
  blindFirstPassRequired: boolean;
  sdkBoundary: "KujoModelClient";
}

export interface TribunalRecord {
  schemaVersion: "1.0.0";
  runId: string;
  status: "completed" | "stopped";
  startedAt: string;
  completedAt: string;
  docket?: Docket;
  panel: Panel;
  seats: Seat[];
  stagesCompleted: TribunalStage[];
  testimonies: Testimony[];
  crossExaminations: CrossExamination[];
  killPass?: KillPass;
  ruling?: Ruling;
  decisionPacket?: DecisionPacket;
  stopReason?: string;
  artifactPaths: string[];
}

export interface Receipt {
  schemaVersion: "1.0.0";
  runId: string;
  status: "completed" | "stopped";
  startedAt: string;
  completedAt: string;
  durationMs: number;
  panelId: string;
  modelInvocations: number;
  failedInvocations: number;
  totalTokens?: number;
  recordSha256?: string;
  integration: {
    runLedger: "compatible-receipt";
    modelRuntime: "mock-kujo" | "kujo-ai-sdk";
  };
}

export interface TribunalConfig {
  tribunal: {
    storageDir: string;
    defaultPanel: string;
    requireBlindFirstPass: boolean;
    requireDecisionPacket: boolean;
    stopTheLineEnabled: boolean;
  };
  kujoAi: {
    defaultRuntime: "kujo-ai-sdk";
    allowDirectProviderFallback: false;
    mockMode: boolean;
    sdkPath: string;
    kujoBin: string;
    provider: "openai" | "openrouter" | "deepseek";
  };
}
