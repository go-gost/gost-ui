import { expect, test } from "vitest";
import { matchesSelection, selectionFilter } from "./connections";
import type { ConnectionRecord } from "../api/dashboard";

const rec = (over: Partial<ConnectionRecord>): ConnectionRecord => ({
  sid: "s",
  time: "2026-11-15T05:46:00Z",
  service: "svc",
  bytesIn: 0,
  bytesOut: 0,
  durationMs: 0,
  ...over,
});

test("service selection parses and matches", () => {
  const f = selectionFilter({ kind: "node", id: "service:svc" });
  expect(f).toEqual({ kind: "service", name: "svc" });
  expect(matchesSelection(rec({ service: "svc" }), f)).toBe(true);
  expect(matchesSelection(rec({ service: "other" }), f)).toBe(false);
});

test("chain selection matches r.chain", () => {
  const f = selectionFilter({ kind: "node", id: "chain:chain-0" });
  expect(f).toEqual({ kind: "chain", name: "chain-0" });
  expect(matchesSelection(rec({ chain: "chain-0" }), f)).toBe(true);
  expect(matchesSelection(rec({ service: "x" }), f)).toBe(false);
});

test("inline hop selection matches hop index + chain", () => {
  const f = selectionFilter({ kind: "node", id: "hop:chain-0/1" });
  expect(f).toEqual({
    kind: "hop",
    name: "hop:chain-0/1",
    hopIndex: 1,
    chainName: "chain-0",
  });
  const r1 = rec({
    path: [
      { chain: "chain-0", hop: 0, node: "a", addr: "1.2.3.4:80", connectMs: 1 },
      { chain: "chain-0", hop: 1, node: "b", addr: "1.2.3.5:80", connectMs: 1 },
    ],
  });
  const r2 = rec({
    path: [
      { chain: "other", hop: 1, node: "b", addr: "1.2.3.5:80", connectMs: 1 },
    ],
  });
  expect(matchesSelection(r1, f)).toBe(true);
  expect(matchesSelection(r2, f)).toBe(false);
});

test("registry hop selection returns other (no filter)", () => {
  expect(selectionFilter({ kind: "node", id: "hop:hop-0" })).toEqual({
    kind: "other",
  });
});

test("chain node and registry node match path[].node", () => {
  const f = selectionFilter({ kind: "node", id: "node:hop-0/node-0" });
  expect(f).toEqual({ kind: "node", name: "node-0" });
  const r = rec({
    path: [
      { chain: "chain-0", hop: 0, node: "node-0", addr: "x:1", connectMs: 1 },
    ],
  });
  expect(matchesSelection(r, f)).toBe(true);
});

test("inline chain node id picks the innermost node name", () => {
  const f = selectionFilter({
    kind: "node",
    id: "node:chain-0/0/hop-0/node-x",
  });
  expect(f).toEqual({ kind: "node", name: "node-x" });
});

test("unresolved, target and module selections return other", () => {
  expect(selectionFilter({ kind: "node", id: "unresolved:missing" })).toEqual({
    kind: "other",
  });
  expect(selectionFilter({ kind: "node", id: "target" })).toEqual({
    kind: "other",
  });
  expect(selectionFilter({ kind: "node", id: "module:bypass:by" })).toEqual({
    kind: "other",
  });
  expect(selectionFilter(null)).toEqual({ kind: "other" });
});
