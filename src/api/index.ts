import require from "../uitls/require";
import type * as Gost from "./types";

type Format = "json" | "yaml";

export const apis = {
  config: "/config",
  admissions: "/config/admissions",
  authers: "/config/authers",
  bypasses: "/config/bypasses",
  chains: "/config/chains",
  climiters: "/config/climiters",
  limiters: "/config/limiters",
  rlimiters: "/config/rlimiters",
  hops: "/config/hops",
  hosts: "/config/hosts",
  ingresses: "/config/ingresses",
  observers: "/config/observers",
  resolvers: "/config/resolvers",
  sds: "/config/sds",
  services: "/config/services",
};

export const getRESTfulApi = <T = any>(basePath: string) => {
  type G = Partial<T>;
  return {
    post: (data: G) => require.post(basePath, data),
    put: (id: string, data: G) => require.put(`${basePath}/${id}`, data),
    delete: (id: string) => require.delete(`${basePath}/${id}`),
  };
};

export const admissions = getRESTfulApi<Gost.AdmissionConfig>(
  apis["admissions"]
);
export const authers = getRESTfulApi<Gost.AdmissionConfig>(apis["authers"]);
export const bypasses = getRESTfulApi<Gost.BypassConfig>(apis["bypasses"]);
export const chains = getRESTfulApi<Gost.ChainConfig>(apis["chains"]);
export const climiters = getRESTfulApi<Gost.LimiterConfig>(apis["climiters"]);
export const limiters = getRESTfulApi<Gost.LimiterConfig>(apis["limiters"]);
export const rlimiters = getRESTfulApi<Gost.LimiterConfig>(apis["rlimiters"]);
export const hops = getRESTfulApi<Gost.HopConfig>(apis["hops"]);
export const hosts = getRESTfulApi<Gost.HostsConfig>(apis["hosts"]);
export const ingresses = getRESTfulApi<Gost.IngressConfig>(apis["ingresses"]);
export const resolvers = getRESTfulApi<Gost.ResolverConfig>(apis["resolvers"]);
export const services = getRESTfulApi<Gost.ServiceConfig>(apis["services"]);
export const sds = getRESTfulApi<Gost.ServiceConfig>(apis["sds"]);
export const observers = getRESTfulApi<Gost.ServiceConfig>(apis["observers"]);

// 获取当前config
export const getConfig = (format?: Format) => require.get(apis.config);

// 保存当前config到服务器
export const saveCofnig = (format: Format = "json", path?: string | null) =>
  require.post(apis.config, null, { params: { format, path }, noMsg: true } as any);