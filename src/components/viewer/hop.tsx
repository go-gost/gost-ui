import { useContext } from "react";
import { Config, HopConfig, NodeConfig } from "../../api/types";
import { viewNode, ViewNode } from "./node";
import Ctx, { getCommByName } from "../../uitls/ctx";
import { Space, Tag, Tooltip } from "antd";
import { UpdateCtx } from "../List/Public";
import { useServerConfig } from "../../uitls/server";

export default function viewHop(this: Partial<Config>, hop: HopConfig) {
  let _hop = hop;
  if (!_hop.nodes) {
    _hop = this?.hops?.find((item) => item.name === _hop.name) || _hop;
  }
  const { nodes } = _hop;
  if (nodes?.length <= 0) return `[${hop.name}(noNodes)]`;
  const _nodes = nodes.map(viewNode.bind(this));
  return _nodes.join(",");
}

export function viewHops(this: Partial<Config>, hops: HopConfig[]) {
  return hops.map(viewHop.bind(this)).join(" -> ");
}

export const ViewHop = (props: HopConfig) => {
  let _hop = props;
  let isLink = false;
  const { gostConfig, localConfig } = useContext(Ctx);
  if (!_hop.nodes) {
    const linkHop = [
      ...(gostConfig?.hops || []),
      ...(localConfig?.hops || []),
    ].find((item) => item.name === _hop.name);
    if (linkHop) {
      isLink = true;
      _hop = linkHop;
    }
  }
  const { nodes } = _hop;
  if (!nodes || nodes?.length <= 0) return `[${props.name}(noNodes)]`;

  if (isLink) {
    const isEnable = gostConfig?.hops?.includes(_hop);
    const key = _hop.name;
    // try {
    //   render = renderConfig(value, record, index);
    // } catch (e) {
    //   render = defaultRenderConfig(value, record, index);
    // }
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
        <Space size={5}>
          {nodes.map((node, i) => (
            <ViewNode key={i} node={node} isLink upjson={(newNode: NodeConfig) => (nodes[i] = newNode)} />
          ))}
        </Space>
      </UpdateCtx.Provider>
    );
  }

  return (
    <Space size={5}>
      {nodes.map((node, i) => (
        <ViewNode
          key={node.name + i}
          node={node}
          upjson={(newNode: NodeConfig) => (nodes[i] = newNode)}
        />
      ))}
    </Space>
  );
};
