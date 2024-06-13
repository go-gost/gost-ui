import { getByName } from "./default";
import { getOtherAll } from "./otherOrigin";
import { Template } from "./type";

const {def, docUrl, _docUrl }= getByName("rlimiter");

export default [
  def
    ? def
    : {
        label: { zh: "内联", en: "Inline" },
        json:
          _docUrl +
          `
    {
      "name": "rlimiter-0",
      "limits": [
        "$ 100",
        "$$ 10",
        "192.168.1.1  50",
        "192.168.0.0/16  5"
      ]
    }`,
      },
  ...getOtherAll("rlimiter", docUrl, {
    redisType: "set",
  }),
] as Template[];
