import { getByName } from "./default";
import { getOtherAll } from "./otherOrigin";
import { Template } from "./type";

const def = getByName("observers");
export default [
  def
    ? def
    : {
    label: "插件",
    json: `
      // https://gost.run/concepts/observer/
      {
        "name": "observer-0",
        "plugin": {
          "type": "grpc",
          // "type": "http",
          "addr": "127.0.0.1:8000",
          "token": "gost",
          // "tls": {}
        }
      }`,
  },
] as Template[];
