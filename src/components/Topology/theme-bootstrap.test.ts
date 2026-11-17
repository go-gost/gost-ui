import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const html = readFileSync(
  fileURLToPath(new URL("../../../index.html", import.meta.url)),
  "utf8"
);

test("theme is resolved before first paint to avoid a light flash", () => {
  expect(html).toContain("__SETTINGS__");
  expect(html).toContain("theme-dark");
  expect(html).toContain("prefers-color-scheme");
  // The bootstrap must run before the module entry mounts React.
  expect(html.indexOf("theme-dark")).toBeLessThan(
    html.indexOf('/src/main.tsx')
  );
});
