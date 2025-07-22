import getUseValue from "./getUseValue";
import axios from "axios";
import qs from "qs";
import { message } from "antd";
import { t } from "i18next";
import { ServerComm } from "../api/local";
import { Config } from "../api/types";
import {
  getJsonAtLocalStorage,
  getJsonAtSessionStorage,
  setJsonAtLocalStorage,
  setJsonAtSessionStorage,
} from "./storage";
import { apis } from "../api";

const gostServerKey = "__GOST_SERVER__";
// const uselocalServerKey = "__USE_SERVER__";
const settingKey = "__SETTINGS__";

export type GostApiConfig = {
  key?: string;
  /**
   * 服务器地址
   */
  addr: string;
  /**
   * 认证信息
   */
  auth?: {
    username: string;
    password: string;
  };
  /**
   * 最近登录时间
   */
  time?: number;
  /**
   * 自动保存到服务器(修改配置时)
   */
  autoSave?: boolean | null;
  /**
   * 自动保存的格式
   */
  saveFormat?: "json" | "yaml";
  /**
   * 自动保存的路径
   */
  savePath?: string | null;
  /**
   * 是否是本地保存的服务器信息
   */
  isLocal?: boolean | null;
};

export type Settings = {
  theme?: "dark" | "light" | "system";
};

const query = qs.parse(location.search, { ignoreQueryPrefix: true }) as {
  [key: string]: string;
};
if (query.use) {
  setJsonAtSessionStorage(gostServerKey, null);
}

let _useInfo: GostApiConfig | null = getJsonAtSessionStorage(gostServerKey); // 冗余_useInfo
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
    } else {
      logout();
    }
  } else if (query.addr || query.api) {
    // URL参数自动登录
    const { addr, api, username, password, save } = query;
    let _addr = api || addr;
    if (!/^(https?:)?\/\//.test(_addr)) {
      _addr = `${location.protocol}//` + _addr;
    } else if (/^\/\//.test(_addr)) {
      _addr = `${location.protocol}` + _addr;
    }
    const url = new URL(_addr);
    window.history.replaceState(null, "", location.pathname); // 清理url的参数
    return login(
      {
        addr: (url.origin + url.pathname).replace(/\/+$/, ""),
        auth: {
          username: username ?? url.username,
          password: password ?? url.password,
        },
      },
      save == "true" || save == "1"
    );
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
/**
 * 验证API授权信息
 * @param arg
 * @returns
 */
const verify = async (arg: GostApiConfig) => {
  const baseUrl = arg.addr.replace(/\/+$/, ""); // 去除尾部斜杠
  return axios
    .get(baseUrl + apis.config, {
      auth: arg.auth,
    })
    .catch((error) => {
      throw "verify error";
    });
};

export const login = async (arg: GostApiConfig, save?: boolean) => {
  try {
    await verify(arg);
    if (save) {
      arg.isLocal = true;
      useInfo.set(arg);
      await saveLocal(arg.addr, arg);
    } else {
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
