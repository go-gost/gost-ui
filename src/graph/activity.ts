import type { Snapshot } from "../api/dashboard";

export interface Activity {
  services: Record<string, { pulse: number; bytes: number }>;
  modules: Record<string, { pulse: number }>;
}

export function emptyActivity(): Activity {
  return { services: {}, modules: {} };
}

/**
 * flowDuration mirrors cuttle: larger byte bursts, slightly tighter animation.
 */
export function flowDuration(bytes: number): number {
  return Math.min(0.9, Math.max(0.45, 0.9 / Math.sqrt(Math.max(bytes, 1))));
}

function byteTotal(snapshot: Snapshot, name: string): number | null {
  const stats = snapshot.services?.[name]?.stats;
  if (!stats) return null;
  return (stats.inputBytes ?? 0) + (stats.outputBytes ?? 0);
}

export function diffActivity(
  prev: Snapshot | null,
  next: Snapshot,
  pulse: number
): Activity {
  const out = emptyActivity();
  if (!prev) {
    return out;
  }
  for (const [name, svc] of Object.entries(next.services ?? {})) {
    const prevBytes = byteTotal(prev, name);
    const bytes = byteTotal(next, name);
    if (prevBytes === null || bytes === null) continue;
    if (bytes > prevBytes) {
      out.services[name] = { pulse, bytes: bytes - prevBytes };
    }
  }
  for (const mod of next.modules ?? []) {
    const prevStats = prev.modules?.find(
      (m) => m.kind === mod.kind && m.name === mod.name
    )?.stats;
    if (!prevStats) continue;
    const calls = mod.stats?.calls ?? 0;
    if (calls > (prevStats.calls ?? 0)) {
      out.modules[`${mod.kind}:${mod.name}`] = { pulse };
    }
  }
  return out;
}
