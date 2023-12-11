/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useEffect, useState } from "react";
import {
  BetaSchemaForm,
  ProForm,
  LoginForm,
  ProFormText,
  ProFormCheckbox,
} from "@ant-design/pro-components";
import type {
  ProFormColumnsType,
  ProFormLayoutType,
} from "@ant-design/pro-components";
import {
  DeleteOutlined,
  GlobalOutlined,
  LockOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Checkbox, Col, Flex, Form, Row, Space } from "antd";
import {
  GostApiConfig,
  getLocalServers,
  login,
  deleteLocal,
} from "../uitls/server";

type DataItem = { name: string; state: string };
const columns: ProFormColumnsType<DataItem>[] = [
  {
    title: "gost API 地址",
    dataIndex: "addr",
    valueType: "text",
  },
  {
    title: "usrname",
    dataIndex: "addr",
    valueType: "text",
  },
  {
    title: "password",
    dataIndex: "addr",
    valueType: "password",
  },
];

const LocalServers = () => {
  const [list, setList] = useState<GostApiConfig[]>();
  // const [local, setLocal] = useState<Record<string, GostApiConfig>>();

  const updateList = useCallback(async () => {
    return getLocalServers()
      .then((local) => {
      
        return local
          .sort((a, b) => {
            const t1 = a.time || 0;
            const t2 = b.time || 0;
            return t2 - t1;
          });
      })
      .then((list) => setList(list));
  }, []);
  useEffect(() => {
    updateList();
    // getList().then(list=>setList(list))
  }, []);

  return (
    <>
      {list && list?.length > 0 ? (
        <Space direction="vertical" style={{ display: "flex" }}>
          <div>快速连接</div>
          <Row gutter={10}>
            {list.map((item) => {
              return (
                <Col
                  key={item.addr}
                  span={12}
                  title={item.addr}
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <Flex gap={5} style={{ overflow: "hidden" }}>
                    <a
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        flex: "auto",
                      }}
                      href={`?use=${item.addr}`}
                    >
                      {item.addr}
                    </a>
                    <DeleteOutlined
                      style={{ color: "red" }}
                      onClick={async () => {
                        await deleteLocal(item.addr);
                        updateList();
                      }}
                    />
                  </Flex>
                </Col>
              );
            })}
          </Row>
        </Space>
      ) : null}
    </>
  );
};

const Home: React.FC = () => {
  return (
    <LoginForm
      containerStyle={{ boxSizing: "border-box" }}
      title="GOST API Manage"
      subTitle="首先连接API服务"
      layout="horizontal"
      submitter={{
        searchConfig: { submitText: "连接" },
      }}
      onFinish={(value) => {
        let addr: string = value.baseURL;
        if (!/^(https?:)?\/\//.test(addr)) {
          addr = "//" + addr;
        }
        return login(
          {
            addr: addr,
            auth: {
              username: value.username,
              password: value.password,
            },
          },
          value.save
        );
      }}
      actions={<LocalServers></LocalServers>}
    >
      <ProFormText
        name="baseURL"
        fieldProps={{
          size: "large",
          prefix: <GlobalOutlined className={"prefixIcon"} />,
        }}
        placeholder={"API baseURL"}
        rules={[
          {
            required: true,
            message: "请输入API地址",
          },
        ]}
      />
      <ProFormText
        name="username"
        fieldProps={{
          size: "large",
          prefix: <UserOutlined className={"prefixIcon"} />,
        }}
        placeholder={"username"}
      />
      <ProFormText.Password
        name="password"
        fieldProps={{
          size: "large",
          prefix: <LockOutlined className={"prefixIcon"} />,
        }}
        placeholder={"password"}
      />
      <ProFormCheckbox labelAlign="right" label="保存到本地" name="save" />
    </LoginForm>
  );
};

export default Home;
