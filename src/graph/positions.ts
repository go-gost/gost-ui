export interface PositionMap {
  [id: string]: { x: number; y: number };
}

export function positionKey(addr?: string): string {
  return `gost-ui:topology:${addr ?? "-"}`;
}

export function loadPositions(addr?: string): PositionMap {
  try {
    const raw = localStorage.getItem(positionKey(addr));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PositionMap;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

export function savePositions(
  addr: string | undefined,
  positions: PositionMap
): void {
  try {
    localStorage.setItem(positionKey(addr), JSON.stringify(positions));
  } catch {
    // Quota or private mode — positions are cosmetic, never fail the save.
  }
}

export function mergePositions(
  saved: PositionMap,
  nodes: Array<{ id: string; position: { x: number; y: number } }>
): PositionMap {
  const out: PositionMap = { ...saved };
  for (const node of nodes) {
    if (!out[node.id]) {
      out[node.id] = { ...node.position };
    }
  }
  return out;
}
