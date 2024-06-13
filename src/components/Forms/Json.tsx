import React, { useRef } from "react";
import ReactDOM from "react-dom/client";
import {
  Button,
  Dropdown,
  Form,
  FormInstance,
  Space,
  ConfigProvider,
} from "antd";
import { DownOutlined } from "@ant-design/icons";
import { jsonFormat, jsonStringFormat, jsonParse, jsonEdit } from "../../uitls";
import { Template } from "../../templates";
// import { render } from "react-dom";
// import { useServerConfig } from "../../uitls/server";
import ModalForm, { ModalFormProps } from "../ModalForm";
import { CodeEditor } from "../../uitls/useMonacoEdit";
import { globalConfig } from "antd/es/config-provider";
import { HookAPI } from "antd/es/modal/useModal";
import { useTranslation } from "react-i18next";
import { getLabel } from "../../uitls/i18n";

const template2menu: any = (template: Template) => {
  const { children, ...other } = template;
  const { json, cli } = template;
  if (children) {
    return {
      ...other,
      items: children.map(template2menu),
    };
  } else if (json) {
    return {
      ...other,
      title: cli,
    };
  }
};

{
  /* <Dropdown menu={menuProps}>
      <Button>
        <Space>
          Button
          <DownOutlined />
        </Space>
      </Button>
    </Dropdown> */
}

// const TemplateBar = (props: any) => {
//   const { templates, onhandle } = props;
//   return <Space></Space>;
// };

type JsonFromProps = ModalFormProps & {
  templates?: Template[];
};

const JsonForm: React.FC<JsonFromProps> = (props) => {
  const { templates, ...other } = props;
  const { t } = useTranslation();
  const formRef = useRef<FormInstance<any>>();
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

  const template2menu: any = (template: Template) => {
    const { children, ...other } = template;
    const { json, cli } = template;
    if (children) {
      return {
        ...other,
        children: children.map(template2menu),
      };
    } else if (json) {
      const { label } = other;
      return {
        ...other,
        label: getLabel(label),
        title: cli,
        onClick: () => templateHandle(json),
      };
    }
  };

  const hasTemplate = templates?.length;

  return (
    <>
      <ModalForm
        {...other}
        formRef={formRef}
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
      >
        {hasTemplate ? (
          <Space
            size={"small"}
            style={{ marginBottom: 5, width: "100%", overflow: "auto" }}
          >
            <span>{t("terms.template")}:</span>
            {templates.map((template, index) => {
              if (template.children?.length) {
                const menu = {
                  items: template.children.map(template2menu) as any,
                  // onClick: (info: any) => {
                  //   // debugger;
                  //   const {item} = info;
                  //   const template = item.props as any;
                  //   if (!template.children && template.json) {
                  //     templateHandle(template.json);
                  //   }
                  // },
                };

                if (template.json) {
                  return (
                    <Dropdown.Button
                      key={index}
                      size="small"
                      onClick={() => templateHandle(template.json)}
                      menu={menu}
                    >
                      {getLabel(template.label)}
                    </Dropdown.Button>
                  );
                } else {
                  return (
                    <Dropdown key={index} menu={menu}>
                      <Button size="small">
                        <Space>
                          {getLabel(template.label)}
                          <DownOutlined />
                        </Space>
                      </Button>
                    </Dropdown>
                  );
                }
              } else if (template.json) {
                return (
                  <Button
                    key={index}
                    size="small"
                    title={template.cli}
                    onClick={() => templateHandle(template.json)}
                  >
                    <Space>{getLabel(template.label)}</Space>
                  </Button>
                );
              } else {
                return null;
              }
            })}
          </Space>
        ) : null}
        <Form.Item
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
        >
          <CodeEditor
            className={"g-boder"}
            height={300}
            language="json"
            options={{
              minimap: { enabled: false },
            }}
          />
          {/* <MonacoEditor
            className={"g-boder"}
            height={300}
            language="json"
            options={{
              minimap: { enabled: false },
            }} /> */}
        </Form.Item>
      </ModalForm>
    </>
  );
};

export const showJsonForm = (props: JsonFromProps) => {
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

// export const showUpModelForm = (props: any) => {
//   const { name, root, model } = props;
// };

export default JsonForm;
