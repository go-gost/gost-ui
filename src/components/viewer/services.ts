import { Config, ServiceConfig } from "../../api/types";
import qs from "qs";

export default function viewService(this: Partial<Config>, service: ServiceConfig){
    const { handler, listener, addr, forwarder } = service;
    const xy =
        handler.type === listener.type
        ? handler.type
        : handler.type + "+" + listener.type;
    const auth = handler.auth
        ? handler.auth.username + ":" + handler.auth.password + "@"
        : "";
    const metadata = handler.metadata ? qs.stringify(handler.metadata) : "";
    const targets = forwarder?.nodes.map((item) => item.addr).join(",") || "";

    return `${xy}://${auth}${addr}${targets ? "/" + targets : ""}${
        metadata ? "?" + metadata : ""
    }`;
}