/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { GlobalOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Space } from "antd";
import { login } from "../utils/server";
import LocalServers from "../components/LocalServers";
import { ThemeButton } from "../components/Theme";
import { useTranslation, Trans } from 'react-i18next';
import { LanguageButton } from "../components/Language";
const Home: React.FC = () => {
  const { t, i18n } = useTranslation();
  return (
    <>
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
        <h1>{t('base.title')}</h1>
        <h2>{t('base.description')}</h2>
        <Form.Item
          name="baseURL"
          rules={[
            {
              required: true,
              message: t('msg.baseURL.required'),
            },
            {
              validator(rule, value, callback) {
                if (value === "http://") {
                  callback(t('msg.baseURL.required'));
                }
                callback();
              },
            },
          ]}
        >
          <Input
            placeholder={t('placeholder.baseURL')}
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
          <Checkbox>{t('base.form.local')}</Checkbox>
        </Form.Item>
        <Form.Item noStyle style={{ marginBottom: "1em" }}>
          <Button block type="primary" htmlType="submit">
            {t('base.cmd.connect')}
          </Button>
        </Form.Item>
        <LocalServers></LocalServers>
      </Form>
      <div style={{ position: "absolute", top: "1em", right: "1em" }}>
        <Space>
          <ThemeButton />
          <LanguageButton />
        </Space>
      </div>
    </>
  );
};

export default Home;
