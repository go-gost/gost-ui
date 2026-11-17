import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import type { NodeKind } from "./build";
import { NODE_SURFACE, nodeHandleStyle } from "./nodeSurface";

test("every node kind has a themed surface with a dark-safe fallback", () => {
  for (const kind of Object.keys(NODE_SURFACE) as NodeKind[]) {
    expect(NODE_SURFACE[kind]).toContain(`--gost-node-${kind}-bg`);
    expect(NODE_SURFACE[kind]).toContain("--xy-node-background-color");
  }
});

test("stylesheet defines light and dark values for every surface", () => {
  const less = readFileSync(
    fileURLToPath(new URL("../index.less", import.meta.url)),
    "utf8"
  );
  for (const kind of Object.keys(NODE_SURFACE)) {
    const matches = less.match(new RegExp(`--gost-node-${kind}-bg:`, "g"));
    expect(matches?.length ?? 0).toBeGreaterThanOrEqual(2);
  }
  expect(less).toContain("--gost-topo-grid:");
});

test("handles stay mounted as anchors but are invisible", () => {
  const style = nodeHandleStyle("#0ea5e9", NODE_SURFACE.service);
  expect(style.opacity).toBe(0);
  expect(style.border).toContain("--gost-node-service-bg");
});
