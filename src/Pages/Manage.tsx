import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  Col,
  Dropdown,
  Form,
  Input,
  Layout,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Switch,
} from "antd";
import {
  getLocalServers,
  logout,
  saveLocal,
  useInfo,
  useServerConfig,
} from "../uitls/server";
import { download, jsonFormat } from "../uitls";
import { MonacoEditor } from "../uitls/userMonacoWorker";
import Ctx from "../uitls/ctx";
import * as API from "../api";
import ListCard from "../components/ListCard";
import ChainCard from "../components/ListCard/Chains";
import ServiceCard from "../components/ListCard/Services";
import { ProCard } from "@ant-design/pro-components";
import HopsCard from "../components/ListCard/Hops";
import { fixOldCacheConfig } from "../api/local";
import { configEvent } from "../uitls/events";
import {
  CheckCircleOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
} from "@ant-design/icons";

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
  const info = useInfo()!;
  const gostConfig = useServerConfig();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [locals, setLocals] = useState<any[]>([]);

  const ref = useRef<any>({});

  const updateList = useCallback(async () => {
    return getLocalServers()
      .then((local) => {
        return local.sort((a, b) => {
          const t1 = a.time || 0;
          const t2 = b.time || 0;
          return t2 - t1;
        });
      })
      .then((list) =>
        setLocals(
          list
            .filter((item) => {
              if (item.addr === info.addr) return false;
              return true;
            })
            .map((item) => ({
              key: item.addr,
              label: <a href={`./?use=${item.addr}`}>{item.addr}</a>,
              // onClick: () => {
              //   window.open(`./?use=${item.addr}`, undefined, "noopener");
              // },
            }))
        )
      );
  }, []);

  useEffect(() => {
    fixOldCacheConfig().then((up) => {
      up && configEvent.emit("update");
    });

    const onSave = (ref.current.onSave = async () => {
      try {
        setLoading(true);
        const { saveFormat, savePath } = useInfo.get() || {};
        await API.saveCofnig(saveFormat, savePath);
        setIsSaved(true);
      } finally {
        setLoading(false);
      }
    });

    const update = () => {
      setIsSaved(false);
      if (!useInfo.get()?.autoSave) return;
      return onSave();
    };

    const onApiUpdate = async (reqConfig: any) => {
      setIsSaved(false);
      if (!useInfo.get()?.autoSave) return;
      if (reqConfig?.url === API.apis.config) return;
      return onSave();
    };
    updateList();
    configEvent.on("update", update);
    configEvent.on("apiUpdate", onApiUpdate);
    return () => {
      configEvent.off("update", update);
      configEvent.off("apiUpdate", onApiUpdate);
    };
  }, []);

  const items = useMemo<any[]>(() => {
    const items = [];
    if (locals.length) {
      items.push({
        key: "2",
        label: " 切换 ",
        children: locals,
      });
      items.push({
        type: "divider",
      });
    }
    items.push({
      key: "new",
      label: "打开新链接",
      onClick: () => {
        console.log(location.href);
        window.open(location.href, undefined, "noopener");
      },
    });
    return items;
  }, [locals]);

  console.log("gostInfo", info);
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
            <Button type="link" icon={<ReloadOutlined />} onClick={async () => {
                  useServerConfig.set((await API.getConfig()) as any)
            }}>
              刷新配置
            </Button>
          </Col>
          <Col>{info.addr}</Col>
          <Col>
            <Space>
              <Space.Compact>
                <Button
                  icon={isSaved ? <CheckCircleOutlined /> : <SaveOutlined />}
                  loading={loading}
                  onClick={() => ref.current?.onSave?.()}
                >
                  保存到服务器
                </Button>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setShow(true)}
                />
              </Space.Compact>
              <Button
                // type="link"
                icon={<DownloadOutlined />}
                onClick={() => {
                  download(jsonFormat(gostConfig!), "gost.json");
                }}
              >
                下载当前配置
              </Button>
              <Dropdown.Button menu={{ items }} onClick={logout}>
                退出
                {/* <Button type="link" onClick={logout}>
                  切换连接
                </Button> */}
              </Dropdown.Button>
            </Space>
          </Col>
        </Row>
        <Modal
          destroyOnClose
          open={show}
          onCancel={() => setShow(false)}
          footer={false}
        >
          <Form
            initialValues={info}
            layout="horizontal"
            labelCol={{ span: 4 }}
            onValuesChange={(v, vs) => {
              console.log(v, vs);
              Object.assign(info, v);
              useInfo.set(info);
              if (info.isLocal) {
                saveLocal(info.addr, info);
              }
            }}
          >
            <Form.Item name="autoSave" label="自动保存" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="saveFormat" label="格式">
              <Radio.Group optionType="button" buttonStyle="solid">
                <Radio value="json">json</Radio>
                <Radio value="yaml">yaml</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="savePath" label="保存路径" trigger="onChange">
              <Input placeholder="指定保存，默认保存到上下文目录" />
            </Form.Item>
          </Form>
        </Modal>
      </Layout.Header>
      <Layout.Content style={{ height: "100%", overflow: "auto" }}>
        <Row style={{ padding: 16, overflow: "hidden" }}>
          <Row gutter={[16, 16]}>
            {/* <Col {...colSpan} xxl={16}> */}
            <ServiceCard colSpan={colSpan}></ServiceCard>
            {/* </Col> */}
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
                {/* <pre>{jsonFormat(gostConfig!)}</pre> */}
                <MonacoEditor
                  className={"g-boder"}
                  value={jsonFormat(gostConfig!)}
                  height={"500"}
                  language="json"
                  options={{
                    // selectOnLineNumbers: true,
                    minimap: { enabled: false },
                    readOnly: true,
                  }}
                ></MonacoEditor>
              </ProCard>
            </Col>
          </Row>
        </Row>
      </Layout.Content>
    </Layout>
  );
};
export default Manage;
