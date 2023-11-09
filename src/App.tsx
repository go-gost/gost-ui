import { useState, useEffect, useCallback } from "react";
import { Col, Row } from "antd";
import { ProCard } from "@ant-design/pro-components";
import Ctx from "./uitls/ctx";
import { init, logout, useGolstCofnig } from "./uitls/server";
import { getConfig } from "./api";
import Home from "./Pages/Home";
import Services from "./Pages/Services";
import Chains from "./Pages/Chains";
import "./App.css";
import { configEvent } from "./uitls/events";

const colSpan = {
  xs: 24,
  sm: 24,
  md: 12,
  lg: 12,
  xl: 12,
  xxl: 8,
};

function App() {
  const gostInfo = useGolstCofnig();
  const [gostConfig, setGostConfig] = useState<any>(null);

  const updateConfig = useCallback(() => {
    return getConfig().then((data) => {
      setGostConfig(data);
      return data;
    });
  }, []);

  useEffect(() => {
    init();
    const updateConfig = () => {
      return getConfig().then((data) => {
        setGostConfig(data);
        return data;
      });
    };
    configEvent.on("apiUpdate", updateConfig);
    return () => {
      configEvent.off("apiUpdate", updateConfig);
    };
  }, []);

  useEffect(() => {
    if (gostInfo) {
      updateConfig();
    }
  }, [gostInfo]);

  return (
    <Ctx.Provider
      value={{
        gostConfig,
        updateConfig,
        logout,
      }}
    >
      {gostInfo ? (
        <Row style={{ padding: 16, overflow: "hidden" }}>
          <Row gutter={[16, 16]}>
            <Col {...colSpan}>
              <ProCard boxShadow title="Services">
                <Services></Services>
              </ProCard>
            </Col>
            <Col {...colSpan}>
              <ProCard boxShadow title="Chains">
                <Chains></Chains>
              </ProCard>
            </Col>
            <Col span={24}>
              <ProCard boxShadow title="All Config JSON">
                <pre>{JSON.stringify(gostConfig, null, 4)}</pre>
              </ProCard>
            </Col>
          </Row>
        </Row>
      ) : (
        <Home></Home>
      )}
    </Ctx.Provider>
  );
}

export default App;
