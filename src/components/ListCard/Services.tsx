import { services } from "../../api";
import { services as localServices } from "../../api/local";
import { ServiceConfig } from "../../api/types";
import qs from "qs";
import ListCard from ".";
import { useContext } from "react";
import Ctx from "../../utils/ctx";
import viewService, { ViewService } from "../viewer/services";
import { getModule } from "../../api/modules";
import { useServerConfig } from "../../utils/server";
import { Col } from "antd";

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
const ServiceCard: React.FC<any> = (props) => {
  const { colSpan } = props;
  const gostConfig = useServerConfig();
  const _prop = {
    // ...getModule('services'),
    module: "service",
    // 定义渲染
    renderConfig: (value: any, record: ServiceConfig, index: number) => {
      // return viewService.call(gostConfig!, record);
      return <ViewService {...record} />;
    },
    // 定义筛选
    filter: (item: ServiceConfig, keyWord: string) => {
      const { name, addr, handler, listener } = item;

      function find(value?: string) {
        const v = value?.toLowerCase();
        if (v) {
          return v.indexOf(keyWord) !== -1;
        } else {
          return false;
        }
      }

      return (
        find(name) || find(addr) || find(handler?.type) || find(listener?.type)
      );
    },
  };
  return (
    <Col {...colSpan} xxl={16}>
      <ListCard {..._prop} />
    </Col>
  );
};
export default ServiceCard;
