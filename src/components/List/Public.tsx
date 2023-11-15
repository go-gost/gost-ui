import { useContext, useEffect, useMemo, useState } from "react";
import { Button, Popconfirm, Space, Table } from "antd";
import Ctx from "../../uitls/ctx";
import { getRESTfulApi } from "../../api";
import JsonForm from "../Forms/Json";
import { ChainConfig } from "../../api/types";
import { jsonFormat } from "../../uitls";
import templates from "../../uitls/templates";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

type Props = {
  name: string;
  title: string;
  api: ReturnType<typeof getRESTfulApi>;
  keyName?: string;
  renderConfig?: (v: any, r: any, i: number) => React.ReactNode;
};

const defaultRenderConfig = (value: any, record: any, index: number) => {
  return JSON.stringify(record);
};

const PublicList: React.FC<Props> = (props) => {
  const {
    name,
    title,
    api,
    keyName = "name",
    renderConfig = defaultRenderConfig,
  } = props;
  const { gostConfig } = useContext(Ctx);
  const dataList = (gostConfig as any)?.[name] || [];
  const ts = useMemo(() => {
    return templates[name];
  }, []);

  const updateService = async (id: string, servic: any) => {
    const data = JSON.parse(servic);
    await api.put(id, data);
  };

  const deleteService = async (servic: any) => {
    await api.delete(servic.name);
  };

  return (
    <div style={{ height: 348, overflow: "auto" }}>
      <Table
        scroll={{ y: 246 }}
        size="small"
        dataSource={dataList}
        columns={[
          { title: keyName, dataIndex: keyName, ellipsis: true, width: 100 },
          {
            title: "详情",
            ellipsis: true,
            render: renderConfig,
          },
          {
            title: "操作",
            width: 80,
            align: "right",
            dataIndex: keyName,
            render: (value, record, index) => {
              return (
                <Space size={"small"}>
                  <JsonForm
                    title={`修改 ${value || ""}`}
                    templates={ts}
                    trigger={
                      <Button
                        title="修改"
                        icon={<EditOutlined />}
                        type="link"
                        size={"small"}
                      />
                    }
                    initialValues={{ value: jsonFormat(record) }}
                    onFinish={async (values: any) => {
                      const { value } = values;
                      await updateService(record.name, value);
                      return true;
                    }}
                  ></JsonForm>
                  <Popconfirm
                    title="警告"
                    description="确定要删除吗？"
                    onConfirm={() => deleteService(record)}
                  >
                    <Button
                      title="删除"
                      icon={<DeleteOutlined />}
                      type="link"
                      size={"small"}
                    />
                  </Popconfirm>
                </Space>
              );
            },
          },
        ]}
      ></Table>
      {/* <div>
        <JsonForm
          title={`添加 ${title || ""}`}
          templates={ts}
          trigger={<Button>新增</Button>}
          onFinish={async (values: any) => {
            const { value } = values;
            await addService(value);
            return true;
          }}
        ></JsonForm>
      </div> */}
    </div>
  );
};
export default PublicList;
