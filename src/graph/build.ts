import type { Config, ServiceConfig } from "../api/types";
import type { ChainSnapshot, Snapshot } from "../api/dashboard";

export type NodeKind =
  | "service"
  | "module"
  | "chain"
  | "hop"
  | "node"
  | "target"
  | "unresolved";

export type ModuleKind =
  | "admission"
  | "auther"
  | "bypass"
  | "resolver"
  | "hosts"
  | "limiter_conn"
  | "limiter_rate"
  | "limiter_traffic"
  | "quota";

export type EdgeKind =
  | "attach"
  | "chain"
  | "direct"
  | "hop"
  | "node"
  | "exit"
  | "forward";

export interface GraphNodeData extends Record<string, unknown> {
  kind: NodeKind;
  label: string;
  sub?: string;
  moduleKind?: ModuleKind;
  stage?: string;
  counters?: { errors: number; successes: number };
  dead?: boolean;
  /** Increments on new traffic to restart the one-shot node flash. */
  pulse?: number;
  bytesIn?: number;
  bytesOut?: number;
  conns?: number;
  rateIn?: number;
  rateOut?: number;
  quota?: {
    used: number;
    limit: number;
    blocked: boolean;
    expired: boolean;
  };
  chain?: string;
  unresolvedRef?: string;
}

export type GraphNode = {
  id: string;
  position: { x: number; y: number };
  data: GraphNodeData;
};

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  label?: string;
  chain?: string;
  services: string[];
}

interface RegistryEntry<T extends { name: string }> {
  byName: Map<string, T>;
}

function indexBy<T extends { name: string }>(rows: T[] | undefined): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows ?? []) {
    if (row?.name) map.set(row.name, row);
  }
  return map;
}

function moduleCounters(
  snapshot: Snapshot | null,
  kind: ModuleKind,
  name: string
): { errors: number; successes: number } | undefined {
  if (!snapshot) return undefined;
  let errors = 0;
  let successes = 0;
  let found = false;
  for (const row of snapshot.modules ?? []) {
    if (row.kind === kind && row.name === name) {
      successes += row.stats.calls ?? 0;
      errors += row.stats.errors ?? 0;
      found = true;
    }
  }
  return found ? { errors, successes } : undefined;
}

function chainCounters(
  snapshot: Snapshot | null,
  kind: "chain" | "hop" | "node",
  name: string,
  chain?: ChainSnapshot
): { errors: number; successes: number } | undefined {
  const source = chain ?? (snapshot?.chains ?? {})[name] as ChainSnapshot | undefined;
  if (!source) return undefined;
  let stats = source.stats;
  if (kind === "hop" && source.hops) {
    const hop = source.hops.find((h) => h.name === name);
    if (!hop) return undefined;
    stats = {
      connects: hop.nodes?.reduce((a, n) => a + n.stats.connects, 0) ?? 0,
      errors: hop.nodes?.reduce((a, n) => a + n.stats.errors, 0) ?? 0,
      connectDurationSumMicros: 0,
      connectCount: 0,
    };
  } else if (kind === "node" && source.nodes) {
    const node = source.nodes.find((n) => n.name === name);
    if (!node) return undefined;
    stats = node.stats;
  }
  return { errors: stats.errors, successes: stats.connects };
}

