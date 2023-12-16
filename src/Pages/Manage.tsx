import { Button, Col, Layout, Row, Select, Space } from "antd";
import { logout, useGolstCofnig } from "../uitls/server";
import { download, jsonFormat } from "../uitls";
import Ctx from "../uitls/ctx";
import { useContext, useEffect } from "react";
import * as API from "../api";
import ListCard from "../components/ListCard";
import ChainCard from "../components/ListCard/Chains";
import ServiceCard from "../components/ListCard/Services";
import { ProCard } from "@ant-design/pro-components";
import HopsCard from "../components/ListCard/Hops";
import { fixOldCacheConfig } from "../api/local";
import { configEvent } from "../uitls/events";

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

const Manage = () => {
  const gostInfo = useGolstCofnig()!;
  const { gostConfig } = useContext(Ctx);
  useEffect(() => {
    fixOldCacheConfig().then((up) => {
      up && configEvent.emit("update");
    });
    return () => {};
  }, []);
  return (
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
                  download(jsonFormat(gostConfig!), "gost.json");
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
              <HopsCard />
            </Col>
            <Col {...colSpan}>
              <ListCard module="auther" />
            </Col>
            <Col {...colSpan}>
              <ListCard module="admission" />
            </Col>
            <Col {...colSpan}>
              <ListCard module="bypass" />
            </Col>
            <Col {...colSpan}>
              <ListCard module="host" />
            </Col>
            <Col {...colSpan}>
              <ListCard module="ingress" />
            </Col>
            <Col {...colSpan}>
              <ListCard module="resolver" />
            </Col>
            <Col span={24}>
              <ProCard boxShadow title="限速限流">
                <Row gutter={[16, 16]}>
                  <Col {...colSpan1}>
                    <ListCard module="limiter" bordered />
                  </Col>
                  <Col {...colSpan1}>
                    <ListCard module="rlimiter" bordered />
                  </Col>
                  <Col {...colSpan1}>
                    <ListCard module="climiter" bordered />
                  </Col>
                </Row>
              </ProCard>
            </Col>
            <Col span={24}>
              <ProCard boxShadow title="All Config JSON">
                <pre>{jsonFormat(gostConfig!)}</pre>
              </ProCard>
            </Col>
          </Row>
        </Row>
      </Layout.Content>
    </Layout>
  );
};
export default Manage;
