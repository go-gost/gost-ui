/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from "react";
import { GlobalOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Space } from "antd";
import { login } from "../utils/server";
import LocalServers from "../components/LocalServers";
import { ThemeButton } from "../components/Theme";
import { useTranslation, Trans } from 'react-i18next';
import { LanguageButton } from "../components/Language";
const Home: React.FC = () => {
  const { t, i18n } = useTranslation();

  // 检查URL参数并自动登录
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gostApi = urlParams.get('gost_api');
    const username = urlParams.get('username');
    const password = urlParams.get('password');

    if (gostApi && username && password) {
      // 处理地址格式
      let addr = gostApi;
      if (!/^(https?:)?\/\//.test(addr)) {
        addr = `${location.protocol}//` + addr;
      } else if (/^\/\//.test(addr)) {
        addr = `${location.protocol}` + addr;
      }

      // 自动登录
      login(
        {
          addr: addr,
          auth: {
            username: username,
            password: password,
          },
        },
        false
      );
      // 清除URL参数
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

    }
  }, []);
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
