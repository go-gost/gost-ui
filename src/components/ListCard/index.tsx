import {
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import { getRESTfulApi } from "../../api";
import { ProCard } from "@ant-design/pro-components";
import PublicList from "../List/Public";
import AddButton from "../Forms/AddButton";
import { GostCommit } from "../../api/local";
import { CardCtx, Comm } from "../../uitls/ctx";
import { jsonParse } from "../../uitls";
import { UseListData } from "./hooks";
import { Modal, notification } from "antd";

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
  const addService = useCallback(
    async (servic: any) => {
      const data = jsonParse(servic);
      await api.post(data);
    },
    [api]
  );
  useEffect(() => {
    updateLocalList();
  }, [updateLocalList]);

  const { dataSource } = UseListData({ name, localList });

  const comm = useMemo<Comm>(
    () => ({
      updateValue: async (id: string, value: any) => {
        const data = jsonParse(value);
        await api.put(id, data);
      },
      deleteValue: async (value: any) => {
        await api.delete(value.name);
      },
      addValue: async (json: any) => {
        let addName = json.name || `${name}-0`;
        const hasName = () => {
          return dataSource?.find((item: any) => {
            return item.name === addName;
          });
        };
        if (hasName()) {
          const confirmed = await new Promise((resolve, reject) => {
            Modal.confirm({
              title: "name无效",
              content: "是否自动分配name",
              zIndex: 2000,
              onOk: () => resolve(true),
              onCancel: () => resolve(false),
            });
          });
          if (!confirmed) throw false;
        }
        while (hasName()) {
          addName = (addName as string).replace(/\d*$/, (a) => {
            return String(a == "" ? "-0" : Number(a) + 1);
          });
        }
        await addService(JSON.stringify({ ...json, name: addName }));
        (json.name !== addName) &&
          notification.info({
            description: `新分配 name 为 "${addName}"`,
            message: "自动修正提醒",
          });
      },
      dispatch: async (value: any) => {
        if (!localApi) return;
        await api.delete(value.name);
        await localApi.add(value);
        updateLocalList?.();
      },
      enable: async (value: any) => {
        if (!localApi) return;
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
    }),
    [addService, api, dataSource, localApi, name, updateLocalList]
  );

  return (
    <CardCtx.Provider value={{ localList, updateLocalList, name, comm }}>
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
