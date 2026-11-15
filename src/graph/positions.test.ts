import { beforeEach, expect, test } from "vitest";
import {
  clearPositions,
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

test("save, load and clear", () => {
  savePositions("x", { "service:a": { x: 1, y: 2 } });
  expect(loadPositions("x")).toEqual({ "service:a": { x: 1, y: 2 } });
  clearPositions("x");
  expect(loadPositions("x")).toEqual({});
});

test("corrupt storage reads as empty", () => {
  savePositions("x", {});
  localStorage.setItem(positionKey("x"), "not json");
  expect(loadPositions("x")).toEqual({});
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
