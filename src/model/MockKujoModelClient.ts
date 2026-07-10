import type { KujoModelClient } from "./KujoModelClient.js";
import type { KujoModelRequest, KujoModelResponse } from "../types.js";

export class MockKujoModelClient implements KujoModelClient {
  readonly requests: KujoModelRequest[] = [];

  async invoke(request: KujoModelRequest): Promise<KujoModelResponse> {
    this.requests.push(structuredClone(request));
    const structured = this.responseFor(request);
    return Promise.resolve({
      content: JSON.stringify(structured),
      structured,
      metadata: {
        provider: "kujo-fixture",
        model: `mock-${request.seatId}`,
        requestId: `${request.runId}-${request.stageId}-${request.seatId}`,
        contractVersion: "1.0.0",
        latencyMs: 0,
        inputTokens: Math.max(1, Math.ceil(request.input.length / 4)),
        outputTokens: 48,
        totalTokens: Math.max(1, Math.ceil(request.input.length / 4)) + 48,
      },
    });
  }

  private responseFor(request: KujoModelRequest): Record<string, unknown> {
    if (request.stageId === "executioner-kill-pass") {
      return {
        fatalFlaws: [],
        survivableRisks: [
          "Evidence should be validated before irreversible execution.",
        ],
        requiredChanges: [
          "Define measurable acceptance criteria and rollback evidence.",
        ],
        recommendation: "survive",
      };
    }
    if (request.stageId === "judge-ruling") {
      return {
        finalVerdict:
          "Proceed conditionally after the required evidence is produced.",
        bestArgumentFor: "The proposal has a coherent, testable path to value.",
        bestArgumentAgainst:
          "Its highest-risk assumptions are not yet evidenced.",
        panelAgreement: [
          "Use bounded scope",
          "Require verification before completion",
        ],
        unresolved: ["Real-world outcome evidence remains outstanding"],
        requiredChanges: ["Add a rollback plan", "Capture acceptance evidence"],
        confidence: 7,
        disposition: "proceed",
      };
    }
    if (request.stageId === "decision-packet") {
      return {
        decision:
          "Proceed conditionally with bounded implementation and explicit evidence gates.",
        scope: "Only the proposal described in the docket.",
        nonGoals: ["Unrelated platform expansion"],
        requiredNextActions: [
          "Implement the smallest testable slice",
          "Capture verification evidence",
        ],
        suggestedOwnerRole: "technical owner",
        suggestedModelLevel:
          "frontier reasoning for review; local capable model for routine execution",
        acceptanceCriteria: [
          "All scoped checks pass",
          "Rollback path is demonstrated",
        ],
        escalationTriggers: [
          "Scope growth",
          "Failed safety check",
          "Missing owner",
        ],
        evidenceRequired: [
          "Test output",
          "Change summary",
          "Rollback evidence",
        ],
        stopTheLineConditions: [
          "Secret exposure",
          "Unbounded destructive action",
          "Corrupted evidence",
        ],
      };
    }

    const positions: Record<string, string> = {
      judge:
        "The proposal is viable only if its evidence gates remain explicit.",
      executioner:
        "No fatal flaw is proven, but unsupported assumptions must be bounded.",
      builder: "A narrow implementation slice is technically feasible.",
      operator:
        "Operational ownership and rollback must be defined before rollout.",
      "market-lens":
        "The proposal needs a measurable user outcome to justify investment.",
    };
    return {
      position: positions[request.seatId] ?? "Further evidence is required.",
      arguments: [
        `${request.seatId} applied its defined authority to the docket.`,
      ],
      risks: ["Insufficient evidence may produce false confidence."],
      recommendation:
        request.stageId === "cross-examination"
          ? "proceed-with-conditions"
          : "continue-review",
    };
  }
}
