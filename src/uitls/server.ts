import getUseValue from "./getUseValue";
import axios from "axios";
import qs from "qs";
import { message } from "antd";
import { t } from "i18next";
import { ServerComm } from "../api/local";
import { Config } from "../api/types";
import { getJsonAtLocalStorage, getJsonAtSessionStorage, setJsonAtLocalStorage, setJsonAtSessionStorage } from "./storage";

const gostServerKey = "__GOST_SERVER__";
const uselocalServerKey = "__USE_SERVER__";
const settingKey = "__SETTINGS__";

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

export type Settings = {
  theme?: "dark" | "light" | "system";
};

const query = qs.parse(location.search, { ignoreQueryPrefix: true });
if(query.use) {
  setJsonAtSessionStorage(gostServerKey, null);
  window[uselocalServerKey] = query.use;
}

let _useInfo: GostApiConfig | null =  getJsonAtSessionStorage(gostServerKey); // 冗余_useInfo
export const useInfo = getUseValue<GostApiConfig | null>(
  function get() {
    return _useInfo;
  },
  function set(val) {
    _useInfo = val;
    setJsonAtSessionStorage(gostServerKey, val);
  }
);

// Object.defineProperty(window, gostServerKey, {
//   get: useInfo.get,
//   set: useInfo.set,
// });

export const useServerConfig = getUseValue<Partial<Config> | null>();
export const useLocalConfig = getUseValue<Partial<Config> | null>();
export const useSettings = getUseValue<Settings>(
  getJsonAtLocalStorage.bind(null, settingKey, {}),
  setJsonAtLocalStorage.bind(null, settingKey)
);

export const getInfo = (): GostApiConfig | null => useInfo.get();

export const userInit = async () => {
  // debugger;

  // 本地保存 (切换本地保存的服务)
  if (query.use) {
    const use = query.use as string;
    window.history.replaceState(null, "", location.pathname); // 清理url的参数
    const server = await getLocal(use);
    if (server) {
      server.isLocal = true;
      await login(server);
      server.time = Date.now();
      saveLocal(use, server);
      return;
    }else{
      logout();
    }
  }

  // 刷新页面
  const _useInfo = getInfo();
  if (_useInfo) {
    await verify(_useInfo);
    return;
  }



  // 刷新（会话保持）
  // const serverJson = sessionStorage.getItem(gostServerKey);
  // if (serverJson) {
  //   const server = JSON.parse(serverJson);
  //   await login(server);
  //   return true;
  // }

  // 本地保存的服务器信息
  // if (window[uselocalServerKey]) {
  //   const server = await getLocal(window[uselocalServerKey]);
  //   if (server) {
  //     server.isLocal = true;
  //     await login(server);
  //     if (server) {
  //       server.time = Date.now();
  //       saveLocal(window[uselocalServerKey], server);
  //     }
  //   }
  // }
};

const verify = async (arg: GostApiConfig) => {
  const baseUrl = arg.addr.replace(/\/+$/, "");
  return axios
    .get(baseUrl + "/config", {
      auth: arg.auth,
    })
    .catch((error) => {
      throw "verify error";
    });
};

export const login = async (arg: GostApiConfig, save?: false) => {
  try {
    await verify(arg);
    if (save) {
      arg.isLocal = true;
      useInfo.set(arg);
      await saveLocal(arg.addr, arg);
    }else{
      useInfo.set(arg);
    }
  } catch (e: any) {
    if (e === "verify error") {
      logout();
      message.error(e?.message || t("msg.connectionFailed"));
    }
    throw e;
  }
};

export const logout = async () => {
  useInfo.set(null);
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
