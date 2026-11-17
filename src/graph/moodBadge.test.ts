import { expect, test } from "vitest";
import { moodBadgeLabel } from "./health";

test("mood badge label includes the failure ratio", () => {
  expect(moodBadgeLabel("error", { errors: 2, successes: 8 })).toBe(
    "error 2/10"
  );
});

test("mood badge label stays short when counters are missing or empty", () => {
  expect(moodBadgeLabel("dead")).toBe("dead");
  expect(moodBadgeLabel("healthy", { errors: 0, successes: 0 })).toBe(
    "healthy"
  );
  expect(moodBadgeLabel("idle", { errors: 0, successes: 0 })).toBe("");
});
