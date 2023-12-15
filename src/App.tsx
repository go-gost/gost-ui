import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ConfigProvider, theme } from "antd";
import Ctx from "./uitls/ctx";
import { init, logout, useGolstCofnig } from "./uitls/server";
import * as API from "./api";
import Home from "./Pages/Home";
import "./App.css";
import { configEvent } from "./uitls/events";

import zhCN from "antd/locale/zh_CN";
import Manage from "./Pages/Manage";
import { ServerComm } from "./api/local";

function App() {
  const gostInfo = useGolstCofnig();
  const [gostConfig, setGostConfig] = useState<any>(null);
  const [localConfig, setLocalConfig] = useState<any>(null);
  const [userTheme, setUserTheme] = useState<any>(null); // 用户主题
  const [isDark, setIsDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  const slef = useRef({
    update: async () => {
      console.log("update");
      const [l1, l2] = await Promise.all([
        API.getConfig(),
        slef.current.updateLocalConfig(useGolstCofnig.get()?.addr),
      ]);
      setGostConfig(l1);
      setLocalConfig(l2);
      return [l1, l2];
    },
    updateLocalConfig: (key?: string) => {
      if (!key) setLocalConfig(null);
      return ServerComm.getAllCacheConfig(key).then((data) => {
        const localConfig: any = {};
        data.forEach((item: any) => {
          const { _type_ } = item;
          const list = localConfig[_type_]
            ? localConfig[_type_]
            : (localConfig[_type_] = []);
          list.push(item);
        });
        // setLocalConfig(localConfig);
        return localConfig;
      });
    },
    defaultTitle: document.title,
  });

  useEffect(() => {
    init();
    const apiUpdate = async (reqConfig: any) => {
      console.log("reqConfig", reqConfig);
      if (reqConfig.url === API.apis.config) return;
      return setGostConfig(await API.getConfig());
    };
    const localUpdate = async () => {
      console.log("localUpdate");
      return setLocalConfig(
        await slef.current.updateLocalConfig(useGolstCofnig.get()?.addr)
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
    if (gostInfo) {
      slef.current.update().then(([data]) => {
        setGostConfig(data);
        document.title = gostInfo.addr.replace(/^(https?:)?\/\//, "");
      });
    } else {
      document.title = slef.current.defaultTitle;
    }
  }, [gostInfo]);

  return (
    <Ctx.Provider
      value={{
        gostConfig,
        localConfig,
        logout,
      }}
    >
      <ConfigProvider
        theme={{ algorithm: isDark ? theme.darkAlgorithm : undefined }}
        locale={zhCN}
      >
        {gostInfo ? <Manage /> : <Home />}
      </ConfigProvider>
    </Ctx.Provider>
  );
}

export default App;
