import * as JSONC from "jsonc-parser";
import { getByName } from "./default";
import { Template } from "./type";

const {def, docUrl, _docUrl }= getByName("services");

const getProxyJson = (
  handlerType: string,
  listenerType: string,
  metadata?: object
) => {
  let jsonc =
    _docUrl +
    `
  {
    "name": "service-0",
    "addr": ":1080",
    "handler": {
      "type": "${handlerType}",
      // "auth": {
      //   "username": "user",
      //   "password": "password"
      // }
    },
    "listener": {
      "type": "${listenerType}"
    }
  }`;
  if (metadata) {
    const edits = JSONC.modify(jsonc, ["metadata"], metadata, {});
    edits.push(...JSONC.modify(jsonc, ["handler", "metadata"], metadata, {}));
    edits.push(...JSONC.modify(jsonc, ["listener", "metadata"], metadata, {}));
    // edits.push(...JSONC.modify(jsonc, ["name"], undefined, {})) // undefined 可删除
    jsonc = JSONC.applyEdits(jsonc, edits);
  }

  return jsonc;
};

export default [
  def,
  {
    label: { zh: "端口转发", en: "Port Forwarding" },
    cli: "-L tcp://:80/:8080",
    json:
      _docUrl +
      `
      {
        "name": "service-0",
        "addr": ":80",
        "handler": {
          "type": "tcp"
        },
        "listener": {
          "type": "tcp"
        },
        "forwarder": {
          "nodes": [
            {
              "name": "target-0",
              "addr": ":8080"
            }
          ]
        }
      }`,
  },
  {
    label: { zh: "反向代理", en: "Reverse Proxy" },
    cli: "",
    json:
      _docUrl +
      `
      {
        "name": "service-0",
        "addr": ":80",
        "handler": {
            "type": "tcp",
            "metadata": {
                "sniffing": "true"
            }
        },
        "listener": {
            "type": "tcp"
        },
        "forwarder": {
            "nodes": [
                {
                    "name": "target-1",
                    "addr": "www.baidu.com:80",
                    // "host": "myhost.com",
                    // "path": "/"
                    "http": {
                        "host": "www.baidu.com"
                    }
                }
            ]
        }
      }`,
  },
  {
    label: { zh: "代理服务", en: "Proxy Service" },
    children: [
      {
        label: "http",
        children: [
          {
            label: "http",
            json: getProxyJson("http", "tcp"),
          },
          {
            label: "https(http+tsl)",
            json: getProxyJson("http", "tls"),
          },
          {
            label: "http+wss",
            json: getProxyJson("http", "wss"),
          },
          {
            label: "http2",
            json: getProxyJson("http2", "http2"),
          },
        ],
      },
      {
        label: "relay",
        children: [
          {
            label: "relay+tcp",
            json: getProxyJson("relay", "tcp"),
          },
          {
            label: "relay+tls",
            json: getProxyJson("relay", "tls"),
          },
          {
            label: "relay+wss",
            json: getProxyJson("relay", "tls"),
          },
        ],
      },
      {
        label: "socks",
        children: [
          {
            label: "socks4",
            json: getProxyJson("socks", "tcp"),
          },
          {
            label: "socks5",
            json: getProxyJson("socks5", "tcp"),
          },
          {
            label: "socks5(udp)",
            json: getProxyJson("socks5", "tcp", { udp: "true" }),
          },
          {
            label: "socks5+tls",
            json: getProxyJson("socks5", "tls", { notls: "true" }),
          },
        ],
      },
    ],
  },
  {
    label: { zh: "代理转发", en: "Porxy Forwarding" },
    cli: "-L socks5://:1080 -F socks5://xxx.com:1080",
    json:
      _docUrl +
      `
      {
        "name": "service-0",
        "addr": ":1080",
        "handler": {
          "type": "socks5",
          "chain": "chain-0"
        },
        "listener": {
          "type": "tcp"
        }
      }`,
  },
] as Template[];
