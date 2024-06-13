import React from "react";
import { Button, ButtonProps } from "antd";
import { useIsDark } from "../uitls/useTheme";
import { useSettings } from "../uitls/server";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";

export const ThemeButton = (props: ButtonProps) => {
  const settings = useSettings();
  const isDark = useIsDark();
  const Icon = isDark ? <MoonOutlined /> : <SunOutlined />;
  return (
    <Button
      shape="circle"
      icon={Icon}
      {...props}
      onClick={() => {
        const _settings = { ...settings };
        _settings.theme = isDark ? "light" : "dark";
        useSettings.set(_settings);
      }}
    ></Button>
  );
};
