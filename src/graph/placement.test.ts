import { expect, test } from "vitest";
import { layoutGraph } from "./layout";
import { resolvePositions } from "./placement";
import type { GraphEdge, GraphNode } from "./build";
import type { PositionMap } from "./positions";

const node = (id: string): GraphNode => ({
  id,
  position: { x: 0, y: 0 },
  data: { kind: "service", label: id },
});

test("an unsaved node is shifted off a saved card it would overlap", () => {
  const nodes = [node("service:a"), node("service:b")];
  const dagreB = layoutGraph(nodes, []).find((n) => n.id === "service:b")!
    .position;
  // Saved card sits exactly where auto-layout wants the new node.
  const saved: PositionMap = { "service:a": { ...dagreB } };

  const result = resolvePositions(nodes, [], saved);

  expect(result["service:a"]).toEqual(dagreB);
  expect(result["service:b"]).not.toEqual(dagreB);
});

test("saved positions are never rewritten", () => {
  const saved: PositionMap = { "service:a": { x: 777, y: 333 } };
  const result = resolvePositions([node("service:a")], [], saved);
  expect(result["service:a"]).toEqual({ x: 777, y: 333 });
});
