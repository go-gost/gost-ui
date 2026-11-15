import { expect, test } from "vitest";
import { diffActivity, emptyActivity, flowDuration } from "./activity";
import type { Snapshot } from "../api/dashboard";

const snap = (bytes: number, calls = 0): Snapshot =>
  ({
    version: 1,
    generatedAt: "",
    startedAt: "",
    sampleIntervalSeconds: 5,
    metricsEnabled: true,
    services: {
      a: {
        name: "a",
        state: "ready",
        stats: {
          totalConns: 1,
          currentConns: 1,
          inputBytes: bytes,
          outputBytes: 0,
          totalErrs: 0,
        },
        rate: { inputBytesPerSecond: 0, outputBytesPerSecond: 0 },
      },
    },
    modules: [
      {
        kind: "bypass",
        name: "by",
        stats: {
          calls,
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
      },
    ],
    chains: {},
    events: [],
    history: [],
  }) as unknown as Snapshot;

test("the first snapshot never animates", () => {
  expect(diffActivity(null, snap(1000), 1)).toEqual(emptyActivity());
});

test("a byte increase pulses the service", () => {
  const a = diffActivity(snap(1000), snap(1500), 2);
  expect(a.services.a).toEqual({ pulse: 2, bytes: 500 });
});

test("no increase means no pulse", () => {
  expect(diffActivity(snap(1000), snap(1000), 3).services.a).toBeUndefined();
});

test("counters going backwards reset instead of pulsing", () => {
  expect(diffActivity(snap(5000), snap(10), 4).services.a).toBeUndefined();
});

test("module calls increase pulses the module", () => {
  const a = diffActivity(snap(0, 10), snap(0, 12), 5);
  expect(a.modules["bypass:by"]).toEqual({ pulse: 5 });
});

test("flowDuration stays inside its bounds", () => {
  expect(flowDuration(0)).toBeCloseTo(0.9);
  expect(flowDuration(1e9)).toBeCloseTo(0.45);
});
