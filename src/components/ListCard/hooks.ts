import Ctx, { CardCtx } from "../../uitls/ctx";
import ConfigTemplates from "../../templates";
import { useContext, useMemo } from "react";

type UseListDataProps = {
  name: string;
  localList?: any[];
  localApi?: any;
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
  const { gostConfig, localConfig } = useContext(Ctx);
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

export const UseListData1 = (props: UseListDataProps) => {
  const { name, localApi } = props;
  const { gostConfig, localConfig } = useContext(Ctx);
  const dataList = useMemo(
    () => (gostConfig as any)?.[name] || [],
    [gostConfig, name]
  );
  const localList = useMemo(
    () => localApi ? (localConfig as any)?.[name] || [] : [],
    [localConfig, name, localApi]
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
