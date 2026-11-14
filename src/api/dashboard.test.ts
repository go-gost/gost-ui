import { expect, test, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("../utils/require", () => ({ default: { get } }));

import { DASHBOARD_SNAPSHOT_PATH, getDashboardSnapshot } from "./dashboard";

test("requests the snapshot quietly", async () => {
  get.mockResolvedValue({ version: 1 });
  const signal = new AbortController().signal;
  await expect(getDashboardSnapshot(signal)).resolves.toEqual({ version: 1 });
  expect(get).toHaveBeenCalledWith(DASHBOARD_SNAPSHOT_PATH, { signal, noMsg: true });
});
