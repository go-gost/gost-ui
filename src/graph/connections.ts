import type { ConnectionRecord } from "../api/dashboard";
import type { Selection } from "../components/Topology/index";

export type SelectionFilter =
  | { kind: "service"; name: string }
  | { kind: "chain"; name: string }
  | { kind: "hop"; name: string; hopIndex: number | null; chainName?: string }
  | { kind: "node"; name: string }
  | { kind: "other" };

/**
 * Parses the stable selection id into a filter description. Returns `other`
 * for kinds that carry no useful connection filter (target/unresolved/module),
 * so the panel can short-circuit to "no records to show".
 */
export function selectionFilter(sel: Selection): SelectionFilter {
  if (!sel) return { kind: "other" };
  const id = sel.id;
  if (id.startsWith("service:")) {
    return { kind: "service", name: id.slice("service:".length) };
  }
  if (id.startsWith("chain:")) {
    return { kind: "chain", name: id.slice("chain:".length) };
  }
  if (id.startsWith("hop:")) {
    // Inline hop ids look like `hop:<chain>/<index>`; registry hops are
    // `hop:<name>` and match by node-fare filter below (all hops of the
    // selected chain match by index).
    const rest = id.slice("hop:".length);
    const slash = rest.indexOf("/");
    if (slash > 0) {
      const chainName = rest.slice(0, slash);
      const idx = Number(rest.slice(slash + 1));
      return {
        kind: "hop",
        name: id,
        hopIndex: Number.isFinite(idx) ? idx : null,
        chainName,
      };
    }
    // Registry hop: we cannot filter without chain context, treat as node
    // match on hop name via the per-hop slots — show all connections through
    // any hop whose index is `index` (unknown) — fall back to empty.
    return { kind: "other" };
  }
  if (id.startsWith("node:")) {
    const rest = id.slice("node:".length);
    // `node:<hop>/<name>` or `node:<chain>/<hop>/<name>`.
    const parts = rest.split("/");
    return { kind: "node", name: parts[parts.length - 1] || id };
  }
  return { kind: "other" };
}

/**
 * Returns true when the record matches the selection. The caller fetches
 * broadly (`?limit=200`) for chain/hop/node and filters here; only service
 * selections can rely on the server-side `service` parameter.
 */
export function matchesSelection(
  record: ConnectionRecord,
  filter: SelectionFilter
): boolean {
  switch (filter.kind) {
    case "service":
      return record.service === filter.name;
    case "chain":
      return record.chain === filter.name;
    case "hop": {
      if (filter.hopIndex == null) return false;
      const hops = record.path ?? [];
      return hops.some(
        (h) =>
          h.hop === filter.hopIndex &&
          (filter.chainName == null || h.chain === filter.chainName)
      );
    }
    case "node": {
      const hops = record.path ?? [];
      return hops.some((h) => h.node === filter.name);
    }
    case "other":
      return false;
  }
}
