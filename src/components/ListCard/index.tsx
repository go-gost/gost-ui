import { getRESTfulApi } from "../../api";
import { ProCard } from "@ant-design/pro-components";
import PublicList from "../List/Public";
import AddButton from "../Forms/AddButton";
import { GostCommit } from "../../api/local";
import { CardCtx } from "../../uitls/ctx";
import { useCallback, useEffect, useState } from "react";

export type ListCardProps = {
  name: string;
  title: string;
  subTitle: string;
  api: ReturnType<typeof getRESTfulApi>;
  keyName?: string;
  boxShadow?: boolean;
  bordered?: boolean;
  localApi?: GostCommit;
  renderConfig?: (v: any, r: any, i: number) => React.ReactNode;
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
    renderConfig,
    localApi,
  } = props;
  const _prop = {
    title: subTitle,
    name,
    api,
    keyName,
    localApi,
    renderConfig,
  };
  const [localList, setLocalList] = useState<any[]>([]);
  const updateLocalList = useCallback(() => {
    if (!localApi) return;
    localApi.getList().then((data) => {
      // console.log("updateLocalList", data);
      setLocalList(data);
    });
  }, [localApi]);
  useEffect(() => {
    updateLocalList();
  }, [updateLocalList]);

  return (
    <CardCtx.Provider value={{ localList, updateLocalList }}>
      <ProCard
        boxShadow={boxShadow}
        bordered={bordered}
        title={title}
        extra={<AddButton {..._prop} />}
      >
        <PublicList {..._prop}></PublicList>
      </ProCard>
    </CardCtx.Provider>
  );
};
export default ListCard;
