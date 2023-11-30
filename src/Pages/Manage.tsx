import { Button, Col, Layout, Row, Select, Space } from "antd";
import { logout, useGolstCofnig } from "../uitls/server";
import { download, jsonFormat } from "../uitls";
import Ctx from "../uitls/ctx";
import { useContext } from "react";
import * as API from "../api";
import ListCard from "../components/ListCard";
import ChainCard from "../components/ListCard/Chains";
import ServiceCard from "../components/ListCard/Services";
import { ProCard } from "@ant-design/pro-components";

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
