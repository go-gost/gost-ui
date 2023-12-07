import qs from "qs";
import { Config, NodeConfig } from "../../api/types";

export default function viewNode(this: Partial<Config>, data: NodeConfig) {
  const {
    name,
    addr,
    connector: { type: connectorType, metadata },
    dialer: { type: dialerType },
  } = data;

  const _metadata = metadata ? qs.stringify(metadata) : "";
  return `${connectorType}${dialerType ? "+" + dialerType : ""}://${addr}${
    _metadata ? "?" + _metadata : ""
  }`;
}
