import { expect, test } from "vitest";
import { phaseForStatus } from "./status";

test("maps HTTP status to a snapshot phase", () => {
  expect(phaseForStatus(200)).toBe("live");
  expect(phaseForStatus(404)).toBe("disabled");
  expect(phaseForStatus(401)).toBe("unauthorized");
  expect(phaseForStatus(403)).toBe("unauthorized");
  expect(phaseForStatus(500)).toBe("stale");
  expect(phaseForStatus(undefined)).toBe("stale");
});
