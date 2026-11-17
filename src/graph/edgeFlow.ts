import type { GraphEdge } from "./build";

export interface EdgeFlowState {
  error: boolean;
  color: string;
  dashed: boolean;
}

/** Dead services paint their edges red and dashed; otherwise dashes encode
 * the structural edge kind (direct/attach). */
export function edgeFlowState(
  edge: GraphEdge,
  deadServices: ReadonlySet<string>
): EdgeFlowState {
  if (edge.services.some((name) => deadServices.has(name))) {
    return { error: true, color: "#dc2626", dashed: true };
  }
  return {
    error: false,
    color: "#94a3b8",
    dashed: edge.kind === "direct" || edge.kind === "attach",
  };
}
