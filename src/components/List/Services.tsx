import { useContext, useEffect, useMemo, useState } from "react";
import { Button, Popconfirm, Space, Table, message } from "antd";
import qs from "qs";
// import { ProTable, ProCard } from "@ant-design/pro-components";
import Ctx from "../../uitls/ctx";
import * as API from "../../api";
import JsonForm from "../Forms/Json";
import { ServiceConfig } from "../../api/types";
import templates from "../../uitls/templates";
import { jsonFormat, jsonParse } from "../../uitls";

const Services: React.FC = () => {
  const { gostConfig, updateConfig } = useContext(Ctx);
  const { services: dataList } = gostConfig || {};
  const [json, setJson] = useState<any>(null);
  const [config, setConfig] = useState("");
  const ts = useMemo(() => {
    return templates["services"];
  }, []);
  useEffect(() => {
    if (json) {
      setConfig(JSON.stringify(json));
    }
  }, [json]);

  const submit = async (v?: string) => {
    const data = jsonParse(v || config);
    if (json) {
      await API.services.put(data.name, data);
    } else {
      await API.services.post(data);
    }
  };

  const addService = async (servic: any) => {
    const data = jsonParse(servic);
    await API.services.post(data);
  };

  const updateService = async (id: string, servic: any) => {
    const data = jsonParse(servic);
    await API.services.put(id, data);
  };

  const deleteService = async (servic: any) => {
    if (json === servic) {
      setJson(null);
    }
    await API.services.delete(servic.name);
  };

  return (
    <div style={{ height: 230, overflow: "auto" }}>
      <Table
        size="small"
        dataSource={dataList}
        pagination={false}
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
              const targets =
                forwarder?.nodes.map((item) => item.addr).join(",") || "";

              return `${xy}://${auth}${addr}${targets ? "/" + targets : ""}${
                metadata ? "?" + metadata : ""
              }`;
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
                    templates={ts}
                    trigger={
                      <Button type="link" size={"small"}>
                        修改
                      </Button>
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
      ></Table>
      {/* <div>
        <JsonForm
          title="添加 Services"
          templates={ts}
          trigger={<Button>{"新增"}</Button>}
          // initialValues={{ value: "" }}
          onFinish={async (values: any) => {
            const { value } = values;
            const json = jsonParse(value);
            let addName = json.name || "services-0";
            let rename = json.name ? false : true;
            const hasName = () => {
              return dataList?.find((item) => {
                return item.name === addName;
              });
            };
            while (hasName()) {
              addName = (addName as string).replace(/\d*$/, (a) => {
                return String(a == "" ? "-0" : Number(a) + 1);
              });
              rename = true;
            }
            await addService(JSON.stringify({ ...json, name: addName }));
            rename && message.info(`name 已自动处理为 "${addName}"`);
            return true;
          }}
        ></JsonForm>
      </div> */}
    </div>
  );
};
export default Services;
