import * as JSONC from "jsonc-parser";
const proxyTypes = "http,http2,socks,socks5,ss,ssu,sni,relay";
const listenerTypes =
  "h2,h2c,h3,tls,dtls,ws,wss,grpc,quic,pht,phts,kcp,ssh,mtcp";

const getProxyJson = (
  handlerType: string,
  listenerType: string,
  metadata?: object
) => {
  let jsonc = `
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
    // jsonc = JSONC.applyEdits(
    //   jsonc,
    //   JSONC.modify(jsonc, ["metadata"], metadata, {})
    // );
    // jsonc = JSONC.applyEdits(
    //   jsonc,
    //   JSONC.modify(jsonc, ["handler","metadata"], metadata, {})
    // );
    // jsonc = JSONC.applyEdits(
    //   jsonc,
    //   JSONC.modify(jsonc, ["listener","metadata"], metadata, {})
    // );
  }

  return jsonc;
};

export default {
  services: [
    {
      label: "端口转发",
      cli: "-L tcp://:80/:8080",
      json: `
      {
        "name": "service-0", // 服务名称
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
      label: "反向代理",
      cli: "",
      json: `
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
      label: "代理服务",
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
              label: "socks5(支持udp)",
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
      label: "代理转发",
      cli: "-L socks5://:1080 -F socks5://xxx.com:1080",
      json: `
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
  ],
  chains: [
    {
      label: "典型转发链",
      cli: "",
      json: `
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
  ],
  authers: [
    {
      label: "默认模板",
      json: `
{
  "name": "auther-0",
  "auths": [
    { "username": "user1", "password": "pass1" },
    { "username": "user2", "password": "pass2" }
  ]
}`,
    },
  ],
} as Record<string, any>;
