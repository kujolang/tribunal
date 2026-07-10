import type { KujoModelRequest, KujoModelResponse } from "../types.js";

/** Tribunal's only model invocation dependency. */
export interface KujoModelClient {
  invoke(request: KujoModelRequest): Promise<KujoModelResponse>;
}
