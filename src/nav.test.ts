import { expect, test } from "vitest";
import { NAV_ORDER } from "./nav";

test("config is the default first nav item, overview second", () => {
  expect(NAV_ORDER).toEqual(["config", "overview"]);
});
