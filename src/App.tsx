import { useState, useEffect, useCallback } from "react";
import Ctx from "./uitls/ctx";
import { ProLayout } from "@ant-design/pro-components";
import { init, logout, useGolstCofnig } from "./uitls/server";
import { getConfig } from "./api";
import Home from './Pages/Home';
import "./App.css";

function App() {
  const gostInfo = useGolstCofnig();
  const [gostConfig, setGostConfig] = useState<any>(null);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (gostInfo) {
      updateConfig();
    }
  }, [gostInfo]);

  const updateConfig = useCallback(() => {
    return getConfig().then((data) => {
      setGostConfig(data);
      return data;
    });
  }, []);

  return (
    <Ctx.Provider
      value={{
        gostConfig,
        updateConfig,
        logout,
      }}
    >
      {gostInfo ? <ProLayout></ProLayout> : <Home></Home>}
    </Ctx.Provider>
  );
}

export default App;
