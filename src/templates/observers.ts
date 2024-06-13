import { getByName } from "./default";
// import { getOtherAll } from "./otherOrigin";
import { Template } from "./type";

const {def, docUrl, _docUrl }= getByName("observers");

export default [
  def
    ? def
    : {
    label: "Plugin",
    json: _docUrl + `
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
