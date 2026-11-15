import { expect, test } from "vitest";
import { buildGraph } from "./build";
import type { Config, ServiceConfig } from "../api/types";
import type { Snapshot } from "../api/dashboard";

const empty = {
  services: [],
  chains: [],
  hops: [],
  nodes: [],
  bypasses: [],
  authers: [],
  admissions: [],
  hosts: [],
  resolvers: [],
  limiters: [],
  climiters: [],
  rlimiters: [],
  quotas: [],
} as unknown as Config;

const service = (
  name: string,
  patch: Partial<ServiceConfig> = {}
): ServiceConfig =>
  ({
    name,
    addr: `:${name}`,
    listener: { type: "tcp" },
    handler: { type: "http" },
    metadata: {},
    ...patch,
  } as ServiceConfig);

const cfg = (patch: Partial<Config>): Config => ({ ...empty, ...patch });

test("a service with no chain and no forwarder draws a direct edge", () => {
  const { nodes, edges } = buildGraph({
    config: cfg({ services: [service("a")] }),
    snapshot: null,
  });
  expect(nodes.find((n) => n.id === "service:a")).toBeTruthy();
  expect(edges.find((e) => e.kind === "direct")?.target).toBe(
    "target:direct"
  );
});

test("a shared bypass is one node with one edge per service", () => {
  const { nodes, edges } = buildGraph({
    config: cfg({
      services: [service("a", { bypass: "by" }), service("b", { bypass: "by" })],
      bypasses: [{ name: "by" } as never],
    }),
    snapshot: null,
  });
  expect(nodes.filter((n) => n.id === "module:bypass:by")).toHaveLength(1);
  expect(edges.filter((e) => e.target === "module:bypass:by")).toHaveLength(2);
  expect(
    nodes.find((n) => n.id === "module:bypass:by")?.data.counters
  ).toBeUndefined();
});

test("the same auther on listener and handler is one node with two staged edges", () => {
  const { nodes, edges } = buildGraph({
    config: cfg({
      services: [
        service("a", {
          listener: { type: "tcp", auther: "au" } as never,
          handler: { type: "http", auther: "au" } as never,
        }),
      ],
      authers: [{ name: "au" } as never],
    }),
    snapshot: null,
  });
  expect(nodes.filter((n) => n.id === "module:auther:au")).toHaveLength(1);
  const attach = edges.filter((e) => e.target === "module:auther:au");
  expect(attach.map((e) => e.label).sort()).toEqual(["handler", "listener"]);
});

test("listener and handler chains are both drawn", () => {
  const { edges } = buildGraph({
    config: cfg({
      services: [
        service("a", {
          listener: { type: "tcp", chain: "c1" } as never,
          handler: { type: "http", chain: "c2" } as never,
        }),
      ],
      chains: [
        { name: "c1", hops: [] } as never,
        { name: "c2", hops: [] } as never,
      ],
    }),
    snapshot: null,
  });
  expect(edges.filter((e) => e.kind === "chain").map((e) => e.target).sort()).toEqual([
    "chain:c1",
    "chain:c2",
  ]);
});

test("ignoreChain draws no chain edge", () => {
  const { edges } = buildGraph({
    config: cfg({
      services: [
        service("a", {
          metadata: { ignoreChain: true },
          handler: { type: "http", chain: "c1" } as never,
        }),
      ],
      chains: [{ name: "c1", hops: [] } as never],
    }),
    snapshot: null,
  });
  expect(edges.filter((e) => e.kind === "chain")).toHaveLength(0);
});

test("chainGroup expands to one edge per chain", () => {
  const { edges } = buildGraph({
    config: cfg({
      services: [
        service("a", {
          handler: {
            type: "http",
            chainGroup: { chains: ["c1", "c2"] },
          } as never,
        }),
      ],
      chains: [
        { name: "c1", hops: [] } as never,
        { name: "c2", hops: [] } as never,
      ],
    }),
    snapshot: null,
  });
  expect(
    edges.filter((e) => e.kind === "chain").map((e) => e.target).sort()
  ).toEqual(["chain:c1", "chain:c2"]);
});

