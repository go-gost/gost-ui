import type { ModuleSnapshot } from "../../api/dashboard";

/** Display order of the known module kinds; unknown kinds follow alphabetically. */
export const KIND_ORDER = [
  "bypass",
  "admission",
  "auther",
  "hosts",
  "resolver",
  "limiter_conn",
  "limiter_rate",
  "limiter_traffic",
] as const;

const rank = (kind: string) => {
  const index = KIND_ORDER.indexOf(kind as (typeof KIND_ORDER)[number]);
  return index === -1 ? KIND_ORDER.length : index;
};

export interface ModuleGroup {
  kind: string;
  rows: ModuleSnapshot[];
}

/** Groups modules by kind in stable display order, rows sorted by name. */
export function groupModules(modules: ModuleSnapshot[]): ModuleGroup[] {
  const groups = new Map<string, ModuleSnapshot[]>();
  for (const module of modules) {
    const rows = groups.get(module.kind) ?? [];
    rows.push(module);
    groups.set(module.kind, rows);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([kind, rows]) => ({
      kind,
      rows: [...rows].sort((a, b) => a.name.localeCompare(b.name)),
    }));
}
