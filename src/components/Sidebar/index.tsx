import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Dropdown,
  Menu,
  Space,
  Typography,
  theme,
  type MenuProps,
} from "antd";
import { DashboardOutlined, SettingOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import {
  getLocalServers,
  logout,
  type GostApiConfig,
} from "../../utils/server";
import { NAV_ORDER, type Page } from "../../nav";
import { ThemeButton } from "../Theme";
import { LanguageButton } from "../Language";

const ICONS: Record<Page, ReactNode> = {
  config: <SettingOutlined />,
  overview: <DashboardOutlined />,
};

interface SidebarProps {
  page: Page;
  info?: GostApiConfig | null;
  onNavigate: (page: Page) => void;
}

const Sidebar = ({ page, info, onNavigate }: SidebarProps) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [locals, setLocals] = useState<{ key: string; label: ReactNode }[]>([]);

  useEffect(() => {
    getLocalServers().then((list) =>
      setLocals(
        list
          .sort((a, b) => (b.time || 0) - (a.time || 0))
          .map((item) => ({
            key: item.addr,
            label: <a href={`./?use=${item.addr}`}>{item.addr}</a>,
          }))
      )
    );
  }, []);

  const items = useMemo<MenuProps["items"]>(
    () =>
      NAV_ORDER.map((key) => ({
        key,
        icon: ICONS[key],
        label: t(`nav.${key}`),
      })),
    [t]
  );

  const footerItems = useMemo<MenuProps["items"]>(() => {
    const menu: MenuProps["items"] = [];
    if (locals.length) {
      menu.push({
        key: "switch",
        label: t("shell.menu.switch"),
        children: locals,
      });
      menu.push({ type: "divider" });
    }
    menu.push({
      key: "new",
      label: t("shell.menu.new"),
      onClick: () => {
        window.open(location.href, undefined, "noopener");
      },
    });
    return menu;
  }, [locals, t]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <Menu
          mode="inline"
          selectedKeys={[page]}
          style={{ borderInlineEnd: "none", background: "transparent" }}
          onClick={({ key }) => onNavigate(key as Page)}
          items={items}
        />
      </div>
      <div
        style={{
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          padding: 12,
        }}
      >
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Space>
            <ThemeButton />
            <LanguageButton />
          </Space>
          <Dropdown.Button
            style={{ width: "100%" }}
            menu={{ items: footerItems }}
            onClick={() => {
              void logout();
            }}
          >
            {t("manage.cmd.logout")}
          </Dropdown.Button>
          <Typography.Text
            type="secondary"
            ellipsis
            style={{ fontSize: 12, maxWidth: "100%" }}
          >
            {info?.addr}
          </Typography.Text>
        </Space>
      </div>
    </div>
  );
};

export default Sidebar;
