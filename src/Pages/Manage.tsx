import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { CodeEditor } from "../uitls/useMonacoEdit";
import * as API from "../api";
import ListCard, { ProCard } from "../components/ListCard";
import ChainCard from "../components/ListCard/Chains";
import ServiceCard from "../components/ListCard/Services";
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
import { ThemeButton } from "../components/Theme";
import { LanguageButton } from "../components/Language";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
        label: t("manage.cmd.switch"),
        children: locals,
      });
      items.push({
        type: "divider",
      });
    }
    items.push({
      key: "new",
      label: t("manage.cmd.new"),
      onClick: () => {
        window.open(location.href, undefined, "noopener");
      },
    });
    return items;
  }, [locals, t]);

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Layout.Header style={{ color: "#FFF", paddingInline: 20 }}>
        <Row
          align="middle"
          justify="space-between"
          wrap={false}
          // style={{ padding: "0 15px" }}
        >
          <Col color="">
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={async () => {
                useServerConfig.set((await API.getConfig()) as any);
              }}
            >
              {t("manage.cmd.reload")}
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
                  {t("manage.cmd.save")}
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
                {t("manage.cmd.download")}
              </Button>
              <Dropdown.Button menu={{ items }} onClick={logout}>
                {t("manage.cmd.logout")}
              </Dropdown.Button>
              <ThemeButton />
              <LanguageButton />
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
              Object.assign(info, v);
              useInfo.set(info);
              if (info.isLocal) {
                saveLocal(info.addr, info);
              }
            }}
          >
            <Form.Item
              name="autoSave"
              label={t("manage.label.autoSave")}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="saveFormat"
              label={t("manage.label.format")}
              initialValue={"json"}
            >
              <Radio.Group optionType="button" buttonStyle="solid">
                <Radio value="json">json</Radio>
                <Radio value="yaml">yaml</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              name="savePath"
              label={t("manage.label.path")}
              trigger="onChange"
            >
              <Input placeholder={t("placeholder.savePath")} />
            </Form.Item>
          </Form>
        </Modal>
      </Layout.Header>
      <Layout.Content
        style={{
          height: "100%",
          padding: 16,
          boxSizing: "border-box",
          overflow: "auto",
        }}
      >
        <Row gutter={[16, 16]} style={{ overflow: "hidden" }}>
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
          <Col {...colSpan}>
            <ListCard module="sd" />
          </Col>
          <Col {...colSpan}>
            <ListCard module="observer" />
          </Col>
          <Col span={24}>
            <ProCard boxShadow title={t("manage.label.limit")}>
              <Row gutter={[16, 16]}>
                <Col {...colSpan1}>
                  <ListCard module="limiter" bordered boxShadow={false} />
                </Col>
                <Col {...colSpan1}>
                  <ListCard module="rlimiter" bordered boxShadow={false} />
                </Col>
                <Col {...colSpan1}>
                  <ListCard module="climiter" bordered boxShadow={false} />
                </Col>
              </Row>
            </ProCard>
          </Col>
          <Col span={24}>
            <ProCard
              boxShadow
              title={t("manage.label.allConfig")}
              styles={{ body: { padding: 20 } }}
            >
              <CodeEditor
                className={"g-boder"}
                value={jsonFormat(gostConfig!)}
                height={500}
                language="json"
                options={{
                  // selectOnLineNumbers: true,
                  minimap: { enabled: false },
                  readOnly: true,
                }}
              ></CodeEditor>
            </ProCard>
          </Col>
        </Row>
      </Layout.Content>
    </Layout>
  );
};
export default Manage;