test("a registry hop is shared and owns its nodes", () => {
  const shared = {
    name: "h1",
    nodes: [{ name: "n1", addr: "1.2.3.4:80" }],
  };
  const { nodes, edges } = buildGraph({
    config: cfg({
      services: [
        service("a", { handler: { type: "http", chain: "c1" } as never }),
        service("b", { handler: { type: "http", chain: "c2" } as never }),
      ],
      chains: [
        { name: "c1", hops: [{ name: "h1" }] } as never,
        { name: "c2", hops: [{ name: "h1" }] } as never,
      ],
      hops: [shared as never],
    }),
    snapshot: null,
  });
  expect(nodes.filter((n) => n.id === "hop:h1")).toHaveLength(1);
  expect(nodes.filter((n) => n.id === "node:h1/n1")).toHaveLength(1);
  expect(edges.filter((e) => e.target === "hop:h1")).toHaveLength(2);
});

test("a dangling reference becomes a visible unresolved card", () => {
  const { nodes, edges } = buildGraph({
    config: cfg({
      services: [service("a", { bypass: "missing" })],
    }),
    snapshot: null,
  });
  const unresolved = nodes.find((n) => n.data.kind === "unresolved");
  expect(unresolved?.data.unresolvedRef).toBe("missing");
  expect(edges.some((e) => e.target === unresolved?.id)).toBe(true);
});

test("forwarder nodes are positional and suppress the direct edge", () => {
  const { nodes, edges } = buildGraph({
    config: cfg({
      services: [
        service("a", {
          forwarder: {
            nodes: [
              { name: "fw1", addr: "10.0.0.1:80" },
              { name: "fw2", addr: "10.0.0.2:80" },
            ],
          } as never,
        }),
      ],
    }),
    snapshot: null,
  });
  expect(
    nodes.filter((n) => n.id.startsWith("fwd:a/")).map((n) => n.id)
  ).toEqual(["fwd:a/0", "fwd:a/1"]);
  expect(edges.filter((e) => e.kind === "forward")).toHaveLength(2);
  expect(edges.filter((e) => e.kind === "direct")).toHaveLength(0);
});

test("counters come from the snapshot and quota from the config", () => {
  const snapshot = {
    version: 1,
    generatedAt: "",
    startedAt: "",
    sampleIntervalSeconds: 5,
    metricsEnabled: true,
    services: {
      a: {
        name: "a",
        state: "ready",
        stats: {
          totalConns: 10,
          currentConns: 2,
          inputBytes: 100,
          outputBytes: 200,
          totalErrs: 5,
        },
        rate: { inputBytesPerSecond: 10, outputBytesPerSecond: 20 },
      },
    },
    modules: [],
    chains: {},
    events: [],
    history: [],
  } as unknown as Snapshot;
  const { nodes } = buildGraph({
    config: cfg({
      services: [
        service("a", {
          quotas: ["q1"],
          status: {
            state: "ready",
            stats: {
              totalConns: 0,
              currentConns: 0,
              inputBytes: 0,
              outputBytes: 0,
              totalErrs: 0,
            },
            createTime: 0,
            events: [],
            quotas: [
              {
                name: "q1",
                used: 7,
                limit: 10,
                blocked: false,
                expired: false,
                startsAt: 0,
                expiresAt: 0,
                active: true,
                direction: "tx",
              },
            ],
            stoppedByLimit: false,
          },
        }),
      ],
      quotas: [{ name: "q1" } as never],
    }),
    snapshot,
  });
  const svc = nodes.find((n) => n.id === "service:a")!;
  expect(svc.data.counters).toEqual({ errors: 5, successes: 10 });
  expect(svc.data.rateOut).toBe(20);
  const quota = nodes.find((n) => n.id === "module:quota:q1")!;
  expect(quota.data.quota).toMatchObject({ used: 7, limit: 10 });
});
