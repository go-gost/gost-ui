import { useState, useEffect, useCallback, useRef } from "react";
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
// import Services from "./components/List/Services";
// import Chains from "./components/List/Chains";
// import PublicList from "./components/List/Public";
import "./App.css";
import { configEvent } from "./uitls/events";
import { download, jsonFormat } from "./uitls";
import ListCard from "./components/ListCard";
import ChainCard from "./components/ListCard/Chains";
import ServiceCard from "./components/ListCard/Services";

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
    configEvent.on("apiUpdate", apiUpdate);
    return () => {
      configEvent.off("apiUpdate", apiUpdate);
    };
  }, []);

  useEffect(() => {
    if (gostInfo) {
      slef.current.updateConfig().then(() => {
        document.title = gostInfo.addr.replace(/^(https?:)?\/\//,'');
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
                  <Space>
                    <Button
                      // type="link"
                      onClick={() => {
                        API.saveCofnig();
                      }}
                    >
                      保存配置
                    </Button>
                    <Button
                      // type="link"
                      onClick={() => {
                        download(jsonFormat(gostConfig), "gost.json");
                      }}
                    >
                      下载当前配置
                    </Button>
                    <Button type="link" onClick={logout}>
                      切换连接
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Layout.Header>
            <Layout.Content style={{ height: "100%", overflow: "auto" }}>
              <Row style={{ padding: 16, overflow: "hidden" }}>
                <Row gutter={[16, 16]}>
                  <Col {...colSpan}>
                    <ServiceCard></ServiceCard>
                  </Col>
                  <Col {...colSpan}>
                    <ChainCard></ChainCard>
                  </Col>
                  <Col {...colSpan}>
                    <ListCard
                      title="认证器(Auther)"
                      subTitle="认证器"
                      name="authers"
                      api={API.authers}
                    ></ListCard>
                  </Col>
                  <Col {...colSpan}>
                    <ListCard
                      title="准入控制器(Admission)"
                      subTitle="准入控制器"
                      name="admissions"
                      api={API.admissions}
                    ></ListCard>
                  </Col>
                  <Col {...colSpan}>
                    <ListCard
                      title="分流器(Bypass)"
                      subTitle="分流器"
                      name="bypass"
                      api={API.bypasses}
                    ></ListCard>
                  </Col>
                  <Col {...colSpan}>
                    <ListCard
                      title="主机映射器(Hosts)"
                      subTitle="主机映射器"
                      name="hosts"
                      api={API.hosts}
                    ></ListCard>
                  </Col>
                  <Col {...colSpan}>
                    <ListCard
                      title="跳跃点(Hop)"
                      subTitle="跳跃点"
                      name="hop"
                      api={API.hops}
                    ></ListCard>
                  </Col>
                  <Col {...colSpan}>
                    <ListCard
                      title="Ingress"
                      subTitle="Ingress"
                      name="ingresses"
                      api={API.ingresses}
                    ></ListCard>
                  </Col>
                  <Col {...colSpan}>
                    <ListCard
                      title="域名解析器(Resolver)"
                      subTitle="Resolver"
                      name="resolvers"
                      api={API.resolvers}
                    ></ListCard>
                  </Col>
                  <Col span={24}>
                    <ProCard boxShadow title="限速限流">
                      <Row gutter={[16, 16]}>
                        <Col {...colSpan1}>
                          <ListCard
                            title="流量速率限制"
                            subTitle=""
                            name="limiters"
                            api={API.limiters}
                            bordered
                          ></ListCard>
                        </Col>
                        <Col {...colSpan1}>
                          <ListCard
                            title="请求速率限制"
                            subTitle=""
                            name="rlimiters"
                            api={API.rlimiters}
                            bordered
                          ></ListCard>
                        </Col>
                        <Col {...colSpan1}>
                          <ListCard
                            title="并发连接数限制"
                            subTitle=""
                            name="climiters"
                            api={API.climiters}
                            bordered
                          ></ListCard>
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
