import { expect, test } from "vitest";
import { layoutGraph, nodeSize, placeNewNodes } from "./layout";
import type { GraphNode } from "./build";

const node = (id: string, kind: GraphNode["data"]["kind"]): GraphNode => ({
  id,
  position: { x: 0, y: 0 },
  data: { kind, label: id },
});

test("sizes are positive and kind-specific", () => {
  expect(nodeSize("service").w).toBeGreaterThan(0);
  expect(nodeSize("service").w).not.toBe(nodeSize("module").w);
});

test("layout assigns distinct positions left to right", () => {
  const nodes = layoutGraph(
    [node("service:a", "service"), node("chain:c", "chain")],
    [
      {
        id: "e",
        source: "service:a",
        target: "chain:c",
        kind: "chain",
        services: ["a"],
      },
    ]
  );
  const a = nodes.find((n) => n.id === "service:a")!;
  const c = nodes.find((n) => n.id === "chain:c")!;
  expect(a.position.x).toBeLessThan(c.position.x);
  expect(a.position).not.toEqual(c.position);
});

test("saved positions win and new nodes avoid them", () => {
  const nodes = [node("service:a", "service"), node("module:bypass:by", "module")];
  const placed = placeNewNodes(nodes, { "service:a": { x: 100, y: 100 } });
  expect(placed["service:a"]).toBeUndefined();
  expect(placed["module:bypass:by"]).toBeTruthy();
});
