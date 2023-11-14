export default [
  {
    name: "代理转发",
    cli: `gost -L socks5://:1080 -F socks5+tlc://username:password@100.100.100.100:1080`,
    themelate: `
{
    "services": [
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
        }
    ],
    "chains": [
        {
            "name": "chain-0",
            "hops": [
                {
                    "name": "hop-0",
                    "nodes": [
                        {
                        "name": "node-0",
                        "addr": "100.100.100.100:1080",
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
                                "serverName": "100.100.100.100"
                            }
                        }
                        }
                    ]
                }
            ]
        }
    ]
}
        `,
  },
];
