import { v4 } from "uuid";
import getUseValue from "./getUseValue";
import axios from "axios";
import qs from "qs";
const gostServerKey = "__GOST_SERVER__";
const uselocalServerKey = "__USE_SERVER__";
const localServersKey = "__GOST_SERVERS__";

export type GostApiConfig = {
  addr: string;
  auth?: {
    username: string;
    password: string;
  };
  time?: number;
};

export const useGolstCofnig = getUseValue<GostApiConfig | null>();

Object.defineProperty(window, gostServerKey, {
  get: useGolstCofnig.get,
  set: useGolstCofnig.set,
});

export const getGost = (): GostApiConfig | null => useGolstCofnig.get();

export const init = async () => {
  // 内存
  if (window[gostServerKey]) return true;

  // sessionStorage
  const serverJson = sessionStorage.getItem(gostServerKey);
  if (serverJson) {
    const server = JSON.parse(serverJson);
    await login(server);
    return true;
  }

  const query = qs.parse(location.search, { ignoreQueryPrefix: true });
  if (query.use) {
    window[uselocalServerKey] = query.use;
    window.history.replaceState(null, "", location.pathname);
  }

  // 本地保存的服务器信息
  if (window[uselocalServerKey]) {
    const server = await getLocal(window[uselocalServerKey]);
    if (server) {
      await login(server);
      if (server) {
        server.time = Date.now();
        saveLocal(window[uselocalServerKey], server);
      }
    }
  }
};

const verify = async (arg: GostApiConfig) => {
  const baseUrl = arg.addr.replace(/\/+$/, "");
  return axios.get(baseUrl + "/config", {
    auth: arg.auth
  });
};

export const login = async (arg: GostApiConfig, save?: false) => {
  await verify(arg);
  window[gostServerKey] = arg;
  window.sessionStorage.setItem(gostServerKey, JSON.stringify(arg));
  if (save) {
    saveLocal(arg.addr, arg);
  }
};

export const logout = async () => {
  useGolstCofnig.set(null);
  window.sessionStorage.removeItem(gostServerKey);
};

export const saveLocal = async (id: string, arg: GostApiConfig) => {
  let servers: Record<string, GostApiConfig> = {};
  try {
    servers = await getLocalServers();
  } catch (e) {
    /* empty */
  }
  servers[id] = { ...arg, time: Date.now() };
  localStorage.setItem(localServersKey, JSON.stringify(servers));
};

export const getLocal = async (
  id: string
): Promise<GostApiConfig | undefined> => {
  const servers = await getLocalServers();
  const server = servers[id];
  return server;
};

export const deleteLocal = async (id: string) => {
  let servers: Record<string, GostApiConfig> = {};
  try {
    servers = await getLocalServers();
  } catch (e) {
    /* empty */
  }
  delete servers[id];
  localStorage.setItem(localServersKey, JSON.stringify(servers));
};

export const getLocalServers = async (): Promise<
  Record<string, GostApiConfig>
> => {
  try {
    const serversJson = localStorage.getItem(localServersKey);
    const servers = serversJson ? JSON.parse(serversJson) : {};
    return servers;
  } catch (e) {
    return {};
  }
};

// 把链接信息保存到本要，下次可以继续使用
