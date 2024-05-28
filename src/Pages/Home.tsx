/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { GlobalOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input } from "antd";
import { login } from "../uitls/server";
import LocalServers from "../components/LocalServers";

const Home: React.FC = () => {
  return (
    <Form
      className="home-form"
      size="large"
      layout="horizontal"
      initialValues={{
        baseURL: "http://",
        save: true,
      }}
      onFinish={(value) => {
        let addr: string = value.baseURL;
        if (!/^(https?:)?\/\//.test(addr)) {
          addr = `${location.protocol}//` + addr;
        } else if (/^\/\//.test(addr)) {
          addr = `${location.protocol}` + addr;
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
    >
      <h1>GOST API Manage</h1>
      <h2>首先连接API服务</h2>
      <Form.Item
        name="baseURL"
        rules={[
          {
            required: true,
            message: "请输入API地址",
          },
          {
            validator(rule, value, callback) {
              if (value === "http://") {
                callback("请输入API地址");
              }
              callback();
            },
          },
          // {
          //   type:'url'
          // }
        ]}
      >
        <Input
          placeholder="API baseURL"
          prefix={<GlobalOutlined className={"prefixIcon"} />}
        ></Input>
      </Form.Item>
      <Form.Item name="username">
        <Input
          placeholder="username"
          prefix={<UserOutlined className={"prefixIcon"} />}
        ></Input>
      </Form.Item>
      <Form.Item name="password">
        <Input.Password
          placeholder="password"
          prefix={<LockOutlined className={"prefixIcon"} />}
        ></Input.Password>
      </Form.Item>
      <Form.Item name="save" valuePropName="checked">
        <Checkbox>保存到本地</Checkbox>
      </Form.Item>
      <Form.Item noStyle style={{ marginBottom: "1em" }}>
        <Button block type="primary" htmlType="submit">
          链接
        </Button>
      </Form.Item>
      <LocalServers></LocalServers>
    </Form>
  );
};

export default Home;
