import { getByName } from "./default";
import { getOtherAll } from "./otherOrigin";
import { Template } from "./type";

const {def, docUrl, _docUrl }= getByName("ingresses");

export default [
  def
    ? def
    : {
    label: { zh: "内联", en: "Inline" },
    json: _docUrl + `{
        "name": "ingress-0",
        "rules": [
          {
            "hostname": "example.com",
            "endpoint": "4d21094e-b74c-4916-86c1-d9fa36ea677b"
          },
          {
            "hostname": "example.org",
            "endpoint": "ac74d9dd-3125-442a-a7c1-f9e49e05faca"
          }
        ]
      }`,
  },
  ...getOtherAll("ingress", docUrl, {
    redisType: "hash",
  }),
] as Template[];
