import { expect, test } from "vitest";
import { historySamples, MAX_POINTS, type HistoryInput } from "./history";

const pt = (
  t: number,
  input: number,
  output: number,
  conns: number
): HistoryInput => ({
  time: new Date(t).toISOString(),
  services: {
    svc: { currentConns: conns, inputBytes: input, outputBytes: output },
  },
});

test("no samples without two points", () => {
  expect(historySamples([])).toEqual([]);
  expect(historySamples([pt(0, 0, 0, 1)])).toEqual([]);
});

test("diffs byte counters and sums services", () => {
  const s = historySamples([
    {
      time: new Date(0).toISOString(),
      services: {
        a: { currentConns: 1, inputBytes: 0, outputBytes: 0 },
      },
    },
    {
      time: new Date(5000).toISOString(),
      services: {
        a: { currentConns: 2, inputBytes: 3000, outputBytes: 6000 },
      },
    },
    {
      time: new Date(10000).toISOString(),
      services: {
        a: { currentConns: 3, inputBytes: 5000, outputBytes: 10000 },
      },
    },
  ]);
  expect(s).toEqual([
    { t: 5000, inBps: 600, outBps: 1200, conns: 2 },
    { t: 10000, inBps: 400, outBps: 800, conns: 3 },
  ]);
});

test("skips duplicate timestamps", () => {
  expect(historySamples([pt(0, 0, 0, 1), pt(0, 10, 10, 1)])).toEqual([]);
});

test("caps at MAX_POINTS", () => {
  const points: HistoryInput[] = [];
  for (let i = 0; i <= 130; i++) {
    points.push(pt(i * 1000, i * 1000, i * 2000, i));
  }
  expect(historySamples(points)).toHaveLength(MAX_POINTS);
});
