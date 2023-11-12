import React, { useRef } from "react";
import {
  ProFormTextArea,
  ModalForm,
  ProFormInstance,
} from "@ant-design/pro-components";
import { Button, Dropdown, Space } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { jsonFormat, jsonStringFormat } from "../../uitls";

type Template = {
  label: string;
  cli?: string;
  json?: string;
  children?: Template[];
};

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

const JsonForm: React.FC<any> = (props) => {
  const { templates, ...other } = props;
  const formRef = useRef<ProFormInstance>();
  const templateHandle = (json: string) => {
    let value;
    if (props.initialValues?.value) {
      const _json = JSON.parse(json);
      const _old = JSON.parse(props.initialValues.value);
      _json.name = _old.name ? _old.name : _json.name;
      value = jsonFormat(_json);
    } else {
      value = jsonStringFormat(json);
    }
    formRef.current?.setFieldValue("value", value);
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
      return {
        ...other,
        title: cli,
        onClick: () => templateHandle(json),
      };
    }
  };
  const hasTemplate = templates?.length;
  return (
    <>
      <ModalForm {...other} formRef={formRef}>
        {hasTemplate && (
          <Space size={"small"} style={{ marginBottom: 5 }}>
            <span>选择模板</span>
            {templates.map((template: any, index: any) => {
              if (template.children?.length) {
                const menu = {
                  items: template.children.map(template2menu),
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
                      {template.label}
                    </Dropdown.Button>
                  );
                } else {
                  return (
                    <Dropdown key={index} menu={menu}>
                      <Button size="small">
                        <Space>
                          {template.label}
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
                    <Space>{template.label}</Space>
                  </Button>
                );
              } else {
                return null;
              }
            })}
          </Space>
        )}
        <ProFormTextArea
          fieldProps={{ rows: 16 }}
          name="value"
          // label="JSON"
        ></ProFormTextArea>
      </ModalForm>
    </>
  );
};

export default JsonForm;
