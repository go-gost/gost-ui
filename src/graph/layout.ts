import dagre from "dagre";
import type { GraphEdge, GraphNode, NodeKind } from "./build";

export interface PositionMap {
  [id: string]: { x: number; y: number };
}

interface Size {
  w: number;
  h: number;
}

const sizes: Record<NodeKind, Size> = {
  service: { w: 250, h: 82 },
  module: { w: 210, h: 74 },
  chain: { w: 210, h: 80 },
  hop: { w: 180, h: 66 },
  node: { w: 230, h: 82 },
  target: { w: 150, h: 60 },
  unresolved: { w: 210, h: 70 },
};

export function nodeSize(kind: NodeKind): Size {
  return sizes[kind];
}

export function layoutGraph(
  nodes: GraphNode[],
  edges: GraphEdge[]
): GraphNode[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "LR",
    nodesep: 36,
    ranksep: 110,
    marginx: 24,
    marginy: 24,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    const size = nodeSize(node.data.kind);
    g.setNode(node.id, { width: size.w, height: size.h });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }
  dagre.layout(g);

  return nodes.map((node) => {
    const placed = g.node(node.id);
    if (!placed) {
      return { ...node, position: { x: 0, y: 0 } };
    }
    const size = nodeSize(node.data.kind);
    return {
      ...node,
      position: {
        x: placed.x - size.w / 2,
        y: placed.y - size.h / 2,
      },
    };
  });
}

/**
 * placeNewNodes returns positions for nodes missing from `saved`, walking
 * down/right until a free slot is found. Saved entries are never moved and
 * are never returned (the caller keeps them).
 */
export function placeNewNodes(
  nodes: GraphNode[],
  saved: PositionMap
): PositionMap {
  const occupied = new Map<string, Size>();
  for (const [id, pos] of Object.entries(saved)) {
    const node = nodes.find((n) => n.id === id);
    occupied.set(id, node ? nodeSize(node.data.kind) : { w: 220, h: 80 });
    void pos;
  }
  const result: PositionMap = {};
  const step = 24;

  const overlaps = (a: { x: number; y: number }, b: { x: number; y: number }, sa: Size, sb: Size) =>
    a.x < b.x + sb.w + step && a.x + sa.w + step > b.x &&
    a.y < b.y + sb.h + step && a.y + sa.h + step > b.y;

  for (const node of nodes) {
    if (saved[node.id]) continue;
    const size = nodeSize(node.data.kind);
    let base = node.position;
    if (!base || (base.x === 0 && base.y === 0)) {
      // Walk down/right from a pseudo origin.
      base = { x: 40, y: 40 };
    }
    let candidate = { x: base.x, y: base.y };
    let guard = 0;
    while (
      Object.entries(saved).some(([id, pos]) =>
        overlaps(candidate, pos, size, occupied.get(id) ?? { w: 220, h: 80 })
      ) ||
      Object.values(result).some((pos) =>
        overlaps(candidate, pos, size, size)
      )
    ) {
      candidate = { x: candidate.x + step, y: candidate.y + step };
      guard += 1;
      if (guard > 200) break;
    }
    result[node.id] = candidate;
  }
  return result;
}
