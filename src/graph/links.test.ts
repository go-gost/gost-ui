import { expect, test } from "vitest";
import type { Config } from "../api/types";
import type { GraphNodeData } from "./build";
import {
  connectLink,
  disconnectLink,
  linkKind,
  parseGraphId,
} from "./links";

const node = (kind: GraphNodeData["kind"]): GraphNodeData =>
  ({ kind, label: kind }) as GraphNodeData;

const config = (): Config =>
  ({
    services: [
      {
        name: "web",
        handler: { type: "http" },
        listener: { type: "tcp" },
        forwarder: {},
      },
    ],
    chains: [{ name: "c1", hops: [] }],
    hops: [{ name: "registry-h", nodes: [] }],
  }) as unknown as Config;

test("linkKind accepts only the four whitelisted pairs", () => {
  expect(linkKind(node("service"), node("chain"))).toBe("service-chain");
  expect(linkKind(node("chain"), node("hop"))).toBe("chain-hop");
  expect(linkKind(node("hop"), node("node"))).toBe("hop-node");
  expect(linkKind(node("service"), node("hop"))).toBe("service-forwarder");
  expect(linkKind(node("service"), node("module"))).toBeNull();
  expect(linkKind(node("node"), node("target"))).toBeNull();
  expect(linkKind(node("chain"), node("node"))).toBeNull();
});

test("parseGraphId splits kinds, names and chain scopes", () => {
  expect(parseGraphId("service:web")).toEqual({ kind: "service", name: "web" });
  expect(parseGraphId("hop:c1/inline-h")).toEqual({
    kind: "hop",
    name: "inline-h",
    chain: "c1",
  });
  expect(parseGraphId("node:h1/n1")).toEqual({
    kind: "node",
    name: "n1",
    chain: "h1",
  });
  expect(parseGraphId("garbage")).toBeNull();
});

test("service → chain writes handler.chain by default and listener.chain on request", () => {
  const byHandler = connectLink(config(), "service:web", "chain:c1")!;
  expect(byHandler.resource).toBe("services");
  expect(byHandler.config.services![0].handler.chain).toBe("c1");

  const byListener = connectLink(
    config(),
    "service:web",
    "chain:c1",
    "listener"
  )!;
  expect(byListener.config.services![0].listener.chain).toBe("c1");
});

test("chain → hop appends a registry hop reference", () => {
  const change = connectLink(config(), "chain:c1", "hop:registry-h")!;
  expect(change.resource).toBe("chains");
  expect(change.config.chains![0].hops).toEqual([{ name: "registry-h" }]);
  expect(connectLink(config(), "chain:c1", "hop:c1/inline-h")).toBeNull();
});

test("hop → node appends a node to a registry hop", () => {
  const change = connectLink(config(), "hop:registry-h", "node:n1")!;
  expect(change.resource).toBe("hops");
  expect(change.config.hops![0].nodes).toMatchObject([{ name: "n1" }]);
});

test("service → forwarder sets forwarder.hop", () => {
  const change = connectLink(config(), "service:web", "hop:registry-h")!;
  expect(change.resource).toBe("services");
  expect(change.config.services![0].forwarder.hop).toBe("registry-h");
});

test("duplicate and conflicting links are rejected without a change", () => {
  const withChain = config();
  withChain.services![0].handler.chain = "c1";
  expect(connectLink(withChain, "service:web", "chain:c1")).toBeNull();

  const withForwarderNodes = config();
  withForwarderNodes.services![0].forwarder.nodes = [
    { name: "fw", addr: ":1" } as never,
  ];
  expect(connectLink(withForwarderNodes, "service:web", "hop:h1")).toBeNull();

  expect(connectLink(config(), "service:web", "module:m1")).toBeNull();
  expect(connectLink(config(), "service:missing", "chain:c1")).toBeNull();
});

test("disconnectLink inverts each mapping and no-ops when absent", () => {
  const chained = connectLink(config(), "service:web", "chain:c1")!;
  const unchained = disconnectLink(chained.config, "service:web", "chain:c1")!;
  expect(unchained.config.services![0].handler.chain).toBe("");
  expect(disconnectLink(config(), "service:web", "chain:c1")).toBeNull();

  const hopped = connectLink(config(), "chain:c1", "hop:registry-h")!;
  const unhopped = disconnectLink(hopped.config, "chain:c1", "hop:registry-h")!;
  expect(unhopped.config.chains![0].hops).toEqual([]);

  const withNode = connectLink(config(), "hop:registry-h", "node:n1")!;
  const withoutNode = disconnectLink(
    withNode.config,
    "hop:registry-h",
    "node:n1"
  )!;
  expect(withoutNode.config.hops![0].nodes).toEqual([]);

  const forwarded = connectLink(config(), "service:web", "hop:registry-h")!;
  const unforwarded = disconnectLink(
    forwarded.config,
    "service:web",
    "hop:registry-h"
  )!;
  expect(unforwarded.config.services![0].forwarder.hop).toBe("");
});

test("connectLink does not mutate the input config", () => {
  const original = config();
  connectLink(original, "chain:c1", "hop:registry-h");
  expect(original.chains![0].hops).toEqual([]);
});
