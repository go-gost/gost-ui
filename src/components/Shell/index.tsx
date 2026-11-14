import { lazy, Suspense, useState } from "react";
import { Button, Drawer, Grid, Layout, Spin, Typography, theme } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useInfo } from "../../utils/server";
import { type Page } from "../../nav";
import Sidebar from "../Sidebar";

const Manage = lazy(() => import("../../Pages/Manage"));
const Overview = lazy(() => import("../../Pages/Overview"));

const Shell = () => {
  const [page, setPage] = useState<Page>("config");
  const [navOpen, setNavOpen] = useState(false);
  const isMobile = !Grid.useBreakpoint().lg;
  const info = useInfo();
  const { token } = theme.useToken();
  const { t } = useTranslation();

  const navigate = (next: Page) => {
    setPage(next);
    setNavOpen(false);
  };

  const sidebar = (
    <Sidebar page={page} info={info} onNavigate={navigate} />
  );

  return (
    <Layout style={{ height: "100dvh", overflow: "hidden" }}>
      {!isMobile && (
        <Layout.Sider
          width={220}
          style={{
            background: token.colorBgContainer,
            borderRight: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          {sidebar}
        </Layout.Sider>
      )}
      <Layout style={{ minWidth: 0 }}>
        <Layout.Header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 56,
            lineHeight: "normal",
            paddingInline: 16,
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          {isMobile && (
            <Button
              icon={<MenuOutlined />}
              onClick={() => setNavOpen(true)}
              aria-label={t("nav.menu")}
              aria-expanded={navOpen}
            />
          )}
          <Typography.Text strong>{t(`nav.${page}`)}</Typography.Text>
        </Layout.Header>
        <Layout.Content
          style={{
            overflow: "auto",
            padding: 16,
            background: token.colorBgLayout,
            minWidth: 0,
          }}
        >
          <Suspense
            fallback={
              <Spin style={{ display: "block", margin: "15vh auto" }} />
            }
          >
            {page === "config" ? <Manage /> : <Overview />}
          </Suspense>
        </Layout.Content>
      </Layout>
      <Drawer
        placement="left"
        width={230}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        {sidebar}
      </Drawer>
    </Layout>
  );
};

export default Shell;
