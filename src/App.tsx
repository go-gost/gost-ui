import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Col,
  ConfigProvider,
  Form,
  Layout,
  Row,
  Select,
  Space,
  theme,
} from "antd";
import { ProCard } from "@ant-design/pro-components";
import Ctx from "./uitls/ctx";
import { init, logout, useGolstCofnig } from "./uitls/server";
import * as API from "./api";
import Home from "./Pages/Home";
import Services from "./Pages/Services";
import Chains from "./Pages/Chains";
import "./App.css";
import { configEvent } from "./uitls/events";
import PublicPage from "./Pages/PublicPage";
import { jsonFormat } from "./uitls";

const colSpan = {
  xs: 24,
  sm: 24,
  md: 12,
  lg: 12,
  xl: 12,
  xxl: 8,
};
const colSpan1 = {
  sm: 24,
  xxl: 8,
};

function App() {
  const gostInfo = useGolstCofnig();
  const [gostConfig, setGostConfig] = useState<any>(null);
  const [isDark, setIsDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const updateConfig = useCallback(() => {
    return API.getConfig().then((data) => {
      setGostConfig(data);
      return data;
    });
  }, []);

  useEffect(() => {
    init();
    const updateConfig = () => {
      return API.getConfig().then((data) => {
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
      <ConfigProvider
        theme={{ algorithm: isDark ? theme.darkAlgorithm : undefined }}
      >
        {gostInfo ? (
          <Layout style={{ height: "100vh", overflow: "hidden" }}>
            <Layout.Header style={{ color: "#FFF" }}>
              <Row
                align="middle"
                justify="space-between"
                wrap={false}
                // style={{ padding: "0 15px" }}
              >
                <Col color="">
                  <Space>
                    <Select placeholder="快捷操作"></Select>
                  </Space>
                </Col>
                <Col>{gostInfo.addr}</Col>
                <Col>
                  <Button type="link" onClick={logout}>切换连接</Button>
                </Col>
              </Row>
            </Layout.Header>
            <Layout.Content style={{ height: "100%", overflow: "auto" }}>
              <Row style={{ padding: 16, overflow: "hidden" }}>
                <Row gutter={[16, 16]}>
                  <Col {...colSpan}>
                    <ProCard boxShadow title="服务(Service)">
                      <Services></Services>
                    </ProCard>
                  </Col>
                  <Col {...colSpan}>
                    <ProCard boxShadow title="转发链(Chain)">
                      <Chains></Chains>
                    </ProCard>
                  </Col>
                  <Col {...colSpan}>
                    <ProCard boxShadow title="认证器(Auther)">
                      <PublicPage
                        title="认证器"
                        name="authers"
                        api={API.authers}
                      ></PublicPage>
                    </ProCard>
                  </Col>
                  <Col {...colSpan}>
                    <ProCard boxShadow title="准入控制器(Admission)">
                      <PublicPage
                        title="准入控制器"
                        name="admissions"
                        api={API.admissions}
                      ></PublicPage>
                    </ProCard>
                  </Col>
                  <Col {...colSpan}>
                    <ProCard boxShadow title="分流器(Bypass)">
                      <PublicPage
                        title="分流器"
                        name="bypass"
                        api={API.bypasses}
                      ></PublicPage>
                    </ProCard>
                  </Col>
                  <Col {...colSpan}>
                    <ProCard boxShadow title="主机映射器(Hosts)">
                      <PublicPage
                        title="主机映射器"
                        name="hosts"
                        api={API.hosts}
                      ></PublicPage>
                    </ProCard>
                  </Col>
                  <Col {...colSpan}>
                    <ProCard boxShadow title="跳跃点(Hop)">
                      <PublicPage
                        title="跳跃点"
                        name="hop"
                        api={API.hops}
                      ></PublicPage>
                    </ProCard>
                  </Col>
                  <Col {...colSpan}>
                    <ProCard boxShadow title="Ingress">
                      <PublicPage
                        title="Ingress"
                        name="ingresses"
                        api={API.ingresses}
                      ></PublicPage>
                    </ProCard>
                  </Col>
                  <Col {...colSpan}>
                    <ProCard boxShadow title="域名解析器(Resolver)">
                      <PublicPage
                        title="Resolver"
                        name="resolvers"
                        api={API.resolvers}
                      ></PublicPage>
                    </ProCard>
                  </Col>
                  <Col span={24}>
                    <ProCard boxShadow title="限速限流">
                      <Row gutter={[16, 16]}>
                        <Col {...colSpan1}>
                          <ProCard bordered title="流量速率限制">
                            <PublicPage
                              title=""
                              name="limiters"
                              api={API.limiters}
                            ></PublicPage>
                          </ProCard>
                        </Col>
                        <Col {...colSpan1}>
                          <ProCard bordered title="请求速率限制">
                            <PublicPage
                              title=""
                              name="rlimiters"
                              api={API.rlimiters}
                            ></PublicPage>
                          </ProCard>
                        </Col>
                        <Col {...colSpan1}>
                          <ProCard bordered title="并发连接数限制">
                            <PublicPage
                              title=""
                              name="climiters"
                              api={API.climiters}
                            ></PublicPage>
                          </ProCard>
                        </Col>
                      </Row>
                    </ProCard>
                  </Col>
                  <Col span={24}>
                    <ProCard boxShadow title="All Config JSON">
                      <pre>{jsonFormat(gostConfig)}</pre>
                    </ProCard>
                  </Col>
                </Row>
              </Row>
            </Layout.Content>
          </Layout>
        ) : (
          <Home></Home>
        )}
      </ConfigProvider>
    </Ctx.Provider>
  );
}

export default App;
