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
      label: "代理服务",
      children: [
        {
          label: "http",
          children: [
            {
              label: "http",
              json: `
              {
                "name": "service-0",
                "addr": ":1080",
                "handler": {
                  "type": "http",
                  "auth": {
                    "username": "user",
                    "password": "password"
                  }
                },
                "listener": {
                  "type": "tcp"
                }
              }`,
            },
            {
              label: "https",
              json: `
              {
                "name": "service-0",
                "addr": ":1080",
                "handler": {
                  "type": "http",
                  "auth": {
                    "username": "user",
                    "password": "password"
                  }
                },
                "listener": {
                  "type": "tls"
                }
              }`,
            },
          ],
        },
        {
          label: "socks5",
          json: `
          {
            "name": "service-0",
            "addr": ":1080",
            "handler": {
              "type": "socks5",
              "auth": {
                "username": "user",
                "password": "password"
              },
              "metadata": {
                "udp": "true"
              }
            },
            "listener": {
              "type": "tcp",
              "metadata": {
                "udp": "true"
              }
            },
            "metadata": {
              "udp": "true"
            }
          }`,
        },
      ],
      // json: `
      // {
      //   "name": "service-0",
      //   "addr": ":1080",
      //   "handler": {
      //     "type": "socks5",
      //     "metadata": {
      //       "udp": "true"
      //     }
      //   },
      //   "listener": {
      //     "type": "tcp",
      //     "metadata": {
      //       "udp": "true"
      //     }
      //   },
      //   "metadata": {
      //     "udp": "true"
      //   }
      // }`,
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
      label: "典型转发",
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
      `
    }
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
