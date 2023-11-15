import { useContext, useEffect, useMemo, useState } from "react";
import { Button, Popconfirm, Space, Table } from "antd";
import Ctx from "../../uitls/ctx";
import * as API from "../../api";
import JsonForm from "../Forms/Json";
import { ChainConfig } from "../../api/types";
import { jsonFormat } from "../../uitls";
import templates from "../../uitls/templates";

const Chains: React.FC = () => {
  const { gostConfig, updateConfig } = useContext(Ctx);
  const { chains } = gostConfig || {};
  const [json, setJson] = useState<any>(null);
  const [config, setConfig] = useState("");
  const ts = useMemo(() => {
    return templates["chains"];
  }, []);

  useEffect(() => {
    if (json) {
      setConfig(JSON.stringify(json));
    }
  }, [json]);

  const addService = async (servic: any) => {
    const data = JSON.parse(servic);
    await API.chains.post(data);
  };

  const updateService = async (id: string, servic: any) => {
    const data = JSON.parse(servic);
    await API.chains.put(id, data);
  };

  const deleteService = async (servic: any) => {
    if (json === servic) {
      setJson(null);
    }
    await API.chains.delete(servic.name);
  };

  return (
    <div style={{ height: 230, overflow: "auto" }}>
      <Table
        size="small"
        dataSource={chains}
        columns={[
          { title: "Name", dataIndex: "name", width: 100 },
          {
            title: "详情",
            ellipsis: true,
            render: (value, record: ChainConfig, index) => {
              const { hops } = record;
              const _hops = hops.map((hop) => {
                const { nodes } = hop;
                const _nodes = nodes.map((node) => {
                  const {
                    addr,
                    connector: { type: connectorType, auth },
                    dialer: { type: dialerType },
                  } = node;
                  const _auth = auth
                    ? auth.username + ":" + auth.password + "@"
                    : "";
                  return `${connectorType}${
                    dialerType ? "+" + dialerType : ""
                  }://${_auth}${addr}`;
                });
                return _nodes.join(",");
              });
              return _hops.join(" -> ");
            },
          },
          {
            title: "操作",
            width: 120,
            render: (value, record, index) => {
              return (
                <Space size={"small"}>
                  <JsonForm
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
          title="添加 Chains"
          templates={ts}
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
export default Chains;