export function buildGraph(input: {
  config: Config;
  snapshot: Snapshot | null;
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const { config, snapshot } = input;
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const edgeKeys = new Set<string>();

  const addNode = (id: string, data: GraphNodeData): GraphNode => {
    const existing = nodes.get(id);
    if (existing) return existing;
    const node: GraphNode = { id, position: { x: 0, y: 0 }, data };
    nodes.set(id, node);
    return node;
  };

  const addEdge = (
    id: string,
    source: string,
    target: string,
    kind: EdgeKind,
    extra: Partial<GraphEdge> = {}
  ): GraphEdge => {
    const existing = edges.find((e) => e.id === id);
    if (existing) {
      const set = new Set(existing.services);
      for (const s of extra.services ?? []) set.add(s);
      existing.services = [...set];
      return existing;
    }
    const edge: GraphEdge = {
      id,
      source,
      target,
      kind,
      services: [...new Set(extra.services ?? [])],
      ...(extra.label !== undefined ? { label: extra.label } : {}),
      ...(extra.chain !== undefined ? { chain: extra.chain } : {}),
    };
    edges.push(edge);
    edgeKeys.add(id);
    return edge;
  };

  // ---------- registries ----------
  const services = indexBy(config.services);
  const chains = indexBy(config.chains);
  const hops = indexBy(config.hops);
  const nodesRegistry = indexBy(config.nodes);
  const bypasses = indexBy(config.bypasses);
  const authers = indexBy(config.authers);
  const admissions = indexBy(config.admissions);
  const hosts = indexBy(config.hosts);
  const resolvers = indexBy(config.resolvers);
  const limiters = indexBy(config.limiters);
  const climiters = indexBy(config.climiters);
  const rlimiters = indexBy(config.rlimiters);
  const quotas = indexBy(config.quotas);

  const unresolved = (ref: string, kind: NodeKind, sub?: string): GraphNode =>
    addNode(`unresolved:${ref}`, {
      kind: "unresolved",
      label: ref,
      sub: sub ?? "unresolved reference",
      unresolvedRef: ref,
    });

  // ---------- target(s) ----------
  // Only a service with no chain and no forwarder exits directly.
  const ensureDirectTarget = (): GraphNode =>
    addNode("target:direct", {
      kind: "target",
      label: "direct",
      sub: "direct exit",
    });

  // ---------- module attach helpers ----------
  const moduleSeen = new Set<string>();
  const attachModule = (
    serviceName: string,
    serviceNodeId: string,
    kind: ModuleKind,
    name: string,
    stage: string | undefined,
    registryResolved: boolean
  ) => {
    if (!name) return;
    const moduleId = `module:${kind}:${name}`;
    if (!nodes.has(moduleId)) {
      const data: GraphNodeData = {
        kind: "module",
        moduleKind: kind,
        label: name,
        sub: registryResolved ? kind : `${kind} (unresolved)`,
      };
      if (!registryResolved) {
        data.unresolvedRef = name;
        data.kind = "unresolved";
      }
      const counters = moduleCounters(snapshot, kind, name);
      if (counters !== undefined) data.counters = counters;
      if (kind === "quota") {
        const svc = services.get(serviceName);
        const q = svc?.status?.quotas?.find((row) => row?.name === name);
        if (q) {
          data.quota = {
            used: q.used ?? 0,
            limit: q.limit ?? 0,
            blocked: q.blocked ?? false,
            expired: q.expired ?? false,
          };
        }
      }
      addNode(moduleId, data);
    }
    moduleSeen.add(moduleId);
    addEdge(
      `${serviceName}:${kind}:${name}:${stage ?? ""}`,
      serviceNodeId,
      moduleId,
      "attach",
      { services: [serviceName], label: stage }
    );
  };

  // ---------- service loop ----------
  for (const svc of config.services ?? []) {
    const name = svc.name;
    if (!name) continue;
    const stats = snapshot?.services?.[name]?.stats;
    const rate = snapshot?.services?.[name]?.rate;
    const dead =
      svc.status?.state === "failed" ||
      svc.status?.state === "closed" ||
      svc.status?.state === "stopped";

    const serviceId = `service:${name}`;
    const serviceNode = addNode(serviceId, {
      kind: "service",
      label: name,
      sub: `${svc.handler?.type ?? "?"}+${svc.listener?.type ?? "?"} ${svc.addr ?? ""}`,
      dead,
      bytesIn: stats?.inputBytes,
      bytesOut: stats?.outputBytes,
      conns: stats?.currentConns,
      rateIn: rate?.inputBytesPerSecond,
      rateOut: rate?.outputBytesPerSecond,
      counters: stats
        ? { errors: stats.totalErrs, successes: stats.totalConns }
        : undefined,
    });

    // --- module attach edges ---
    const serviceStages: Array<string | undefined> = [undefined];
    for (const stage of serviceStages) {
      // single + array merges, deduped per stage
      const toList = (single?: string, array?: string[]) => {
        const out = new Set<string>();
        if (single) out.add(single);
        for (const v of array ?? []) if (v) out.add(v);
        return [...out];
      };

      const admissionNames = toList(svc.admission, svc.admissions);
      const bypassNames = toList(svc.bypass, svc.bypasses);
      const limiterNames = toList(svc.limiter, undefined);
      const hLimiterNames = toList(svc.handler?.limiter, undefined);
      const climiterNames = toList(svc.climiter, undefined);
      const rlimiterNames = toList(svc.rlimiter, undefined);
      const listenerAutherNames = toList(svc.listener?.auther, svc.listener?.authers);
      const handlerAutherNames = toList(svc.handler?.auther, svc.handler?.authers);
      const quotaNames = toList(undefined, svc.quotas);

      for (const n of admissionNames)
        attachModule(name, serviceId, "admission", n, "", admissions.has(n));
      for (const n of bypassNames)
        attachModule(name, serviceId, "bypass", n, "", bypasses.has(n));
      for (const n of toList(svc.resolver, undefined))
        attachModule(name, serviceId, "resolver", n, "", resolvers.has(n));
      for (const n of toList(svc.hosts, undefined))
        attachModule(name, serviceId, "hosts", n, "", hosts.has(n));
      for (const n of limiterNames)
        attachModule(name, serviceId, "limiter_traffic", n, "listener", limiters.has(n));
      for (const n of hLimiterNames)
        attachModule(name, serviceId, "limiter_traffic", n, "handler", limiters.has(n));
      for (const n of climiterNames)
        attachModule(name, serviceId, "limiter_conn", n, "", climiters.has(n));
      for (const n of rlimiterNames)
        attachModule(name, serviceId, "limiter_rate", n, "", rlimiters.has(n));
      for (const n of listenerAutherNames)
        attachModule(name, serviceId, "auther", n, "listener", authers.has(n));
      for (const n of handlerAutherNames)
        attachModule(name, serviceId, "auther", n, "handler", authers.has(n));
      for (const n of quotaNames)
        attachModule(name, serviceId, "quota", n, "", quotas.has(n));
    }

    // --- chain edges ---
    const handlerChain = svc.handler?.chain;
    const listenerChain = svc.listener?.chain;
    const handlerChainGroup = svc.handler?.chainGroup?.chains ?? [];
    const listenerChainGroup = svc.listener?.chainGroup?.chains ?? [];
    const ignoreChain =
      (svc.metadata as Record<string, unknown> | undefined)?.ignoreChain ===
      true;

    const chainRefs: Array<{ name: string; stage: string }> = [];
    const pushChain = (n: string | undefined, stage: string) => {
      if (n && !ignoreChain) chainRefs.push({ name: n, stage });
    };
    pushChain(listenerChain, "listener");
    for (const n of listenerChainGroup) pushChain(n, "listener");
    pushChain(handlerChain, "handler");
    for (const n of handlerChainGroup) pushChain(n, "handler");

    const seenChains = new Set<string>();
    let serviceHasChain = false;
    for (const { name: chainName, stage } of chainRefs) {
      const key = `${chainName}:${stage}`;
      if (seenChains.has(key)) continue;
      seenChains.add(key);
      serviceHasChain = true;

      if (!chains.has(chainName)) {
        const unresolvedNode = unresolved(chainName, "unresolved", `chain ${chainName}`);
        addEdge(`${name}:chain:${chainName}:${stage}`, serviceId, unresolvedNode.id, "chain", {
          services: [name],
          label: stage,
          chain: chainName,
        });
        continue;
      }
      const chainNodeId = `chain:${chainName}`;
      const chainSnapshot = snapshot?.chains?.[chainName];
      addNode(chainNodeId, {
        kind: "chain",
        label: chainName,
        sub: `chain`,
        chain: chainName,
        counters: chainCounters(snapshot, "chain", chainName, chainSnapshot),
      });
      addEdge(`${name}:chain:${chainName}:${stage}`, serviceId, chainNodeId, "chain", {
        services: [name],
        label: stage,
        chain: chainName,
      });

      // --- hops for this chain ---
      const chainDef = chains.get(chainName)!;
      const hopsArray = chainDef.hops ?? [];
      hopsArray.forEach((hopEntry, hopIndex) => {
        const hopId = hopEntry.nodes
          ? `hop:${chainName}/${hopEntry.name ?? hopIndex}`
          : `hop:${hopEntry.name ?? hopIndex}`;
        hopEntry.name && !hopEntry.nodes && !hops.has(hopEntry.name)
          ? unresolved(hopEntry.name, "unresolved", `hop ${hopEntry.name}`)
          : null;

        const inline = !!hopEntry.nodes;
        const hopCounters = inline
          ? chainCounters(snapshot, "hop", hopEntry.name ?? `${hopIndex}`, chainSnapshot)
          : chainCounters(snapshot, "hop", hopEntry.name ?? `${hopIndex}`, chainSnapshot);

        const sourceNodeId =
          inline || hops.has(hopEntry.name ?? "")
            ? addNode(hopId, {
                kind: "hop",
                label: hopEntry.name ?? `${hopIndex}`,
                sub: inline ? `inline (${chainName})` : `registry hop`,
                chain: chainName,
                counters: hopCounters,
              }).id
            : unresolved(hopEntry.name ?? `hop ${hopIndex}`, "unresolved", `hop ${hopEntry.name ?? hopIndex}`).id;

        addEdge(`${chainName}:hop:${hopEntry.name ?? hopIndex}:${hopId}`, chainNodeId, sourceNodeId, "hop", {
          services: [name],
          label: `hop ${hopIndex}`,
          chain: chainName,
        });

        // --- nodes for this hop ---
        const hopNodes = inline
          ? hopEntry.nodes ?? []
          : hops.get(hopEntry.name ?? "")?.nodes ?? [];
        hopNodes.forEach((nodeEntry, nodeIndex) => {
          const nodeId = inline
            ? `node:${chainName}/${hopEntry.name ?? hopIndex}/${nodeEntry.name ?? nodeIndex}`
            : `node:${hopEntry.name}/${nodeEntry.name ?? nodeIndex}`;
          const nodeCounters = chainCounters(snapshot, "node", nodeEntry.name ?? `${nodeIndex}`, chainSnapshot);
          addNode(nodeId, {
            kind: "node",
            label: nodeEntry.name ?? `${nodeIndex}`,
            sub: `${nodeEntry.connector?.type ?? "?"}/${nodeEntry.dialer?.type ?? "?"} ${nodeEntry.addr ?? ""}`,
            chain: chainName,
            counters: nodeCounters,
          });
          addEdge(`${hopId}:node:${nodeEntry.name ?? nodeIndex}`, sourceNodeId, nodeId, "node", {
            services: [name],
            chain: chainName,
          });
        });
      });
    }

    // --- forwarder nodes ---
    const forwarder = svc.forwarder;
    if (forwarder?.nodes?.length) {
      serviceHasChain = serviceHasChain || false;
      forwarder.nodes.forEach((fnode, index) => {
        const id = `fwd:${name}/${index}`;
        addNode(id, {
          kind: "node",
          label: fnode.name ?? `target-${index}`,
          sub: `forwarder ${fnode.addr ?? ""}`,
        });
        addEdge(`${name}:forward:${index}`, serviceId, id, "forward", {
          services: [name],
          label: "forward",
        });
      });
    } else if (forwarder?.hop) {
      // Traffic exits via the referenced hop's nodes; no forwarder cards.
      const hopEdgeId = `${name}:forward:hop`;
      const hop = hops.get(forwarder.hop);
      if (hop) {
        // The hop is already drawn if this service also references chains
        // that use it; otherwise wire the service → hop as a forward edge.
        addEdge(hopEdgeId, serviceId, `hop:${forwarder.hop}`, "forward", {
          services: [name],
          label: "forward",
        });
      } else {
        const unresolvedNode = unresolved(forwarder.hop, "unresolved", `forwarder hop ${forwarder.hop}`);
        addEdge(hopEdgeId, serviceId, unresolvedNode.id, "forward", {
          services: [name],
          label: "forward",
        });
      }
    }

    // --- direct edge only when there is no chain/forwarder path ---
    if (!serviceHasChain && !forwarder?.nodes?.length && !forwarder?.hop) {
      addEdge(`${name}:direct`, serviceId, "target:direct", "direct", {
        services: [name],
        label: "direct",
      });
      ensureDirectTarget();
    }

    // keep referenced modules around even when the registry resolved them
    void moduleSeen;
    void serviceNode;
  }

  return {
    nodes: [...nodes.values()],
    edges: edges.filter((e) => {
      if (e.kind === "exit" || e.kind === "direct") {
        return nodes.has(e.target);
      }
      return nodes.has(e.source) && nodes.has(e.target);
    }),
  };
}
