import { useContext, useMemo } from "react";
import JsonForm from "./Json";
import templates from "../../uitls/templates";
import { Button, message } from "antd";
import { getRESTfulApi } from "../../api";
import { PlusOutlined } from "@ant-design/icons";
import Ctx from "../../uitls/ctx";

type Props = {
  name: string;
  title: string;
  api: ReturnType<typeof getRESTfulApi>;
  keyName?: string;
};

const AddButton: React.FC<Props> = (props) => {
  const { name, title, api } = props;
  const { gostConfig, updateConfig } = useContext(Ctx);
  const dataList = (gostConfig as any)?.[name] || [];
  const ts = useMemo(() => {
    return templates[name];
  }, []);

  const addService = async (servic: any) => {
    const data = JSON.parse(servic);
    await api.post(data);
  };

  return (
    <JsonForm
      title={`添加 ${title || ""}`}
      templates={ts}
      trigger={<Button icon={<PlusOutlined />} size="small" />}
      onFinish={async (values: any) => {
        // const { value } = values;
        // await addService(value);
        // return true;

        const { value } = values;
        const json = JSON.parse(value);
        let addName = json.name || `${name}-0`;
        let rename = json.name ? false : true;
        const hasName = () => {
          return dataList?.find((item: any) => {
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
        rename && message.info(`已自动处理 name 为 "${addName}"`);
        return true;
      }}
    ></JsonForm>
  );
};
export default AddButton;
