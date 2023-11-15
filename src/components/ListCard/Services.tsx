import { services } from "../../api";
import { ProCard } from "@ant-design/pro-components";
import PublicList from "../List/Public";
import AddButton from "../Forms/AddButton";
import { ServiceConfig } from "../../api/types";
import qs from "qs";

const record = (value: any, record: ServiceConfig, index: number) => {
  const { handler, listener, addr, forwarder } = record;
  const xy =
    handler.type === listener.type
      ? handler.type
      : handler.type + "+" + listener.type;
  const auth = handler.auth
    ? handler.auth.username + ":" + handler.auth.password + "@"
    : "";
  const metadata = handler.metadata
    ? qs.stringify(handler.metadata)
    : "";
  const targets =
    forwarder?.nodes.map((item) => item.addr).join(",") || "";

  return `${xy}://${auth}${addr}${targets ? "/" + targets : ""}${
    metadata ? "?" + metadata : ""
  }`;
};
const ServiceCard: React.FC = (props) => {
  const _prop = {
    title: "服务",
    name: "services",
    api: services,
    keyName: "name",
  };
  return (
    <ProCard
      boxShadow={true}
      bordered={false}
      title={"服务(Service)"}
      extra={<AddButton {..._prop} />}
    >
      <PublicList {..._prop} renderConfig={record}></PublicList>
    </ProCard>
  );
};
export default ServiceCard;
