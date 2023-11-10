import { useContext, useEffect, useState } from "react";
import { Button, Popconfirm, Space, Table } from "antd";
import Ctx from "../uitls/ctx";
import * as API from "../api";
import JsonForm from "../components/Forms/Json";
import { ChainConfig } from "../api/types";

type Props = {
  name: string;
  title: string;
  api: any;
  keyName?: string;
};
const PublicPage: React.FC<Props> = (props) => {
  const { name, title, api, keyName = "name" } = props;
  const { gostConfig } = useContext(Ctx);
  const dataList = (gostConfig as any)?.[name] || [];
  
  const addService = async (servic: any) => {
    const data = JSON.parse(servic);
    await api.post(data);
  };

  const updateService = async (id: string, servic: any) => {
    const data = JSON.parse(servic);
    await api.put(id, data);
  };

  const deleteService = async (servic: any) => {
    await api.delete(servic.name);
  };

  return (
    <div>
      <Table
        size="small"
        dataSource={dataList}
        columns={[
          { title: keyName, dataIndex: keyName, width: 100 },
          {
            title: "详情",
            ellipsis: true,
            render: (value, record, index) => {
              return JSON.stringify(record)
            },
          },
          {
            title: "操作",
            width: 120,
            render: (value, record, index) => {
              return (
                <Space size={"small"}>
                  <JsonForm
                    layoutType="ModalForm"
                    trigger={
                      <Button type="link" size={"small"}>
                        修改
                      </Button>
                    }
                    initialValues={{ value: JSON.stringify(record, null, 4) }}
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
                    <Button type="link" size={"small"}>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              );
            },
          },
        ]}
      ></Table>
      <div>
        <JsonForm
          title={`添加 ${title || ''}`}
          layoutType="ModalForm"
          trigger={<Button>新增</Button>}
          onFinish={async (values: any) => {
            const { value } = values;
            await addService(value);
            return true;
          }}
        ></JsonForm>
      </div>
    </div>
  );
};
export default PublicPage;
