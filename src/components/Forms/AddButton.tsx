import { useContext } from "react";
import JsonForm from "./Json";
import { Button } from "antd";
import { getRESTfulApi } from "../../api";
import { PlusOutlined } from "@ant-design/icons";
import { CardCtx } from "../../uitls/ctx";
import { jsonParse } from "../../uitls";
import { GostCommit } from "../../api/local";
import { UseTemplates } from "../ListCard/hooks";
import { useTranslation } from "react-i18next";

type Props = {
  keyName: string;
  title: string;
};

const AddButton: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  const { keyName, title } = props;
  const { comm } = useContext(CardCtx);
  const templates = UseTemplates({ name: keyName! });

  const _props = {
    title: t("title.add", { name: title }),
    templates: templates,
    onFinish: async (values: any) => {
      const { value } = values;
      const json = jsonParse(value);
      await comm!.addValue(json);
      return true;
    },
  };

  // return (
  //   <JsonForm
  //     trigger={<Button icon={<PlusOutlined />} size="small" />}
  //     {..._props}
  //   ></JsonForm>
  // );
  
  return (
    <Button
      icon={<PlusOutlined />}
      size="small"
      onClick={() => {
        JsonForm.show(_props);
      }}
    />
  );
};
export default AddButton;
