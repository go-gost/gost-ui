import { expect, test } from "vitest";
import { nodeMood } from "./health";

test("blocked quota overrides a healthy traffic mood", () => {
  expect(
    nodeMood({ errors: 0, successes: 10 }, false, {
      used: 1,
      blocked: true,
      expired: false,
    })
  ).toBe("dead");
});

test("normal quota keeps the traffic mood", () => {
  expect(
    nodeMood({ errors: 1, successes: 9 }, false, {
      used: 1,
      blocked: false,
      expired: false,
    })
  ).toBe("error");
  expect(nodeMood({ errors: 0, successes: 1 }, false)).toBe("healthy");
});
