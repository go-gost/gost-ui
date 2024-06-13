import { getByName } from "./default";
import { getOtherAll } from "./otherOrigin";
import { Template } from "./type";

const {def, docUrl, _docUrl }= getByName("climiter");

export default [
  def
    ? def
    : {
        label: { zh: "内联", en: "Inline" },
        json: _docUrl + `
    {
      "name": "climiter-0",
      "limits": [
        "$ 1000",
        "$$ 100",
        "192.168.1.1  10"
      ]
    }`,
      },
  ...getOtherAll("climiter", docUrl, {
    redisType: "set",
  }),
] as Template[];
