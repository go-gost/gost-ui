import { useState, useEffect, useRef } from "react";
import { ConfigProvider, theme } from "antd";
import Ctx from "./uitls/ctx";
import { init, logout, useGolstCofnig } from "./uitls/server";
import * as API from "./api";
import Home from "./Pages/Home";
import "./App.css";
import { configEvent } from "./uitls/events";

import zhCN from "antd/locale/zh_CN";
import Manage from "./Pages/Manage";

function App() {
  const gostInfo = useGolstCofnig();
  const [gostConfig, setGostConfig] = useState<any>(null);
  const [userTheme, setUserTheme] = useState<any>(null); // 用户主题
  const [isDark, setIsDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  const slef = useRef({
    updateConfig: () => {
      return API.getConfig().then((data) => {
        setGostConfig(data);
        return data;
      });
    },
    defaultTitle: document.title,
  });

  useEffect(() => {
    init();
    const apiUpdate = (reqConfig: any) => {
      console.log("reqConfig", reqConfig);
      if (reqConfig.url === API.apis.config) return;
      return slef.current.updateConfig();
    };
    const matchMedia = window.matchMedia("(prefers-color-scheme: dark)");
    const themeChange = (ev: MediaQueryListEvent) => {
      setIsDark(ev.matches);
    };
    matchMedia.addEventListener("change", themeChange);
    configEvent.on("apiUpdate", apiUpdate);
    return () => {
      configEvent.off("apiUpdate", apiUpdate);
      matchMedia.removeEventListener("change", themeChange);
    };
  }, []);

  useEffect(() => {
    if (gostInfo) {
      slef.current.updateConfig().then(() => {
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
        updateConfig: slef.current.updateConfig,
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
