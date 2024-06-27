import React, { useCallback, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  Button,
  Dropdown,
  Form,
  FormInstance,
  Space,
  ConfigProvider,
  Flex,
} from "antd";
import {
  DownOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  RedoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { jsonFormat, jsonStringFormat, jsonParse, jsonEdit } from "../../utils";
import { Template } from "../../templates";
// import { render } from "react-dom";
// import { useServerConfig } from "../../uitls/server";
import ModalForm, { ModalFormProps } from "../ModalForm";
import { globalConfig } from "antd/es/config-provider";
import { useTranslation } from "react-i18next";
import { getLabel } from "../../utils/i18n";
import { v4 as uuid } from "uuid";
import { CodeEditor } from "../CodeEditor";

const template2data: any = (template: Template) => {
  const { children, label, ...other } = template;
  const { json, cli } = template;
  const key = uuid();
  if (children) {
    return {
      key,
      ...other,
      label: getLabel(label),
      children: children.map(template2data),
    };
  } else if (json) {
    return {
      key,
      ...other,
      label: getLabel(label),
      title: cli,
    };
  }
};

type JsonFromProps = ModalFormProps & {
  templates?: Template[];
};

interface Jsonform extends React.FC<JsonFromProps> {
  show: (props: JsonFromProps) => void;
}

const JsonForm: Jsonform = (props) => {
  const { templates, modalProps, ...other } = props;
  const { t } = useTranslation();
  const formRef = useRef<FormInstance<any>>();
  const editorRef = useRef<React.ComponentRef<typeof CodeEditor>>(null);
  const [isFull, setFull] = useState(false);
  const templateHandle = (json: string) => {
    let value = json;
    if (props.initialValues?.value) {
      const _old = jsonParse(props.initialValues.value);
      value = _old.name
        ? jsonEdit(json, [{ path: "name", value: _old.name }])
        : json;
    }
    value = jsonStringFormat(value);
    formRef.current?.setFieldValue("value", value);
    formRef.current?.validateFields();
  };

  const templateMenus = useMemo(() => {
    return templates?.map(template2data);
  }, [templates]);

  const runAction = useCallback((action: string) => {
    console.log('editorRef', editorRef);
    editorRef.current?.getAction(action)?.run();
  }, []);
  const hasTemplate = templates?.length;

  // useEffect(() => {
  //   if(editorRef.current){
  //     const editor = editorRef.current;
  //     console.log('editor.contrib.editorZoom', editor.getContribution('editor.contrib.editorZoom'));
  //   }
  // }, [editorRef])

  return (
    <>
      <ModalForm
        {...other}
        isFull={isFull}
        formRef={formRef}
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
          ...modalProps,
          footer: (_, { OkBtn, CancelBtn }) => (
            <>
              <Button onClick={() => formRef.current?.resetFields()}>
                {t("base.cmd.reset")}
              </Button>
              <CancelBtn />
              <OkBtn />
            </>
          ),
        }}
      >
        <Flex style={{ height: "100%" }} vertical>
          {/* 工具条 */}
          <Flex
            style={{ paddingBottom: 5 }}
            justify="space-between"
            align="center"
          >
            <Flex gap="small">
              {hasTemplate ? (
                <Dropdown
                  menu={{
                    items: templateMenus as any,
                    onClick: function (arg) {
                      const keyPath = arg.keyPath.reverse();
                      const json = keyPath.reduce((pre, key) => {
                        if (Array.isArray(pre)) {
                          return pre?.find((item: any) => item.key === key);
                        } else if (pre.children) {
                          return pre.children?.find(
                            (item: any) => item.key === key
                          );
                        }
                      }, templateMenus as any)?.json;
                      if (json) {
                        templateHandle(json);
                      }
                    },
                  }}
                >
                  <Button type="link" size="small">
                    <Space>
                      {t("terms.template")}
                      <DownOutlined />
                    </Space>
                  </Button>
                </Dropdown>
              ) : null}
            </Flex>
            <Flex gap="small">
              {/* <Space.Compact size="small">
                <Button
                  icon={<RedoOutlined rotate={0} />}
                  onClick={() => {
                    runAction("default:undo");
                    // editorRef.current?.
                  }}
                ></Button>
                <Button
                  icon={<RedoOutlined />}
                  onClick={() => {
                    runAction("default:redo");
                  }}
                ></Button>
                <Button
                  title={t("base.cmd.reset")}
                  icon={<RedoOutlined style={{transform: 'rotateY(180deg)'}} />}
                  onClick={() => formRef.current?.resetFields()}
                  // htmlType="reset"
                ></Button>
              </Space.Compact> */}
              <Space.Compact size="small">
                <Button
                  icon={<ZoomOutOutlined />}
                  onClick={() => runAction("editor.action.fontZoomOut")}
                />
                <Button
                  icon={<ZoomInOutlined />}
                  onClick={() => runAction("editor.action.fontZoomIn")}
                />
                <Button
                  icon={
                    !isFull ? (
                      <FullscreenOutlined />
                    ) : (
                      <FullscreenExitOutlined />
                    )
                  }
                  onClick={() => setFull((v) => !v)}
                />
              </Space.Compact>
            </Flex>
          </Flex>
          {/* 代码编辑器 */}
          <Flex flex="100%" vertical>
            <Form.Item noStyle name="value">
              <CodeEditor
                ref={editorRef}
                className={"g-boder"}
                height={isFull ? "100%" : 300}
                language="json"
                options={{
                  minimap: { enabled: false },
                }}
              />
            </Form.Item>
          </Flex>
          {/* 这个 Form.Item 单纯只用于显示错误 */}
          <Form.Item
            className="form-only-error"
            name="value"
            rules={[
              { required: true, message: t("msg.require") },
              {
                validator: (rule, value) => {
                  return new Promise((resolve, reject) => {
                    if (value) {
                      jsonParse(value);
                    }
                    resolve(null);
                  }).catch((err) => {
                    console.error(err);
                    throw new Error(t("msg.formatError", { name: "JSON" }));
                  });
                },
              },
            ]}
          ></Form.Item>
        </Flex>
      </ModalForm>
    </>
  );
};

JsonForm.show = (props: JsonFromProps) => {
  const { onOpenChange, open: propOpen, ...other } = props;
  let timeoutId: ReturnType<typeof setTimeout>;
  const container = document.createDocumentFragment();
  const root = ReactDOM.createRoot(container);
  function render({ ...props }: JsonFromProps) {
    clearTimeout(timeoutId);
    const config = globalConfig();
    timeoutId = setTimeout(() => {
      document.body.append(container);
      root.render(
        <ConfigProvider theme={config.getTheme()}>
          <JsonForm {...props} />
        </ConfigProvider>
      );
    }, 100);
  }

  function destroy() {
    root.unmount();
    document.body.removeChild(container);
  }

  render({
    ...other,
    open: true,
    onOpenChange: (v) => {
      !v && destroy();
    },
  });
};

export default JsonForm;
