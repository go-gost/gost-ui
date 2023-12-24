import getUseValue from "./getUseValue";
import axios from "axios";
import qs from "qs";
import { message } from "antd";
import { ServerComm } from "../api/local";
const gostServerKey = "__GOST_SERVER__";
const uselocalServerKey = "__USE_SERVER__";

export type GostApiConfig = {
  key?: string;
  addr: string;
  auth?: {
    username: string;
    password: string;
  };
  time?: number;
  autoSave?: boolean | null;
  saveFormat?: "json" | "yaml";
  savePath?: string | null;
  isLocal?: boolean | null;
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
      server.isLocal = true;
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
    auth: arg.auth,
  });
};

export const login = async (arg: GostApiConfig, save?: false) => {
  try {
    await verify(arg);
    window[gostServerKey] = arg;
    window.sessionStorage.setItem(gostServerKey, JSON.stringify(arg));
    if (save) {
      arg.isLocal = true;
      window[gostServerKey] = arg
      await saveLocal(arg.addr, arg);
    }
  } catch (e: any) {
    // console.log(e);
    message.error(e?.message || "链接失败");
    throw e;
  }
};

export const logout = async () => {
  useGolstCofnig.set(null);
  window.sessionStorage.removeItem(gostServerKey);
};

export const saveLocal = async (id: string, arg: GostApiConfig) => {
  return ServerComm.setServer({ ...arg, isLocal: true, time: Date.now() });
};

export const getLocal = async (
  id: string
): Promise<GostApiConfig | undefined> => {
  return ServerComm.getServer(id);
};

export const deleteLocal = async (id: string) => {
  return ServerComm.deleteServer(id);
};

export const getLocalServers = async (): Promise<
  // Record<string, GostApiConfig>
  GostApiConfig[]
> => {
  return ServerComm.getAllServer();
};

// 把链接信息保存到本要，下次可以继续使用
