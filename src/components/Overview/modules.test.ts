import { expect, test } from "vitest";
import type { ModuleSnapshot } from "../../api/dashboard";
import { groupModules } from "./modules";

const mod = (kind: string, name: string): ModuleSnapshot => ({
  kind,
  name,
  stats: {
    calls: 0,
    hits: 0,
    misses: 0,
    errors: 0,
    inputBytes: 0,
    outputBytes: 0,
    latencySumMicros: 0,
    latencyCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cacheStores: 0,
  },
});

test("groups by known kind order, then name", () => {
  const groups = groupModules([
    mod("limiter_rate", "b"),
    mod("bypass", "z"),
    mod("bypass", "a"),
  ]);
  expect(groups.map((g) => g.kind)).toEqual(["bypass", "limiter_rate"]);
  expect(groups[0].rows.map((r) => r.name)).toEqual(["a", "z"]);
});

test("puts unknown kinds after known ones, alphabetically", () => {
  const groups = groupModules([mod("zeta", "x"), mod("bypass", "a"), mod("alpha", "x")]);
  expect(groups.map((g) => g.kind)).toEqual(["bypass", "alpha", "zeta"]);
});
