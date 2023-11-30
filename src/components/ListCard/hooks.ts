import Ctx, { CardCtx } from "../../uitls/ctx";
import ConfigTemplates from "../../uitls/templates";
import { useContext, useMemo } from "react";

type UseListDataProps = {
  name: string;
  localList?: any[];
};

export const UseTemplates = (props: { name: string }) => {
  const { name } = props;
  const templates = useMemo(() => {
    return ConfigTemplates[name];
  }, [name]);
  return templates;
};

export const UseListData = (props: UseListDataProps) => {
  const { localList = [], name } = props;
  const { gostConfig } = useContext(Ctx);
  const dataList = useMemo(
    () => (gostConfig as any)?.[name] || [],
    [gostConfig, name]
  );
  const dataSource = useMemo(
    () => [...dataList, ...localList],
    [dataList, localList]
  );
  return {
    dataList,
    dataSource,
  };
};
