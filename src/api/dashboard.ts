import require from "../utils/require";

export const DASHBOARD_SNAPSHOT_PATH = "/dashboard/snapshot";

export interface ServiceStats {
  totalConns: number;
  currentConns: number;
  inputBytes: number;
  outputBytes: number;
  totalErrs: number;
}

export interface ServiceRate {
  inputBytesPerSecond: number;
  outputBytesPerSecond: number;
}

export interface ServiceSnapshot {
  name: string;
  state: string;
  stats: ServiceStats;
  rate: ServiceRate;
}

export interface LimiterStats {
  calls: number;
  allowed: number;
  denied: number;
  waitCalls: number;
  requested: number;
  granted: number;
}

export interface ModuleStats {
  calls: number;
  hits: number;
  misses: number;
  errors: number;
  inputBytes: number;
  outputBytes: number;
  latencySumMicros: number;
  latencyCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheStores: number;
  limiter?: LimiterStats;
}

export interface ModuleSnapshot {
  kind: string;
  name: string;
  service?: string;
  state?: string;
  stats: ModuleStats;
}

export interface ChainStats {
  connects: number;
  errors: number;
  connectDurationSumMicros: number;
  connectCount: number;
}

export interface NodeSnapshot {
  name: string;
  state?: string;
  stats: ChainStats;
}

export interface HopSnapshot {
  name: string;
  nodes: NodeSnapshot[];
}

export interface ChainSnapshot {
  name: string;
  hops?: HopSnapshot[];
  nodes?: NodeSnapshot[];
  stats: ChainStats;
}

export interface EventRecord {
  time: string;
  level: string;
  kind: string;
  name: string;
  service?: string;
  message: string;
}

export interface ServiceHistory {
  currentConns: number;
  inputBytes: number;
  outputBytes: number;
}

export interface HistoryPoint {
  time: string;
  services: Record<string, ServiceHistory>;
}

export interface Snapshot {
  version: number;
  generatedAt: string;
  startedAt: string;
  sampleIntervalSeconds: number;
  metricsEnabled: boolean;
  services: Record<string, ServiceSnapshot>;
  modules: ModuleSnapshot[];
  chains: Record<string, ChainSnapshot>;
  events: EventRecord[];
  history: HistoryPoint[];
}

/**
 * Reads the dashboard snapshot. `noMsg` keeps the 5 s poll silent; the
 * response interceptor returns the payload itself instead of the envelope.
 */
export const getDashboardSnapshot = (signal?: AbortSignal): Promise<Snapshot> =>
  require.get(DASHBOARD_SNAPSHOT_PATH, {
    signal,
    noMsg: true,
  } as any) as unknown as Promise<Snapshot>;

export interface PathHop {
  chain?: string;
  hop: number;
  node: string;
  addr: string;
  connectMs: number;
  err?: string;
}

export interface ConnectionRecord {
  sid: string;
  time: string;
  service: string;
  clientIP?: string;
  remoteAddr?: string;
  bytesIn: number;
  bytesOut: number;
  durationMs: number;
  chain?: string;
  path?: PathHop[];
  err?: string;
  labels?: Record<string, string>;
}

export interface GetConnectionsParams {
  service?: string;
  sid?: string;
  limit?: number;
  signal?: AbortSignal;
}

/** Reads the most recent connections (newest first). */
export const getDashboardConnections = (
  params: GetConnectionsParams = {}
): Promise<ConnectionRecord[]> => {
  const query: Record<string, string> = { limit: String(params.limit ?? 100) };
  if (params.service) query.service = params.service;
  if (params.sid) query.sid = params.sid;
  return require.get("/dashboard/connections", {
    params: query,
    signal: params.signal,
    noMsg: true,
  } as any) as unknown as Promise<ConnectionRecord[]>;
};
