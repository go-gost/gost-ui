const UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];

/** Compact byte size with binary units, e.g. `1.5 KiB`. */
export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  let value = n;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  const text =
    unit > 0 && value < 10 ? value.toFixed(1) : String(Math.round(value));
  return `${text} ${UNITS[unit]}`;
}

/** Byte rate per second, e.g. `2.0 KiB/s`. */
export function formatBps(n: number): string {
  return `${formatBytes(n)}/s`;
}

/** Coarse, human duration: `1d 2h`, `3h 4m`, `5m 6s`, `7s`. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  const total = Math.floor(seconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

/** One-decimal percentage; `—` when there is no denominator. */
export function formatPercent(part: number, total: number): string {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) {
    return "—";
  }
  return `${((part / total) * 100).toFixed(1)}%`;
}

/** Local wall clock as `HH:MM:SS`; `—` for an unparsable timestamp. */
export function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
}

/** Average latency in milliseconds; `—` when nothing was measured. */
export function formatLatency(sumMicros: number, count: number): string {
  if (!Number.isFinite(sumMicros) || !Number.isFinite(count) || count <= 0) {
    return "—";
  }
  const ms = sumMicros / count / 1000;
  return `${ms < 10 ? ms.toFixed(1) : Math.round(ms)} ms`;
}

/** Thousands-separated integer counters. */
export function formatCount(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US");
}
