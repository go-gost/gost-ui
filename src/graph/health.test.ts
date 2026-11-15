import { expect, test } from "vitest";
import { errorRatio, moodOf, quotaMood } from "./health";

test("ratio uses errors over errors plus successes", () => {
  expect(errorRatio({ errors: 20, successes: 1 })).toBeCloseTo(20 / 21);
  expect(errorRatio({ errors: 0, successes: 0 })).toBeNull();
  expect(errorRatio({ errors: 0, successes: 5 })).toBe(0);
});

test("moods follow the thresholds", () => {
  expect(moodOf({ errors: 0, successes: 0 })).toBe("idle");
  expect(moodOf({ errors: 0, successes: 10 })).toBe("healthy");
  expect(moodOf({ errors: 1, successes: 99 })).toBe("warn");
  expect(moodOf({ errors: 1, successes: 10 })).toBe("error");
  expect(moodOf({ errors: 1, successes: 1 })).toBe("dead");
});

test("dead wins over any ratio, including no traffic", () => {
  expect(moodOf({ errors: 0, successes: 0 }, true)).toBe("dead");
  expect(moodOf({ errors: 0, successes: 100 }, true)).toBe("dead");
});

test("a failed service with no traffic is dead, not idle", () => {
  expect(moodOf({ errors: 0, successes: 0 }, true)).not.toBe("idle");
});

test("quota moods", () => {
  expect(quotaMood({ blocked: true, used: 5 })).toBe("dead");
  expect(quotaMood({ expired: true, used: 5 })).toBe("warn");
  expect(quotaMood({ used: 5 })).toBe("healthy");
  expect(quotaMood({ used: 0 })).toBe("idle");
});
