import { beforeEach, expect, test, vi } from "vitest";
import { loadViewport, saveViewport } from "./viewport";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});

test("viewport survives a save/load round trip", () => {
  const vp = { x: -120, y: 44, zoom: 0.8 };
  saveViewport("addr", vp);
  expect(loadViewport("addr")).toEqual(vp);
});

test("malformed viewport is ignored", () => {
  store.set("gost-ui:topology:viewport:addr", JSON.stringify({ x: "bad" }));
  expect(loadViewport("addr")).toBeNull();
});
