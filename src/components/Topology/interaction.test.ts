import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

const topology = read("./index.tsx");
const detail = read("./Detail.tsx");
const overview = read("../../Pages/Overview.tsx");
const nodes = read("../../graph/nodes.tsx");
const edges = read("../../graph/edges.tsx");

test("pan inertia and viewport persistence are wired into ReactFlow", () => {
  expect(topology).toMatch(/dragVelocity/);
  expect(topology).toMatch(/onMoveStart/);
  expect(topology).toMatch(/onWheelCapture/);
  expect(topology).toMatch(/loadViewport/);
  expect(topology).toMatch(/saveViewport/);
});

test("the connection panel offers an errors-only filter", () => {
  expect(detail).toMatch(/errorsOnly/);
  expect(detail).toMatch(/aria-pressed/);
  expect(read("../../i18n/languages.csv")).toContain(
    "topology.connections.errorsOnly,"
  );
});

test("empty topology and quota mood are rendered", () => {
  expect(overview).toMatch(/topology\.empty/);
  expect(nodes).toMatch(/nodeMood\(/);
});

test("edge width scales with traffic", () => {
  expect(topology).toMatch(/width: edgeWidth\(/);
  expect(edges).toMatch(/flow\?\.width/);
});

test("the layout-reset control is gone", () => {
  expect(overview).not.toContain("resetLayout");
  expect(topology).not.toContain("resetKey");
  expect(read("../../i18n/languages.csv")).not.toContain(
    "topology.resetLayout,"
  );
});
