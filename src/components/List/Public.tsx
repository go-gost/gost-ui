import { useContext, useMemo, useRef } from "react";
import { Button, Popconfirm, Space, Table } from "antd";
import { red, green } from "@ant-design/colors";
import Ctx from "../../uitls/ctx";
import { getRESTfulApi } from "../../api";
import JsonForm from "../Forms/Json";
import { jsonFormat, jsonParse } from "../../uitls";
import templates from "../../uitls/templates";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { GostCommit } from "../../api/local";
import { CardCtx } from "../../uitls/ctx";

type Props = {
  name: string;
  title: string;
  api: ReturnType<typeof getRESTfulApi>;
  localApi?: GostCommit;
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
    localApi,
    keyName = "name",
    renderConfig = defaultRenderConfig,
  } = props;
  const { gostConfig } = useContext(Ctx);
  const { localList, updateLocalList } = useContext(CardCtx);
  const dataList = (gostConfig as any)?.[name] || [];
  const dataSource = [...dataList, ...localList];
  const ts = useMemo(() => {
    return templates[name];
  }, [name]);

  const comm = useRef({
    updateValue: async (id: string, value: any) => {
      const data = jsonParse(value);
      await api.put(id, data);
    },
    deleteValue: async (value: any) => {
      await api.delete(value.name);
    },
    dispatch: async (value: any) => {
      const { deleteValue } = comm.current;
      if (!localApi) return;
      await deleteValue(value);
      await localApi.add(value);
      updateLocalList?.();
    },
    enable: async (value: any) => {
      if (!localApi) return;
      // console.log("enable", value);
      await api.post(value);
      await localApi.delete(value.name);
      updateLocalList?.();
    },
    updateLocal: async (key: string, value: any) => {
      if (!localApi) return;
      const data = jsonParse(value);
      await localApi.put(key, { ...data, name: key });
      updateLocalList?.();
    },
    deleteLocal: async (value: any) => {
      if (!localApi) return;
      await localApi.delete(value.name);
      updateLocalList?.();
    },
  });

  return (
    <div style={{ height: 348, overflow: "auto" }}>
      <Table
        scroll={{ y: 246 }}
        size="small"
        dataSource={dataSource}
        columns={[
          { title: keyName, dataIndex: keyName, ellipsis: true, width: 100 },
          {
            title: "详情",
            ellipsis: true,
            render: renderConfig,
          },
          {
            title: "操作",
            width: 90,
            align: "right",
            dataIndex: keyName,
            render: (value, record, index) => {
              // console.log("render", record);
              const {
                deleteValue,
                updateValue,
                dispatch,
                enable,
                updateLocal,
                deleteLocal,
              } = comm.current;
              const isEnable = dataList.includes(record);
              return (
                <Space size={2}>
                  {localApi ? (
                    isEnable ? (
                      <Button
                        title="点击禁用"
                        icon={
                          <CheckCircleOutlined
                            style={{ color: green.primary }}
                          />
                        }
                        type="link"
                        size={"small"}
                        onClick={async () => {
                          await dispatch(record);
                        }}
                      >
                        {/* 禁用 */}
                      </Button>
                    ) : (
                      <Button
                        title="点击启用"
                        type="link"
                        icon={<StopOutlined style={{ color: red.primary }} />}
                        size={"small"}
                        onClick={async () => {
                          await enable(record);
                        }}
                      >
                        {/* 启用 */}
                      </Button>
                    )
                  ) : null}
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
                      if (isEnable) {
                        await updateValue(record.name, value);
                        return true;
                      } else {
                        await updateLocal(record.name, value);
                        return true;
                      }
                    }}
                  ></JsonForm>
                  <Popconfirm
                    title="警告"
                    description="确定要删除吗？"
                    onConfirm={() => {
                      if (isEnable) {
                        deleteValue(record);
                      } else {
                        deleteLocal(record);
                      }
                    }}
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
    </div>
  );
};
export default PublicList;
