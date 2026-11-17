import type {
  ChainConfig,
  Config,
  HopConfig,
  NodeConfig,
  ServiceConfig,
} from "../api/types";
import type { GraphNodeData } from "./build";

export type LinkKind =
  | "service-chain"
  | "chain-hop"
  | "hop-node"
  | "service-forwarder";

export interface LinkChange {
  resource: "services" | "chains" | "hops";
  name: string;
  config: Config;
}

export interface ParsedGraphId {
  kind: string;
  name: string;
  chain?: string;
}

export function parseGraphId(id: string): ParsedGraphId | null {
  const colon = id.indexOf(":");
  if (colon <= 0) return null;
  const kind = id.slice(0, colon);
  const rest = id.slice(colon + 1);
  if (!rest) return null;
  const slash = rest.lastIndexOf("/");
  if (slash === -1) return { kind, name: rest };
  return {
    kind,
    name: rest.slice(slash + 1),
    chain: rest.slice(0, slash),
  };
}

export function linkKind(
  source: GraphNodeData,
  target: GraphNodeData
): LinkKind | null {
  if (source.kind === "service" && target.kind === "chain") {
    return "service-chain";
  }
  if (source.kind === "chain" && target.kind === "hop") return "chain-hop";
  if (source.kind === "hop" && target.kind === "node") return "hop-node";
  if (source.kind === "service" && target.kind === "hop") {
    return "service-forwarder";
  }
  return null;
}

function kindOf(id: ParsedGraphId): GraphNodeData {
  return { kind: id.kind, label: id.name } as GraphNodeData;
}

function findService(config: Config, name: string): ServiceConfig | undefined {
  return config.services?.find((item) => item.name === name);
}

function findChain(config: Config, name: string): ChainConfig | undefined {
  return config.chains?.find((item) => item.name === name);
}

function findHop(config: Config, name: string): HopConfig | undefined {
  return config.hops?.find((item) => item.name === name);
}

export function connectLink(
  config: Config,
  sourceId: string,
  targetId: string,
  stage: "handler" | "listener" = "handler"
): LinkChange | null {
  const source = parseGraphId(sourceId);
  const target = parseGraphId(targetId);
  if (!source || !target) return null;
  const kind = linkKind(kindOf(source), kindOf(target));
  if (!kind) return null;

  const next = structuredClone(config);
  switch (kind) {
    case "service-chain": {
      const service = findService(next, source.name);
      if (!service || service[stage]?.chain) return null;
      service[stage] = {
        ...(service[stage] ?? {}),
        chain: target.name,
      } as ServiceConfig["handler"];
      return { resource: "services", name: service.name, config: next };
    }
    case "chain-hop": {
      if (target.chain) return null;
      const chain = findChain(next, source.name);
      if (!chain || chain.hops?.some((hop) => hop.name === target.name)) {
        return null;
      }
      chain.hops = [...(chain.hops ?? []), { name: target.name } as HopConfig];
      return { resource: "chains", name: chain.name, config: next };
    }
    case "hop-node": {
      const newNode = { name: target.name } as NodeConfig;
      if (source.chain) {
        const chain = findChain(next, source.chain);
        const hop = chain?.hops?.find((item) => item.name === source.name);
        if (!chain || !hop || hop.nodes?.some((n) => n.name === target.name)) {
          return null;
        }
        hop.nodes = [...(hop.nodes ?? []), newNode];
        return { resource: "chains", name: chain.name, config: next };
      }
      const hop = findHop(next, source.name);
      if (!hop || hop.nodes?.some((n) => n.name === target.name)) return null;
      hop.nodes = [...(hop.nodes ?? []), newNode];
      return { resource: "hops", name: hop.name, config: next };
    }
    case "service-forwarder": {
      if (target.chain) return null;
      const service = findService(next, source.name);
      if (!service || service.forwarder?.nodes?.length || service.forwarder?.hop) {
        return null;
      }
      service.forwarder = {
        ...(service.forwarder ?? {}),
        hop: target.name,
      } as ServiceConfig["forwarder"];
      return { resource: "services", name: service.name, config: next };
    }
  }
}

export function disconnectLink(
  config: Config,
  sourceId: string,
  targetId: string
): LinkChange | null {
  const source = parseGraphId(sourceId);
  const target = parseGraphId(targetId);
  if (!source || !target) return null;
  const kind = linkKind(kindOf(source), kindOf(target));
  if (!kind) return null;

  const next = structuredClone(config);
  switch (kind) {
    case "service-chain": {
      const service = findService(next, source.name);
      if (!service) return null;
      let changed = false;
      for (const stage of ["handler", "listener"] as const) {
        if (service[stage]?.chain === target.name) {
          service[stage] = {
            ...service[stage],
            chain: "",
          } as ServiceConfig["handler"];
          changed = true;
        }
      }
      return changed
        ? { resource: "services", name: service.name, config: next }
        : null;
    }
    case "chain-hop": {
      const chain = findChain(next, source.name);
      if (!chain?.hops?.some((hop) => hop.name === target.name)) return null;
      chain.hops = chain.hops.filter((hop) => hop.name !== target.name);
      return { resource: "chains", name: chain.name, config: next };
    }
    case "hop-node": {
      if (source.chain) {
        const chain = findChain(next, source.chain);
        const hop = chain?.hops?.find((item) => item.name === source.name);
        if (!chain || !hop?.nodes?.some((n) => n.name === target.name)) {
          return null;
        }
        hop.nodes = hop.nodes.filter((node) => node.name !== target.name);
        return { resource: "chains", name: chain.name, config: next };
      }
      const hop = findHop(next, source.name);
      if (!hop?.nodes?.some((node) => node.name === target.name)) return null;
      hop.nodes = hop.nodes.filter((node) => node.name !== target.name);
      return { resource: "hops", name: hop.name, config: next };
    }
    case "service-forwarder": {
      const service = findService(next, source.name);
      if (!service || service.forwarder?.hop !== target.name) return null;
      service.forwarder = {
        ...service.forwarder,
        hop: "",
      } as ServiceConfig["forwarder"];
      return { resource: "services", name: service.name, config: next };
    }
  }
}
