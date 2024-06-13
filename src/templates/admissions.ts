import { getByName } from "./default";
import { getOtherAll } from "./otherOrigin";
import { Template } from "./type";
const {def, docUrl, _docUrl }= getByName("admissions");

export default [
  def
    ? def
    : {
        label: { zh: "内联", en: "Inline" },
        json: _docUrl + `
      {
        "name": "admission-0",
        "matchers": [
          "127.0.0.1",
          "192.168.0.0/16",
          "example.com"
        ]
      }`,
      },
  ...getOtherAll("admission", docUrl),
] as Template[];
