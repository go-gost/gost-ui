import { getByName } from "./default";
import { Template } from "./type";

const {def, docUrl, _docUrl }= getByName("chains");

export default [
  def,
  {
    label: { zh: "典型转发链", en: "Typical" },
    cli: "",
    json:
      _docUrl +
      `
{
  "name": "chain-0",
  "hops": [
    {
      "name": "hop-0",
      "nodes": [
        {
          "name": "node-0",
          "addr": "proxy.xxx.com:1080",
          "connector": {
            "type": "socks5",
            "auth": {
              "username": "username",
              "password": "password"
            }
          },
          "dialer": {
            "type": "tcp",
            "tls": {
              "serverName": "proxy.xxx.com"
            }
          }
        }
      ]
    }
  ]
}
      `,
  },
] as Template[];
