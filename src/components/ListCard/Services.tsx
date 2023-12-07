import { services } from "../../api";
import { services as localServices } from "../../api/local";
import { ServiceConfig } from "../../api/types";
import qs from "qs";
import ListCard from ".";
import { useContext } from "react";
import Ctx from "../../uitls/ctx";
import viewService from "../viewer/services";

// const record = (value: any, record: ServiceConfig, index: number) => {
//   const { handler, listener, addr, forwarder } = record;
//   const xy =
//     handler.type === listener.type
//       ? handler.type
//       : handler.type + "+" + listener.type;
//   const auth = handler.auth
//     ? handler.auth.username + ":" + handler.auth.password + "@"
//     : "";
//   const metadata = handler.metadata ? qs.stringify(handler.metadata) : "";
//   const targets = forwarder?.nodes.map((item) => item.addr).join(",") || "";

//   return `${xy}://${auth}${addr}${targets ? "/" + targets : ""}${
//     metadata ? "?" + metadata : ""
//   }`;
// };
const ServiceCard: React.FC = (props) => {
  const { gostConfig } = useContext(Ctx);
  const _prop = {
    title: "服务(Service)",
    subTitle: "服务",
    name: "services",
    api: services,
    keyName: "name",
    localApi: localServices,
    renderConfig: (value: any, record: ServiceConfig, index: number) => {
      return viewService.call(gostConfig!, record);
    },
  };
  return <ListCard {..._prop} />;
};
export default ServiceCard;
