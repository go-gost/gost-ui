import { getByName } from "./default";
import { getOtherAll } from "./otherOrigin";
import { Template } from "./type";

const {def, docUrl, _docUrl }= getByName("bypasses");

export default [
  def
    ? def
    : {
        label: { zh: "内联", en: "Inline" },
        json: _docUrl + `
      {
        "name": "bypass-0",
        "matchers": [
          "127.0.0.1",
          "172.10.0.0/16",
          "localhost",
          "*.example.com",
          ".example.org"
        ]
      }`,
      },
  ...getOtherAll("bypass", docUrl),
] as Template[];
