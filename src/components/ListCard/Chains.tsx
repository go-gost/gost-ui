import { getRESTfulApi, chains } from "../../api";
import { ProCard } from "@ant-design/pro-components";
import PublicList from "../List/Public";
import AddButton from "../Forms/AddButton";
import { ChainConfig } from "../../api/types";

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
    title: "转发链",
    name: "chains",
    api: chains,
    keyName: "name",
  };
  return (
    <ProCard
      boxShadow={true}
      bordered={false}
      title={"转发链(Chain)"}
      extra={<AddButton {..._prop} />}
    >
      <PublicList {..._prop} renderConfig={record}></PublicList>
    </ProCard>
  );
};
export default ChainCard;
