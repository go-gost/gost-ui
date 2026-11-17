import { beforeEach, expect, test } from "vitest";
import {
  applyNodePositionChanges,
  loadPositions,
  mergePositions,
  positionKey,
  savePositions,
} from "./positions";

const store = new Map<string, string>();
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as unknown as Storage;

beforeEach(() => store.clear());

test("positions are keyed per API address", () => {
  expect(positionKey("http://a:1")).toBe("gost-ui:topology:http://a:1");
  expect(positionKey()).toBe("gost-ui:topology:-");
});

test("save and load", () => {
  savePositions("x", { "service:a": { x: 1, y: 2 } });
  expect(loadPositions("x")).toEqual({ "service:a": { x: 1, y: 2 } });
});

test("corrupt storage reads as empty", () => {
  savePositions("x", {});
  localStorage.setItem(positionKey("x"), "not json");
  expect(loadPositions("x")).toEqual({});
});

test("position changes replace a saved entry without mutating it", () => {
  const saved = { a: { x: 1, y: 1 }, b: { x: 2, y: 2 } };
  const next = applyNodePositionChanges(saved, [
    { type: "position", id: "a", position: { x: 9, y: 9 } } as never,
    { type: "dimensions", id: "b" } as never,
  ]);
  expect(next).toEqual({ a: { x: 9, y: 9 }, b: { x: 2, y: 2 } });
  expect(saved).toEqual({ a: { x: 1, y: 1 }, b: { x: 2, y: 2 } });
});

test("non-position changes keep the same saved object", () => {
  const saved = { a: { x: 1, y: 1 } };
  expect(
    applyNodePositionChanges(saved, [
      { type: "dimensions", id: "a" } as never,
    ])
  ).toBe(saved);
});

test("merge keeps saved entries and adds new ones", () => {
  const merged = mergePositions(
    { a: { x: 1, y: 1 } },
    [
      { id: "a", position: { x: 9, y: 9 } },
      { id: "b", position: { x: 2, y: 2 } },
    ]
  );
  expect(merged).toEqual({ a: { x: 1, y: 1 }, b: { x: 2, y: 2 } });
});
