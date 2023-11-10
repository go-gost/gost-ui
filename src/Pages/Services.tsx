import { useContext, useEffect, useState } from "react";
import { Button, Popconfirm, Space, Table } from "antd";
import qs from "qs";
// import { ProTable, ProCard } from "@ant-design/pro-components";
import Ctx from "../uitls/ctx";
import * as API from "../api";
import JsonForm from "../components/Forms/Json";
import { ServiceConfig } from "../api/types";

const Services: React.FC = () => {
  const { gostConfig, updateConfig } = useContext(Ctx);
  const { services } = gostConfig || {};
  const [json, setJson] = useState<any>(null);
  const [config, setConfig] = useState("");

  useEffect(() => {
    if (json) {
      setConfig(JSON.stringify(json));
    }
  }, [json]);

  const submit = async (v?: string) => {
    const data = JSON.parse(v || config);
    if (json) {
      await API.services.put(data.name, data);
    } else {
      await API.services.post(data);
    }
  };

  const addService = async (servic: any) => {
    const data = JSON.parse(servic);
    await API.services.post(data);
  };

  const updateService = async (id: string, servic: any) => {
    const data = JSON.parse(servic);
    await API.services.put(id, data);
  };

  const deleteService = async (servic: any) => {
    if (json === servic) {
      setJson(null);
    }
    await API.services.delete(servic.name);
  };

  return (
    <div>
      <Table
        size="small"
        dataSource={services}
        columns={[
          { title: "Name", dataIndex: "name", width: 100 },
          {
            title: "详情",
            ellipsis: true,
            render: (value, record: ServiceConfig, index) => {
              const { handler, listener, addr, forwarder } = record;
              const xy =
                handler.type === listener.type
                  ? handler.type
                  : handler.type + "+" + listener.type;
              const auth = handler.auth
                ? handler.auth.username + ":" + handler.auth.password + "@"
                : "";
              const metadata = handler.metadata
                ? qs.stringify(handler.metadata)
                : "";
              // const targets = forwarder  // TODO:
              return `${xy}://${auth}${addr}${metadata ? "?" + metadata : ""}`;
            },
          },
          {
            title: "操作",
            width: 120,
            render: (value, record, index) => {
              return (
                <Space size={"small"}>
                  {/* <Button
                    type="link"
                    size={"small"}
                    onClick={() => setJson(record)}
                  >
                    修改
                  </Button> */}
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
                    // okText="Yes"
                    // cancelText="No"
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
      >
        {/* {services?.length ? (
          services.map((servic) => (
            <ProCard
              key={servic.name}
              colSpan={colSpan}
              title={servic.name}
              extra={
                <Space>
                  <span onClick={() => setJson(servic)}>查看</span>
                  <Popconfirm
                    title="警告"
                    description="确定要删除吗？"
                    onConfirm={() => deleteService(servic)}
                    // okText="Yes"
                    // cancelText="No"
                  >
                    <span>删除</span>
                  </Popconfirm>
                </Space>
              }
            >
              <pre>{JSON.stringify(servic)}</pre>
            </ProCard>
          ))
        ) : (
          <ProCard>无数据</ProCard>
        )} */}
      </Table>
      <div>
        <JsonForm
          title="添加 Services"
          layoutType="ModalForm"
          trigger={<Button>{"添加服务"}</Button>}
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
export default Services;
