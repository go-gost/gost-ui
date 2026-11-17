import { expect, test } from "vitest";
import { edgeFlowState } from "./edgeFlow";
import type { GraphEdge } from "./build";

const edge = (kind: GraphEdge["kind"], services: string[]): GraphEdge => ({
  id: "e",
  source: "a",
  target: "b",
  kind,
  services,
});

test("a dead service turns its edges red and dashed", () => {
  expect(edgeFlowState(edge("forward", ["svc"]), new Set(["svc"]))).toEqual({
    error: true,
    color: "#dc2626",
    dashed: true,
  });
});

test("healthy edges keep the neutral stroke and structural dashes", () => {
  expect(edgeFlowState(edge("direct", ["svc"]), new Set())).toEqual({
    error: false,
    color: "#94a3b8",
    dashed: true,
  });
  expect(edgeFlowState(edge("forward", ["svc"]), new Set())).toEqual({
    error: false,
    color: "#94a3b8",
    dashed: false,
  });
});
