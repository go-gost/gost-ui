export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

function viewportKey(addr?: string): string {
  return `gost-ui:topology:viewport:${addr ?? "-"}`;
}

export function loadViewport(addr?: string): Viewport | null {
  try {
    const raw = localStorage.getItem(viewportKey(addr));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Viewport>;
    const values = [parsed.x, parsed.y, parsed.zoom];
    if (
      !values.every(
        (value) => typeof value === "number" && Number.isFinite(value)
      )
    ) {
      return null;
    }
    return { x: parsed.x!, y: parsed.y!, zoom: parsed.zoom! };
  } catch {
    return null;
  }
}

export function saveViewport(addr: string | undefined, vp: Viewport): void {
  try {
    localStorage.setItem(viewportKey(addr), JSON.stringify(vp));
  } catch {
    // Cosmetic state; never fail the UI on quota or private mode.
  }
}
