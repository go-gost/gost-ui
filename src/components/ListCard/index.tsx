import { getRESTfulApi } from "../../api";
import { ProCard } from "@ant-design/pro-components";
import PublicList from "../List/Public";
import AddButton from "../Forms/AddButton";

export type ListCardProps = {
  name: string;
  title: string;
  subTitle: string;
  api: ReturnType<typeof getRESTfulApi>;
  keyName?: string;
  boxShadow?: boolean;
  bordered?: boolean;
};

const ListCard: React.FC<ListCardProps> = (props) => {
  const {
    title,
    subTitle,
    name,
    api,
    boxShadow = true,
    bordered = false,
    keyName = "name",
  } = props;
  const _prop = {
    title: subTitle,
    name,
    api,
    keyName,
  };
  return (
    <ProCard
      boxShadow={boxShadow}
      bordered={bordered}
      title={title}
      extra={<AddButton {..._prop} />}
    >
      <PublicList {..._prop}></PublicList>
    </ProCard>
  );
};
export default ListCard;
