import * as API from ".";
import * as LocalApi from "./local";

type Module = {
  name: string;
  keyName: string;
  title: string;
  subTitle?: string;
  api: ReturnType<typeof API.getRESTfulApi>;
  localApi?: LocalApi.GostCommit;
  rowKey?: string;
};

const getAttr = (keyName: string) => ({
  keyName,
  api: (API as any)[keyName],
  localApi: (LocalApi as any)[keyName],
  rowKey: "name",
});

const modules: Module[] = [
  {
    name: "admission",
    title: "准入控制器(Admission)",
    subTitle: "准入控制器",
    ...getAttr("admissions"),
  },
  {
    name: "auther",
    title: "认证器(Auther)",
    subTitle: "认证器",
    ...getAttr("authers"),
  },
  {
    name: "bypass",
    title: "分流器(Bypass)",
    subTitle: "分流器",
    ...getAttr("bypasses"),
  },
  {
    name: "chain",
    title: "转发链(Chain)",
    subTitle: "转发链",
    // localApi: (LocalApi as any)['chains'],
    ...getAttr("chains"),
  },
  {
    name: "climiter",
    title: "并发连接数限制",
    subTitle: "",
    ...getAttr("climiters"),
  },
  {
    name: "limiter",
    title: "流量速率限制",
    subTitle: "",
    ...getAttr("limiters"),
  },
  {
    name: "rlimiter",
    title: "请求速率限制",
    subTitle: "",
    ...getAttr("rlimiters"),
  },
  {
    name: "hop",
    title: "跳跃点(Hop)",
    subTitle: "跳跃点",
    ...getAttr("hops"),
  },
  {
    name: "host",
    title: "主机映射器(Hosts)",
    subTitle: "主机映射器",
    ...getAttr("hosts"),
  },
  {
    name: "ingress",
    title: "Ingress",
    subTitle: "Ingress",
    ...getAttr("ingresses"),
  },
  {
    name: "resolver",
    title: "域名解析器(Resolver)",
    subTitle: "域名解析器",
    ...getAttr("resolvers"),
  },
  {
    name: "service",
    title: "服务(Service)",
    subTitle: "服务",
    ...getAttr("services"),
    // localApi: (API as any)['services'],
    // localApi: (LocalApi as any)['services'],
    // localApi: (LocalApi as any)['services'],
  },
];

export const getModule = (name: string) =>
  modules.find((item) => item.name === name);

export default modules;
