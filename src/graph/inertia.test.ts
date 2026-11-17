import { expect, test } from "vitest";
import {
  clampVelocity,
  decayVelocity,
  dragVelocity,
  INERTIA_MIN_START_SPEED,
  speedOf,
  type PanSample,
} from "./inertia";

const samples = (): PanSample[] => [
  { t: 0, x: 0, y: 0 },
  { t: 40, x: 20, y: 10 },
  { t: 80, x: 60, y: 30 },
];

test("velocity uses only the tail of the drag", () => {
  // 80ms window includes the t=0 sample (end.t - t === windowMs).
  expect(dragVelocity(samples(), 85)).toEqual({ vx: 0.75, vy: 0.375 });
});

test("a stale release produces no glide", () => {
  expect(dragVelocity(samples(), 500)).toEqual({ vx: 0, vy: 0 });
});

test("clamping keeps direction and caps speed", () => {
  const clamped = clampVelocity({ vx: 10, vy: 0 }, 3);
  expect(speedOf(clamped)).toBeCloseTo(3);
  expect(clamped.vy).toBe(0);
});

test("friction decays below the start threshold", () => {
  let v = { vx: 2, vy: 0 };
  for (let i = 0; i < 120 && speedOf(v) >= INERTIA_MIN_START_SPEED; i++) {
    v = decayVelocity(v, 16.67);
  }
  expect(speedOf(v)).toBeLessThan(INERTIA_MIN_START_SPEED);
});
