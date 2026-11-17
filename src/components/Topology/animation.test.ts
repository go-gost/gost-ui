import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

test("animation preference is persisted and toggled in the overview toolbar", () => {
  expect(read("../../utils/server.ts")).toMatch(/animation\?: boolean/);
  const overview = read("../../Pages/Overview.tsx");
  expect(overview).toMatch(/useSettings/);
  expect(overview).toMatch(/topology\.animation/);
  expect(read("../../i18n/languages.csv")).toContain("topology.animation,");
});

test("node flash keyframes are disabled under reduced motion", () => {
  const less = read("../../index.less");
  expect(less).toContain("@keyframes g-node-flash");
  expect(less).toContain("prefers-reduced-motion");
});
