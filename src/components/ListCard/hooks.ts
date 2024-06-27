import Ctx, { CardCtx } from "../../utils/ctx";
import ConfigTemplates from "../../templates";
import { useContext, useMemo } from "react";
import { useLocalConfig, useServerConfig } from "../../utils/server";

type UseListDataProps = {
  name: string;
  localList?: any[];
  localApi?: any;
  gostConfig?: any;
  localConfig?: any;
};

export const UseTemplates = (props: { name: string }) => {
  const { name } = props;
  const templates = useMemo(() => {
    return ConfigTemplates[name];
  }, [name]);
  return templates;
};

export const useListData = (
  props: Omit<UseListDataProps, "gostConfig" | "localConfig">
) => {
  const gostConfig = useServerConfig();
  const localConfig = useLocalConfig();
  return useListData1({ ...props, gostConfig, localConfig });
};

export const useListData1 = (props: UseListDataProps) => {
  const { name, localApi, gostConfig, localConfig } = props;
  const dataList = useMemo(
    () => (gostConfig as any)?.[name] || [],
    [gostConfig, name]
  );
  const localList = useMemo(
    () => (localApi ? (localConfig as any)?.[name] || [] : []),
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
