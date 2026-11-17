import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

// The repo has no jsdom / @testing-library, so these tests guard the two
// source-level contracts that make the topology diagram theme-aware. They are
// intentionally narrow: a regression here silently breaks dark mode because
// React Flow's dark CSS variables and antd's CSS variables are both opt-in.
const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

const topology = read("./index.tsx");
const nodes = read("../../graph/nodes.tsx");

test("ReactFlow receives an explicit color mode from the app theme", () => {
  expect(topology).toMatch(/useIsDark\(\)/);
  expect(topology).toMatch(/colorMode\s*=\s*\{/);
});

test("custom node surfaces follow ReactFlow theme variables", () => {
  // antd CSS variables are not emitted (ConfigProvider has no cssVar: true),
  // so referencing them leaves an always-white node card in dark mode.
  expect(nodes).not.toContain("--ant-color-bg-elevated");
  expect(nodes).not.toContain("--ant-color-error-bg");
  expect(nodes).toContain("--xy-node-background-color");
  expect(nodes).toContain("--xy-node-color");
});
