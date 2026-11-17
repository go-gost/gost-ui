import type { Activity } from "./activity";

/** Activity keys modules as "kind:name" but graph nodes are labelled by name. */
export function pulsesByLabel(activity: Activity): Map<string, number> {
  const out = new Map<string, number>();
  for (const [name, info] of Object.entries(activity.services)) {
    out.set(name, info.pulse);
  }
  for (const [key, info] of Object.entries(activity.modules)) {
    const name = key.includes(":") ? key.slice(key.indexOf(":") + 1) : key;
    out.set(name, Math.max(out.get(name) ?? 0, info.pulse));
  }
  return out;
}
