import { chains } from "../../api";
import { ChainConfig } from "../../api/types";
import ListCard from ".";

const record = (value: any, record: ChainConfig, index: number) => {
  const { hops } = record;
  const _hops = hops.map((hop) => {
    const { nodes } = hop;
    const _nodes = nodes.map((node) => {
      const {
        addr,
        connector: { type: connectorType },
        dialer: { type: dialerType },
      } = node;
      return `${connectorType}${dialerType ? "+" + dialerType : ""}://${addr}`;
    });
    return _nodes.join(",");
  });
  return _hops.join(" -> ");
};
const ChainCard: React.FC = (props) => {
  const _prop = {
    title: "转发链(Chain)",
    subTitle: "转发链",
    name: "chains",
    api: chains,
    keyName: "name",
    renderConfig: record,
  };
  return <ListCard {..._prop} />;
};
export default ChainCard;
