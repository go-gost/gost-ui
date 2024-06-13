import { useContext, useMemo } from "react";
import {
  ChainConfig,
  Config,
  ForwarderConfig,
  NodeConfig,
  ServiceConfig,
} from "../../api/types";
import qs from "qs";
import Ctx, { getCommByName } from "../../uitls/ctx";
import { UpdateCtx } from "../List/Public";
import { Space, Tag, Tooltip } from "antd";
import { ViewNode } from "./node";
import { ViewChain } from "./chain";
import { useTranslation } from "react-i18next";

export default function viewService(
  this: Partial<Config>,
  service: ServiceConfig
) {
  const { handler, listener, addr, forwarder } = service;
  const xy =
    handler.type === listener.type
      ? handler.type
      : handler.type + "+" + listener.type;
  const auth = handler.auth
    ? handler.auth.username + ":" + handler.auth.password + "@"
    : "";
  const metadata = handler.metadata ? qs.stringify(handler.metadata) : "";
  const targets = forwarder?.nodes?.map((item) => item.addr).join(",") || "";

  return `${xy}://${auth}${addr}${targets ? "/" + targets : ""}${
    metadata ? "?" + metadata : ""
  }`;
}

const useGetItem: (
  name: string,
  modle: Exclude<keyof Config, "api" | "log" | "tls" | "metrics" | "profiling">
) => [any, boolean] = (name, modle) => {
  const { gostConfig, localConfig } = useContext(Ctx);
  const gItem = useMemo(
    () => gostConfig?.[modle]?.find((item) => item.name === name),
    [gostConfig, name, modle]
  );
  const lItem = useMemo(
    () => localConfig?.[modle]?.find((item) => item.name === name),
    [localConfig, name, modle]
  );
  const item = gItem ?? lItem;
  return [item, !!gItem];
};

export const ViewForwarder = (forwarder: ForwarderConfig) => {
  const [itemHop, isEnable] = useGetItem(forwarder.name, "hops");
  let _hop = forwarder;
  let isLink = false;
  if (!_hop.nodes) {
    _hop = itemHop;
    isLink = !!itemHop;
  }
  const { nodes } = _hop;
  if (!nodes || nodes?.length <= 0) return `[${forwarder.name}(noNodes)]`;
  const vNodes = (
    <Space size={5}>
      {nodes.map((node, i) => (
        <ViewNode
          key={node.name + i}
          node={node as any}
          upjson={(newNode: NodeConfig) => (nodes[i] = newNode)}
        />
      ))}
    </Space>
  );
  if (isLink) {
    const key = _hop.name;
    return (
      <UpdateCtx.Provider
        value={{
          update: async (v) => {
            const comm = await getCommByName("hop");
            const update = isEnable
              ? (value?: any) => comm.updateValue(key, value || _hop)
              : (value?: any) => comm.updateLocal(key, value || _hop);
            return update(v);
          },
        }}
      >
        {vNodes}
      </UpdateCtx.Provider>
    );
  }

  return vNodes;
};

export const ViewByChain = (props: { chainName: string }) => {
  const [chain, enabled] = useGetItem(props.chainName, "chains");
  if (!chain) return `[no chain]`;
  const key = props.chainName;
  return (
    <UpdateCtx.Provider
      value={{
        update: async (v) => {
          const comm = await getCommByName("chain");
          const update = enabled
            ? (value?: any) => comm.updateValue(key, value || chain)
            : (value?: any) => comm.updateLocal(key, value || chain);
          return update(v);
        },
      }}
    >
      <ViewChain {...chain} />
    </UpdateCtx.Provider>
  );
};

export const ViewService: React.FC<ServiceConfig> = (service) => {
  const { name, addr, handler, listener, forwarder } = service;
  const { t } = useTranslation();

  const type = useMemo(() => {
    const hType = handler?.type;
    const lType = listener?.type;
    return hType === lType ? hType : `${hType}+${lType}`;
  }, [handler, listener]);

  return (
    <Space>
      <Tag color="#87d068">{type}</Tag>
      <Tag color="green">{addr}</Tag>
      {handler.chain && (
        <Tooltip
          title={<ViewByChain chainName={handler.chain} />}
          color="#c7e7ff"
          arrow={false}
        >
          <Tag>{t("modules.chain.subTitle")}</Tag>
        </Tooltip>
      )}
      {listener.chain && (
        <Tooltip
          title={<ViewByChain chainName={listener.chain} />}
          color="#fff0d7"
          arrow={false}
        >
          <Tag color="orange">{t("terms.key0")}</Tag>
        </Tooltip>
      )}
      {forwarder && (
        <Tooltip
          title={<ViewForwarder {...forwarder} />}
          color="#c7e7ff"
          arrow={false}
        >
          <Tag>{t("terms.forwarder")}</Tag>
        </Tooltip>
      )}
    </Space>
  );
};
