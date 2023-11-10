/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import {
  BetaSchemaForm,
  ProForm,
  LoginForm,
  ProFormText,
} from "@ant-design/pro-components";
import type {
  ProFormColumnsType,
  ProFormLayoutType,
} from "@ant-design/pro-components";
import { GlobalOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { Space } from "antd";
import { login } from "../uitls/server";

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

const Home: React.FC = () => {
  return (
    <div style={{ height: "100%" }}>
      {/* <BetaSchemaForm<DataItem>
        layoutType=""
        layout="horizontal"
        // grid
        columns={columns}
      ></BetaSchemaForm> */}
      <LoginForm
        title="GOST API Manage"
        subTitle="首先连接API服务"
        layout="horizontal"
        submitter={{
          searchConfig: { submitText: "连接" },
        }}
        onFinish={(value) => {
          return login({
            addr: value.baseURL,
            auth: {
              username: value.username,
              password: value.passowrd,
            },
          });
        }}
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
      </LoginForm>
    </div>
  );
};

export default Home;
