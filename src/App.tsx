import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ConfigProvider, message, theme } from "antd";
import {
  init,
  logout,
  useInfo,
  useServerConfig,
  useLocalConfig,
} from "./uitls/server";
import * as API from "./api";
import Home from "./Pages/Home";
import "./App.css";
import { configEvent } from "./uitls/events";

import zhCN from "antd/locale/zh_CN";
import Manage from "./Pages/Manage";
import { ServerComm } from "./api/local";
import Ctx from "./uitls/ctx";

function App() {
  const info = useInfo();
  // const [gostConfig, setGostConfig] = useState<any>(null);
  // const [localConfig, setLocalConfig] = useState<any>(null);
  const gostConfig = useServerConfig();
  const localConfig = useLocalConfig();
  const [userTheme, setUserTheme] = useState<any>(null); // 用户主题
  const [serverLoading, setServerLoading] = useState<any>(false);
  const [localLoading, setLocalLoading] = useState<any>(false);
  const [isDark, setIsDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const isLoading = useMemo(
    () => serverLoading || localLoading,
    [serverLoading, localLoading]
  );
  const slef = useRef({
    update: async () => {
      try {
        setServerLoading(true);
        setLocalLoading(true);
        const [l1, l2] = await Promise.all([
          API.getConfig(),
          slef.current.updateLocalConfig(useInfo.get()?.addr),
        ]);
        useServerConfig.set(l1 as any);
        useLocalConfig.set(l2);
        return [l1, l2];  
      } finally {
        setServerLoading(false);
        setLocalLoading(false);
      }
    },
    updateLocalConfig: async (key?: string) => {
      try {
        if (!key) useLocalConfig.set(null);
        setLocalLoading(true);
        const data = await ServerComm.getAllCacheConfig(key);
        const localConfig: any = {};
        data.forEach((item: any) => {
          const { _type_ } = item;
          const list = localConfig[_type_]
            ? localConfig[_type_]
            : (localConfig[_type_] = []);
          list.push(item);
        });
        return localConfig;
      } finally {
        setLocalLoading(false);
      }
    },
    defaultTitle: document.title,
  });

  useEffect(() => {
    init();
    const apiUpdate = async (reqConfig: any) => {
      if (reqConfig?.url === API.apis.config) return;
      return useServerConfig.set((await API.getConfig()) as any);
    };
    const localUpdate = async () => {
      return useLocalConfig.set(
        await slef.current.updateLocalConfig(useInfo.get()?.addr)
      );
    };
    const update = slef.current.update;
    const matchMedia = window.matchMedia("(prefers-color-scheme: dark)");
    const themeChange = (ev: MediaQueryListEvent) => {
      setIsDark(ev.matches);
    };
    configEvent.on("apiUpdate", apiUpdate);
    configEvent.on("localUpdate", localUpdate);
    configEvent.on("update", update);
    matchMedia.addEventListener("change", themeChange);
    return () => {
      configEvent.off("apiUpdate", apiUpdate);
      configEvent.off("localUpdate", localUpdate);
      configEvent.off("update", update);
      matchMedia.removeEventListener("change", themeChange);
    };
  }, []);

  useEffect(() => {
    if (info) {
      slef.current.update().then(([data]) => {
        // setGostConfig(data);
        useServerConfig.set(data);
        document.title = info.addr.replace(/^(https?:)?\/\//, "");
      });
    } else {
      document.title = slef.current.defaultTitle;
    }
  }, [info]);

  return (
    <Ctx.Provider
      value={{
        gostConfig,
        localConfig,
        isLoading,
      }}
    >
      <ConfigProvider
        theme={{ algorithm: isDark ? theme.darkAlgorithm : undefined }}
        locale={zhCN}
      >
        {info ? <Manage /> : <Home />}
      </ConfigProvider>
    </Ctx.Provider>
  );
}

export default App;
