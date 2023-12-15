import { useContext } from "react";
import { Button, Popconfirm, Space, Table } from "antd";
import { red, green } from "@ant-design/colors";
import { getRESTfulApi } from "../../api";
import JsonForm from "../Forms/Json";
import { jsonFormat, jsonParse } from "../../uitls";
import {
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { GostCommit } from "../../api/local";
import { CardCtx } from "../../uitls/ctx";
import { UseListData, UseTemplates } from "../ListCard/hooks";

type Props = {
  name: string;
  title: string;
  api: ReturnType<typeof getRESTfulApi>;
  localApi?: GostCommit;
  keyName: string;
  rowKey?: string;
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
    keyName, 
    rowKey = "name",
    renderConfig = defaultRenderConfig,
  } = props;
  const { localList, comm } = useContext(CardCtx);
  const { dataList, dataSource } = UseListData({ localList, name: keyName });
  const templates = UseTemplates({ name: keyName });

  return (
    <div style={{ height: 348, overflow: "auto" }}>
      <Table
        rowKey={(obj) => obj.id || obj.name}
        scroll={{ y: 246 }}
        size="small"
        dataSource={dataSource}
        columns={[
          { title: rowKey, dataIndex: rowKey, ellipsis: true, width: 100 },
          {
            title: "详情",
            ellipsis: true,
            render: (...args) => {
              try {
                return renderConfig(...args);
              } catch (e) {
                return defaultRenderConfig(...args);
              }
            },
          },
          {
            title: "操作",
            width: localApi ? 120 : 90,
            align: "right",
            dataIndex: rowKey,
            render: (value, record, index) => {
              // console.log("render", record);
              const {
                deleteValue,
                updateValue,
                dispatch,
                enable,
                updateLocal,
                deleteLocal,
                addValue,
                // } = comm.current;
              } = comm!;
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
                    templates={templates}
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
                  <JsonForm
                    title={`复制自 ${value || ""}`}
                    templates={templates}
                    trigger={
                      <Button
                        title="复制"
                        icon={<CopyOutlined />}
                        type="link"
                        size={"small"}
                      />
                    }
                    initialValues={{ value: jsonFormat(record) }}
                    onFinish={async (values: any) => {
                      const { value } = values;
                      const json = jsonParse(value);
                      await comm!.addValue(json);
                      return true;
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
