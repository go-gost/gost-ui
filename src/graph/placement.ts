import { layoutGraph, placeNewNodes } from "./layout";
import { mergePositions, type PositionMap } from "./positions";
import type { GraphEdge, GraphNode } from "./build";

/**
 * Resolve every node position in one pass: saved positions stay fixed, while
 * nodes without one use the dagre slot unless it is occupied, in which case
 * placeNewNodes walks down/right to a free spot.
 */
export function resolvePositions(
  nodes: GraphNode[],
  edges: GraphEdge[],
  saved: PositionMap
): PositionMap {
  const laid = layoutGraph(nodes, edges);
  const fresh = placeNewNodes(laid, saved);
  return mergePositions(
    saved,
    laid.map((node) => ({
      id: node.id,
      position: fresh[node.id] ?? node.position,
    }))
  );
}
