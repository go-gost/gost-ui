export type SnapshotPhase =
  | "loading"
  | "live"
  | "stale"
  | "disabled"
  | "unauthorized";

/** 404 = dashboard disabled, 401/403 = auther rejected, anything else = stale data. */
export function phaseForStatus(status: number | undefined): SnapshotPhase {
  if (status === 200) return "live";
  if (status === 404) return "disabled";
  if (status === 401 || status === 403) return "unauthorized";
  return "stale";
}
