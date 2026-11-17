import { expect, test } from "vitest";
import { emptyActivity } from "./activity";
import { pulsesByLabel } from "./nodePulse";

test("module pulses are keyed by the bare module name", () => {
  const pulses = pulsesByLabel({
    services: { svc: { pulse: 7, bytes: 100 } },
    modules: { "auther:auth-basic": { pulse: 9 } },
  });
  expect(pulses.get("svc")).toBe(7);
  expect(pulses.get("auth-basic")).toBe(9);
});

test("empty activity produces no pulses", () => {
  expect(pulsesByLabel(emptyActivity()).size).toBe(0);
});
