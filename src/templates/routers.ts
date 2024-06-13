import { getByName } from "./default";
import { getOtherAll } from "./otherOrigin";
import { Template } from "./type";

const {def, docUrl, _docUrl }= getByName("routers");

export default [
  def
    ? def
    : {
    label: { zh: "内联", en: "Inline" },
    json: _docUrl + `
      {
        "name": "router-0",
        "routes": [
          {
            "net": "192.168.1.0/24",
            "gateway": "192.168.123.2"
          },
          {
            "net": "172.10.0.0/16",
            "gateway": "192.168.123.3"
          }
        ]
      }`,
  },
  ...getOtherAll("router", docUrl),
] as Template[];
