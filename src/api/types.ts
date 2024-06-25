// 从 swagger.yaml 提取;(20240624)

export type APIConfig = {
  accesslog: boolean;
  addr: string;
  auth: AuthConfig;
  auther: string;
  pathPrefix: string;
};
export type AdmissionConfig = {
  file: FileLoader;
  http: HTTPLoader;
  matchers: string[];
  name: string;
  plugin: PluginConfig;
  redis: RedisLoader;
  reload: Duration;
  reverse: boolean;
  whitelist: boolean;
};
export type AuthConfig = {
  password: string;
  username: string;
};
export type AutherConfig = {
  auths: AuthConfig[];
  file: FileLoader;
  http: HTTPLoader;
  name: string;
  plugin: PluginConfig;
  redis: RedisLoader;
  reload: Duration;
};
export type BypassConfig = {
  file: FileLoader;
  http: HTTPLoader;
  matchers: string[];
  name: string;
  plugin: PluginConfig;
  redis: RedisLoader;
  reload: Duration;
  reverse: boolean;
  whitelist: boolean;
};
export type ChainConfig = {
  hops: HopConfig[];
  metadata: Record<string, any>;
  name: string;
};
export type ChainGroupConfig = {
  chains: string[];
  selector: SelectorConfig;
};
export type Config = {
  admissions: AdmissionConfig[];
  api: APIConfig;
  authers: AutherConfig[];
  bypasses: BypassConfig[];
  chains: ChainConfig[];
  climiters: LimiterConfig[];
  hops: HopConfig[];
  hosts: HostsConfig[];
  ingresses: IngressConfig[];
  limiters: LimiterConfig[];
  log: LogConfig;
  loggers: LoggerConfig[];
  metrics: MetricsConfig;
  observers: ObserverConfig[];
  profiling: ProfilingConfig;
  recorders: RecorderConfig[];
  resolvers: ResolverConfig[];
  rlimiters: LimiterConfig[];
  routers: RouterConfig[];
  sds: SDConfig[];
  services: ServiceConfig[];
  tls: TLSConfig;
};
export type ConnectorConfig = {
  auth: AuthConfig;
  metadata: Record<string, any>;
  tls: TLSConfig;
  type: string;
};
export type DialerConfig = {
  auth: AuthConfig;
  metadata: Record<string, any>;
  tls: TLSConfig;
  type: string;
};
export type Duration = number;
export type FileLoader = {
  path: string;
};
export type FileRecorder = {
  path: string;
  sep: string;
};
export type ForwardNodeConfig = {
  addr: string;
  auth: AuthConfig;
  bypass: string;
  bypasses: string[];
  filter: NodeFilterConfig;
  host: string;
  http: HTTPNodeConfig;
  metadata: Record<string, any>;
  name: string;
  network: string;
  path: string;
  protocol: string;
  tls: TLSNodeConfig;
};
export type ForwarderConfig = {
  hop: string;
  name: string;
  nodes: ForwardNodeConfig[];
  selector: SelectorConfig;
};
export type HTTPLoader = {
  timeout: Duration;
  url: string;
};
export type HTTPNodeConfig = {
  auth: AuthConfig;
  header: Record<string, string>;
  host: string;
  rewrite: HTTPURLRewriteConfig[];
};
export type HTTPRecorder = {
  timeout: Duration;
  url: string;
};
export type HTTPURLRewriteConfig = {
  Match: string;
  Replacement: string;
};
export type HandlerConfig = {
  auth: AuthConfig;
  auther: string;
  authers: string[];
  chain: string;
  chainGroup: ChainGroupConfig;
  limiter: string;
  metadata: Record<string, any>;
  observer: string;
  retries: number;
  tls: TLSConfig;
  type: string;
};
export type HopConfig = {
  bypass: string;
  bypasses: string[];
  file: FileLoader;
  hosts: string;
  http: HTTPLoader;
  interface: string;
  name: string;
  nodes: NodeConfig[];
  plugin: PluginConfig;
  redis: RedisLoader;
  reload: Duration;
  resolver: string;
  selector: SelectorConfig;
  sockopts: SockOptsConfig;
};
export type HostMappingConfig = {
  aliases: string[];
  hostname: string;
  ip: string;
};
export type HostsConfig = {
  file: FileLoader;
  http: HTTPLoader;
  mappings: HostMappingConfig[];
  name: string;
  plugin: PluginConfig;
  redis: RedisLoader;
  reload: Duration;
};
export type IngressConfig = {
  file: FileLoader;
  http: HTTPLoader;
  name: string;
  plugin: PluginConfig;
  redis: RedisLoader;
  reload: Duration;
  rules: IngressRuleConfig[];
};
export type IngressRuleConfig = {
  endpoint: string;
  hostname: string;
};
export type LimiterConfig = {
  file: FileLoader;
  http: HTTPLoader;
  limits: string[];
  name: string;
  plugin: PluginConfig;
  redis: RedisLoader;
  reload: Duration;
};
export type ListenerConfig = {
  auth: AuthConfig;
  auther: string;
  authers: string[];
  chain: string;
  chainGroup: ChainGroupConfig;
  metadata: Record<string, any>;
  tls: TLSConfig;
  type: string;
};
export type LogConfig = {
  format: string;
  level: string;
  output: string;
  rotation: LogRotationConfig;
};
export type LogRotationConfig = {
  compress: boolean;
  localTime: boolean;
  maxAge: number;
  maxBackups: number;
  maxSize: number;
};
export type LoggerConfig = {
  log: LogConfig;
  name: string;
};
export type MetricsConfig = {
  addr: string;
  auth: AuthConfig;
  auther: string;
  path: string;
};
export type NameserverConfig = {
  addr: string;
  async: boolean;
  chain: string;
  clientIP: string;
  hostname: string;
  only: string;
  prefer: string;
  timeout: Duration;
  ttl: Duration;
};
export type NodeConfig = {
  addr: string;
  bypass: string;
  bypasses: string[];
  connector: ConnectorConfig;
  dialer: DialerConfig;
  filter: NodeFilterConfig;
  hosts: string;
  http: HTTPNodeConfig;
  interface: string;
  metadata: Record<string, any>;
  name: string;
  network: string;
  resolver: string;
  sockopts: SockOptsConfig;
  tls: TLSNodeConfig;
};
export type NodeFilterConfig = {
  host: string;
  path: string;
  protocol: string;
};
export type ObserverConfig = {
  name: string;
  plugin: PluginConfig;
};
export type PluginConfig = {
  addr: string;
  timeout: Duration;
  tls: TLSConfig;
  token: string;
  type: string;
};
export type ProfilingConfig = {
  addr: string;
};
export type RecorderConfig = {
  file: FileRecorder;
  http: HTTPRecorder;
  name: string;
  plugin: PluginConfig;
  redis: RedisRecorder;
  tcp: TCPRecorder;
};
export type RecorderObject = {
  Metadata: Record<string, any>;
  name: string;
  record: string;
};
export type RedisLoader = {
  addr: string;
  db: number;
  key: string;
  password: string;
  type: string;
};
export type RedisRecorder = {
  addr: string;
  db: number;
  key: string;
  password: string;
  type: string;
};
export type ResolverConfig = {
  name: string;
  nameservers: NameserverConfig[];
  plugin: PluginConfig;
};
export type RouterConfig = {
  file: FileLoader;
  http: HTTPLoader;
  name: string;
  plugin: PluginConfig;
  redis: RedisLoader;
  reload: Duration;
  routes: RouterRouteConfig[];
};
export type RouterRouteConfig = {
  gateway: string;
  net: string;
};
export type SDConfig = {
  name: string;
  plugin: PluginConfig;
};
export type SelectorConfig = {
  failTimeout: Duration;
  maxFails: number;
  strategy: string;
};
export type ServiceConfig = {
  addr: string;
  admission: string;
  admissions: string[];
  bypass: string;
  bypasses: string[];
  climiter: string;
  forwarder: ForwarderConfig;
  handler: HandlerConfig;
  hosts: string;
  interface: string;
  limiter: string;
  listener: ListenerConfig;
  logger: string;
  loggers: string[];
  metadata: Record<string, any>;
  name: string;
  observer: string;
  recorders: RecorderObject[];
  resolver: string;
  rlimiter: string;
  sockopts: SockOptsConfig;
  status: ServiceStatus;
};
export type ServiceEvent = {
  msg: string;
  time: number;
};
export type ServiceStats = {
  currentConns: number;
  inputBytes: number;
  outputBytes: number;
  totalConns: number;
  totalErrs: number;
};
export type ServiceStatus = {
  createTime: number;
  events: ServiceEvent[];
  state: string;
  stats: ServiceStats;
};
export type SockOptsConfig = {
  mark: number;
};
export type TCPRecorder = {
  addr: string;
  timeout: Duration;
};
export type TLSConfig = {
  caFile: string;
  certFile: string;
  commonName: string;
  keyFile: string;
  options: TLSOptions;
  organization: string;
  secure: boolean;
  serverName: string;
  validity: Duration;
};
export type TLSNodeConfig = {
  options: TLSOptions;
  secure: boolean;
  serverName: string;
};
export type TLSOptions = {
  cipherSuites: string[];
  maxVersion: string;
  minVersion: string;
};
