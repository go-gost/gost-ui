import { useContext } from "react";
import JsonForm from "./Json";
import { Button } from "antd";
import { getRESTfulApi } from "../../api";
import { PlusOutlined } from "@ant-design/icons";
import { CardCtx } from "../../uitls/ctx";
import { jsonParse } from "../../uitls";
import { GostCommit } from "../../api/local";
import { UseTemplates } from "../ListCard/hooks";

type Props = {
  name: string;
  title: string;
  api: ReturnType<typeof getRESTfulApi>;
  localApi?: GostCommit;
  keyName?: string;
};

const AddButton: React.FC<Props> = (props) => {
  const { name, title } = props;
  const { comm } = useContext(CardCtx);
  const templates = UseTemplates({ name });
  
  return (
    <JsonForm
      title={`添加 ${title || ""}`}
      templates={templates}
      trigger={<Button icon={<PlusOutlined />} size="small" />}
      onFinish={async (values: any) => {
        const { value } = values;
        const json = jsonParse(value);
        await comm!.addValue(json);
        return true
      }}
    ></JsonForm>
  );
};
export default AddButton;
