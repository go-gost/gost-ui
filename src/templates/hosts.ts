import { getByName } from "./default";
import { getOtherAll } from "./otherOrigin";
import { Template } from "./type";

const {def, docUrl, _docUrl }= getByName("hosts");

export default [
  def
    ? def
    : {
        label: { zh: "内联", en: "Inline" },
        json:
          _docUrl +
          `
{
  "name": "hosts-0",
  "mappings": [
    {
      "ip": "127.0.0.1",
      "hostname": "example.com"
    },
    {
      "ip": "2001:db8::1",
      "hostname": "example.com"
    }
  ]
}`,
      },
  ...getOtherAll("hosts", docUrl),
] as Template[];
