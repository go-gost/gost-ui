import React, { useEffect, useRef } from "react";
import { GlobalOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Space } from "antd";
import { login } from "../utils/server";
import LocalServers from "../components/LocalServers";
import { ThemeButton } from "../components/Theme";
import { useTranslation } from 'react-i18next';
import { LanguageButton } from "../components/Language";

const Home: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm();
  const autoLoginRef = useRef(false);

  // 新增：自动从 URL 解析参数并自动登录
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const gost_api = search.get("gost_api");
    const user = search.get("user");
    const pass = search.get("pass");
    if (gost_api && !autoLoginRef.current) {
      autoLoginRef.current = true; // 防止多次触发
      form.setFieldsValue({
        baseURL: gost_api,
        save: true,
      });
      if(user && pass) {
        form.setFieldsValue({
          username: user,
          password: pass,
        });
      }
      // 触发表单提交
      form.submit();
      // 可选：移除 URL 参数，防止敏感信息外泄
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [form]);

  return (
    <>
      <Form
        form={form}
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
