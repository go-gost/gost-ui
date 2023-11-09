import { useContext, useEffect, useState } from "react";
import { Button, Popconfirm, Space, Table } from "antd";
import Ctx from "../uitls/ctx";
import * as API from "../api";
import JsonForm from "../components/Forms/Json";
import { ChainConfig } from "../api/types";

const Chains: React.FC = () => {
  const { gostConfig, updateConfig } = useContext(Ctx);
  const { chains } = gostConfig || {};
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
      await API.chains.put(data.name, data);
    } else {
      await API.chains.post(data);
    }
  };

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
    <div>
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
                    connector: { type: connectorType },
                    dialer: { type: dialerType },
                  } = node;
                  return `${connectorType}${
                    dialerType ? "+" + dialerType : ""
                  }://${addr}`;
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
          title="添加 Chains"
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
export default Chains;
