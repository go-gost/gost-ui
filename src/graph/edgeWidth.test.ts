import { expect, test } from "vitest";
import { edgeWidth } from "./edgeFlow";

test("idle edges are thin and bursts widen up to a cap", () => {
  expect(edgeWidth(0)).toBeCloseTo(1.5);
  expect(edgeWidth(1024)).toBeGreaterThan(1.5);
  expect(edgeWidth(1e12)).toBeLessThanOrEqual(4);
  expect(edgeWidth(1e12)).toBeGreaterThan(3.9);
});
