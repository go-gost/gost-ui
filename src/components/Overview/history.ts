export const MAX_POINTS = 120;

/** Structural subset of a dashboard history point. */
export interface HistoryInput {
  time: string;
  services: Record<
    string,
    { currentConns: number; inputBytes: number; outputBytes: number }
  >;
}

/** One derived sample: byte rates over the interval ending at `t`. */
export interface HistorySample {
  t: number;
  inBps: number;
  outBps: number;
  conns: number;
}

const sum = (point: HistoryInput) =>
  Object.values(point.services).reduce(
    (acc, svc) => ({
      conns: acc.conns + svc.currentConns,
      input: acc.input + svc.inputBytes,
      output: acc.output + svc.outputBytes,
    }),
    { conns: 0, input: 0, output: 0 }
  );

/**
 * Diffs cumulative byte counters into per-second rates. Points must have
 * increasing timestamps; duplicates and backwards jumps are skipped. The
 * result keeps the last `MAX_POINTS` samples.
 */
export function historySamples(history: HistoryInput[]): HistorySample[] {
  const sorted = [...history]
    .map((point) => ({ point, t: Date.parse(point.time) }))
    .filter(({ t }) => Number.isFinite(t))
    .sort((a, b) => a.t - b.t);

  const samples: HistorySample[] = [];
  let prev: { t: number; conns: number; input: number; output: number } | null =
    null;

  for (const { point, t } of sorted) {
    const totals = sum(point);
    if (prev) {
      const dt = (t - prev.t) / 1000;
      if (dt > 0) {
        samples.push({
          t,
          inBps: Math.max(0, (totals.input - prev.input) / dt),
          outBps: Math.max(0, (totals.output - prev.output) / dt),
          conns: totals.conns,
        });
        prev = { t, conns: totals.conns, input: totals.input, output: totals.output };
      }
    } else {
      prev = { t, conns: totals.conns, input: totals.input, output: totals.output };
    }
  }

  return samples.slice(-MAX_POINTS);
}
