import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

// No jsdom in this repo; guard the reset wiring at the source level.
const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

const overview = read("../../Pages/Overview.tsx");
const topology = read("./index.tsx");

test("reset button bumps a key that Topology observes", () => {
  expect(overview).toMatch(/resetLayout\(info\?\.addr\)/);
  expect(overview).toMatch(/setResetKey/);
  expect(topology).toMatch(/resetKey/);
});

test("Topology reloads positions when the address or reset key changes", () => {
  expect(topology).toMatch(/loadPositions\(infoAddr\)/);
  expect(topology).toMatch(/\}, \[infoAddr, resetKey\]/);
});
