import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useLayoutEffect,
  useContext,
} from "react";
import { ConfigProvider, message, theme, App as AntdApp, Spin } from "antd";
import {
  userInit,
  logout,
  useInfo,
  useServerConfig,
  useLocalConfig,
} from "./utils/server";
import * as API from "./api";
import Home from "./Pages/Home";
import "./App.css";
import { configEvent } from "./utils/events";

import zhCN from "antd/locale/zh_CN";
import enGB from "antd/locale/en_GB";
import { ServerComm } from "./api/local";
import Ctx from "./utils/ctx";
import { useIsDark } from "./utils/useTheme";
import "./utils/i18n";
import { useTranslation } from "react-i18next";

const Manage = React.lazy(() => import("./Pages/Manage"));

const AntdGlobal: React.FC<{ children: React.ReactNode }> = (props) => {
  const { locale, theme } = useContext(ConfigProvider.ConfigContext);
  useLayoutEffect(() => {
    // 处理切换主题后 弹层主题不正常的问题
    ConfigProvider.config({
      theme: theme,
      holderRender: (children) => (
        <ConfigProvider theme={theme}>{children}</ConfigProvider>
      ),
    });
  }, [locale, theme]);

  return <AntdApp>{props.children}</AntdApp>;
};

function App() {
  const info = useInfo();
  const { t, i18n } = useTranslation();
  // const [gostConfig, setGostConfig] = useState<any>(null);
  // const [localConfig, setLocalConfig] = useState<any>(null);
  const gostConfig = useServerConfig();
  const localConfig = useLocalConfig();
  const isDark = useIsDark();
  // const [userTheme, setUserTheme] = useState<any>(null); // 用户主题
  const [isInit, setIsInit] = useState<any>(false);
  const [serverLoading, setServerLoading] = useState<any>(false);
  const [localLoading, setLocalLoading] = useState<any>(false);
  const [locale, setLocale] = useState<any>(zhCN);
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
    userInit().then(() => setIsInit(true));
    const apiUpdate = async () => {
      // if (reqConfig?.url === API.apis.config) return;
      return useServerConfig.set((await API.getConfig()) as any);
    };
    const localUpdate = async () => {
      return useLocalConfig.set(
        await slef.current.updateLocalConfig(useInfo.get()?.addr)
      );
    };
    const update = slef.current.update;
    configEvent.on("apiUpdate", apiUpdate);
    configEvent.on("localUpdate", localUpdate);
    configEvent.on("update", update);
    return () => {
      configEvent.off("apiUpdate", apiUpdate);
      configEvent.off("localUpdate", localUpdate);
      configEvent.off("update", update);
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
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("theme-dark");
      (window as any)?.monaco?.editor.setTheme("vs-dark");
    } else {
      document.documentElement.classList.remove("theme-dark");
      (window as any)?.monaco?.editor.setTheme("vs");
    }
  }, [isDark]);

  useEffect(() => {
    const lang = i18n.resolvedLanguage;
    setLocale(lang === "zh" ? zhCN : enGB);
  }, [i18n.resolvedLanguage]);

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
        locale={locale}
      >
        <AntdGlobal>
          <React.Suspense fallback={<Spin fullscreen size="large" />}>
            {isInit ? (
              info ? (
                <Manage />
              ) : (
                <Home />
              )
            ) : (
              <Spin fullscreen size="large" />
            )}
          </React.Suspense>
        </AntdGlobal>
      </ConfigProvider>
    </Ctx.Provider>
  );
}

export default App;
