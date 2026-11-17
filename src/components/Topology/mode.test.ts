import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

const overview = read("../../Pages/Overview.tsx");
const topology = read("./index.tsx");
const csv = read("../../i18n/languages.csv");

test("overview has a cuttle-style edit toggle", () => {
  expect(overview).toMatch(/const \[editing, setEditing\]/);
  expect(overview).toContain("EditOutlined");
  expect(overview).toMatch(/aria-pressed=\{editing\}/);
  expect(overview).toContain('t("topology.edit")');
  expect(overview).toContain('t("topology.exitEdit")');
  expect(overview).toContain('t("topology.editPaused")');
});

test("topology gates dragging on edit mode", () => {
  expect(topology).toMatch(/editing: boolean/);
  expect(topology).toMatch(/nodesDraggable=\{editing\}/);
  expect(topology).toContain("deleteKeyCode={null}");
});

test("edit mode wires connect/disconnect through the config API", () => {
  expect(topology).toMatch(/onConnect=/);
  expect(topology).toContain("connectLink(");
  expect(read("../../graph/nodes.tsx")).toContain(
    "isConnectable={!!data.editable}"
  );
  const panel = read("./EditPanel.tsx");
  expect(panel).toContain("disconnectLink(");
  expect(read("../../utils/applyLinkChange.ts")).toContain(
    'configEvent.emit("apiUpdate")'
  );
});

test("mode strings are translated in both languages", () => {
  for (const key of [
    "topology.edit,",
    "topology.exitEdit,",
    "topology.editPaused,",
  ]) {
    expect(csv).toContain(key);
  }
});
