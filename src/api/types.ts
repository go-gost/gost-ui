// 从 swagger.yaml 提取;

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
  redis: RedisLoader;
  reload: Duration;
  //   description: "DEPRECATED by whitelist since beta.4";
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
  redis: RedisLoader;
  reload: Duration;
};
export type BypassConfig = {
  file: FileLoader;
  http: HTTPLoader;
  matchers: string[];
  name: string;
  redis: RedisLoader;
  reload: Duration;
  //   description: "DEPRECATED by whitelist since beta.4";
  reverse: boolean;
  whitelist: boolean;
};
export type ChainConfig = {
  // description: 'REMOVED since beta.6\nSelector *SelectorConfig `yaml:",omitempty" json:"selector,omitempty"`';
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
  metrics: MetricsConfig;
  profiling: ProfilingConfig;
  recorders: RecorderConfig[];
  resolvers: ResolverConfig[];
  rlimiters: LimiterConfig[];
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
// description: "A Duration represents the elapsed time between two instants\nas an int64 nanosecond count. The representation limits the\nlargest representable duration to approximately 290 years.";
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
  bypass: string;
  bypasses: string[];
  host: string;
  name: string;
  protocol: string;
};
export type ForwarderConfig = {
  name: string;
  nodes: ForwardNodeConfig[];
  selector: SelectorConfig;
  //   description: "DEPRECATED by nodes since beta.4";
  targets: string[];
};
export type HTTPLoader = {
  timeout: Duration;
  url: string;
};
export type HandlerConfig = {
  auth: AuthConfig;
  auther: string;
  authers: string[];
  chain: string;
  chainGroup: ChainGroupConfig;
  ingress: string;
  metadata: Record<string, any>;
  retries: number;
  tls: TLSConfig;
  type: string;
};
export type HopConfig = {
  bypass: string;
  bypasses: string[];
  hosts: string;
  interface: string;
  name: string;
  nodes: NodeConfig[];
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
  redis: RedisLoader;
  reload: Duration;
};
export type IngressConfig = {
  file: FileLoader;
  http: HTTPLoader;
  name: string;
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
  // description: "Compress determines if the rotated log files should be compressed\nusing gzip. The default is not to perform compression.";
  compress: boolean;
  //   description: "LocalTime determines if the time used for formatting the timestamps in\nbackup files is the computer's local time. The default is to use UTC\ntime.";
  localTime: boolean;
  //   description: "MaxAge is the maximum number of days to retain old log files based on the\ntimestamp encoded in their filename.  Note that a day is defined as 24\nhours and may not exactly correspond to calendar days due to daylight\nsavings, leap seconds, etc. The default is not to remove old log files\nbased on age.";
  maxAge: number;
  //   description: "MaxBackups is the maximum number of old log files to retain.  The default\nis to retain all old log files (though MaxAge may still cause them to get\ndeleted.)";
  maxBackups: number;
  //   description: "MaxSize is the maximum size in megabytes of the log file before it gets\nrotated. It defaults to 100 megabytes.";
  maxSize: number;
};
export type MetricsConfig = {
  addr: string;
  path: string;
};
export type NameserverConfig = {
  addr: string;
  chain: string;
  clientIP: string;
  hostname: string;
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
  host: string;
  hosts: string;
  interface: string;
  metadata: Record<string, any>;
  name: string;
  protocol: string;
  resolver: string;
  sockopts: SockOptsConfig;
};
export type ProfilingConfig = {
  addr: string;
};
export type RecorderConfig = {
  file: FileRecorder;
  name: string;
  redis: RedisRecorder;
};
export type RecorderObject = {
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
  //   description: "DEPRECATED by metadata.interface since beta.5";
  interface: string;
  limiter: string;
  listener: ListenerConfig;
  metadata: Record<string, any>;
  name: string;
  recorders: RecorderObject[];
  resolver: string;
  rlimiter: string;
  sockopts: SockOptsConfig;
};
export type SockOptsConfig = {
  mark: number;
};
export type TLSConfig = {
  caFile: string;
  certFile: string;
  commonName: string;
  keyFile: string;
  organization: string;
  secure: boolean;
  serverName: string;
  validity: Duration;
};
