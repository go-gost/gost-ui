import { Config, HopConfig } from "../../api/types";
import viewNode from "./node";

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
