import { useContext, useEffect, useRef, useState } from "react";
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Space,
  Switch,
} from "antd";
import {
  saveLocal,
  useInfo,
  useServerConfig,
} from "../utils/server";
import { download, jsonFormat } from "../utils";
import { CodeEditor } from "../components/CodeEditor";
import * as API from "../api";
import ListCard, { ProCard } from "../components/ListCard";
import ChainCard from "../components/ListCard/Chains";
import ServiceCard from "../components/ListCard/Services";
import HopsCard from "../components/ListCard/Hops";
import { fixOldCacheConfig } from "../api/local";
import { configEvent } from "../utils/events";
import {
  CheckCircleOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import Ctx from "../utils/ctx";

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
  const { isLoading } = useContext(Ctx);
  const info = useInfo()!;
  const { t } = useTranslation();
  const gostConfig = useServerConfig();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const ref = useRef<any>({});

  useEffect(() => {
    fixOldCacheConfig().then((up) => {
      up && configEvent.emit("update", false);
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

    const onAutoSave = (autoSave = false) => {
      if (autoSave) setIsSaved(false);
      if (!useInfo.get()?.autoSave || !autoSave) return;
      return onSave();
    };
    configEvent.on("update", onAutoSave);
    configEvent.on("apiUpdate", onAutoSave);
    return () => {
      configEvent.off("update", onAutoSave);
      configEvent.off("apiUpdate", onAutoSave);
    };
  }, []);

  return (
    <>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button
          loading={isLoading}
          icon={<ReloadOutlined />}
          onClick={() => configEvent.emit("update")}
        >
          {t("manage.cmd.reload")}
        </Button>
        <Space.Compact>
          <Button
            icon={isSaved ? <CheckCircleOutlined /> : <SaveOutlined />}
            loading={loading}
            onClick={() => ref.current?.onSave?.()}
          >
            {t("manage.cmd.save")}
          </Button>
          <Button icon={<SettingOutlined />} onClick={() => setShow(true)} />
        </Space.Compact>
        <Button
          icon={<DownloadOutlined />}
          onClick={() => {
            download(jsonFormat(gostConfig!), "gost.json");
          }}
        >
          {t("manage.cmd.download")}
        </Button>
      </Space>
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
    </>
  );
};
export default Manage;
