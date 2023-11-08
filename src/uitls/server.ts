import { v4 } from "uuid";
import getUseValue from "./getUseValue";
import axios from "axios";
const gostServerKey = "__GOST_SERVER__";
const uselocalServerKey = "__USE_SERVER__";
const localServersKey = "__GOST_SERVERS__";

type GostApiConfig = {
  addr: string;
  auth?: {
    username: string;
    password: string;
  };
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

  // 本地保存的服务器信息
  if (window[uselocalServerKey]) {
    const server = await getLocalServer(window[uselocalServerKey]);
    await login(server);
  }
};

const verify = async (arg: GostApiConfig) => {
  return axios.head(arg.addr + "/config");
};

export const login = async (arg: GostApiConfig, saveLocal?: false) => {
  await verify(arg);
  window[gostServerKey] = arg;
  window.sessionStorage.setItem(gostServerKey, JSON.stringify(arg));
  if (saveLocal) {
    save2Local(arg, v4());
  }
};

export const logout = async () => {
  useGolstCofnig.set(null);
  window.sessionStorage.removeItem(gostServerKey);
};

export const save2Local = async (arg: GostApiConfig, id: string) => {
  let servers: any = {};
  try {
    let serversJson = localStorage.getItem(localServersKey);
    servers = serversJson ? JSON.parse(serversJson) : [];
  } catch (e) {}
  servers[id] = arg;
  localStorage.setItem(localServersKey, JSON.stringify(servers));
};

export const getLocalServer = async (id: string): Promise<GostApiConfig> => {
  let servers: any = {};
  try {
    let serversJson = localStorage.getItem(localServersKey);
    servers = serversJson ? JSON.parse(serversJson) : [];
  } catch (e) {}
  return servers[id];
};

// 把链接信息保存到本要，下次可以继续使用
