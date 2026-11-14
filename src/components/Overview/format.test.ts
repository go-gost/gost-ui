import { expect, test } from "vitest";
import {
  formatBps,
  formatBytes,
  formatClock,
  formatCount,
  formatDuration,
  formatLatency,
  formatPercent,
} from "./format";

test("formatBytes", () => {
  expect(formatBytes(0)).toBe("0 B");
  expect(formatBytes(512)).toBe("512 B");
  expect(formatBytes(1024)).toBe("1.0 KiB");
  expect(formatBytes(1536)).toBe("1.5 KiB");
  expect(formatBytes(10 * 1024)).toBe("10 KiB");
  expect(formatBytes(1024 ** 3)).toBe("1.0 GiB");
  expect(formatBytes(Number.NaN)).toBe("0 B");
});

test("formatBps", () => {
  expect(formatBps(2048)).toBe("2.0 KiB/s");
});

test("formatDuration", () => {
  expect(formatDuration(0)).toBe("0s");
  expect(formatDuration(7)).toBe("7s");
  expect(formatDuration(306)).toBe("5m 6s");
  expect(formatDuration(11040)).toBe("3h 4m");
  expect(formatDuration(93784)).toBe("1d 2h");
  expect(formatDuration(-5)).toBe("0s");
});

test("formatPercent", () => {
  expect(formatPercent(0, 0)).toBe("—");
  expect(formatPercent(1, 3)).toBe("33.3%");
});

test("formatClock uses local time and rejects invalid input", () => {
  expect(formatClock(new Date(2026, 0, 2, 3, 4, 5).toISOString())).toBe(
    "03:04:05"
  );
  expect(formatClock("nope")).toBe("—");
});

test("formatLatency", () => {
  expect(formatLatency(0, 0)).toBe("—");
  expect(formatLatency(4500, 2)).toBe("2.3 ms");
  expect(formatLatency(400, 1)).toBe("0.4 ms");
});

test("formatCount", () => {
  expect(formatCount(1234)).toBe("1,234");
});
