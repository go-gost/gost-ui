import { getByName } from "./default";
import { getOtherAll } from "./otherOrigin";
import { Template } from "./type";

const {def, docUrl, _docUrl }= getByName("limiters");

export default [
  def
    ? def
    : {
        label: { zh: "内联", en: "Inline" },
        json:
          _docUrl +
          `
    {
      "name": "limiter-0",
      "limits": [
        "$ 100MB 100MB",
        "$$ 10MB",
        "192.168.1.1  512KB 1MB",
        "192.168.0.0/16  1MB  5MB"
      ]
    }`,
      },
  ...getOtherAll("limiters", docUrl, {
    redisType: "set",
  }),
] as Template[];
