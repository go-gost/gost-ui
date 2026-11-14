import { Alert, Button, Card, Result, Space, Spin, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { logout } from "../utils/server";
import { formatClock } from "../components/Overview/format";
import Modules from "../components/Overview/Modules";
import Services from "../components/Overview/Services";
import Summary from "../components/Overview/Summary";
import { useSnapshot } from "../components/Overview/useSnapshot";

const Overview = () => {
  const { t } = useTranslation();
  const { snapshot, phase, error, updatedAt, refresh } = useSnapshot();

  if (phase === "loading" && !snapshot) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: "15vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (phase === "disabled") {
    return (
      <Result
        status="info"
        title={t("overview.disabled.title")}
        subTitle={t("overview.disabled.desc")}
      />
    );
  }

  if (phase === "unauthorized") {
    return (
      <Result
        status="warning"
        title={t("overview.unauthorized.title")}
        subTitle={t("overview.unauthorized.desc")}
        extra={
          <Button
            onClick={() => {
              void logout();
            }}
          >
            {t("overview.unauthorized.action")}
          </Button>
        }
      />
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {phase === "stale" && (
        <Alert
          type="warning"
          showIcon
          message={t("overview.stale", { error: error ?? "—" })}
        />
      )}
      <Space wrap>
        <Button icon={<ReloadOutlined />} onClick={refresh}>
          {t("overview.refresh")}
        </Button>
        <Typography.Text type="secondary">
          {t("overview.updated", {
            time: updatedAt
              ? formatClock(new Date(updatedAt).toISOString())
              : "—",
          })}
        </Typography.Text>
      </Space>
      {snapshot && (
        <>
          <Summary snapshot={snapshot} />
          <Card
            title={t("overview.services.title")}
            styles={{ body: { padding: 8 } }}
          >
            <Services snapshot={snapshot} />
          </Card>
          <Card
            title={t("overview.modules.title")}
            styles={{ body: { padding: 8 } }}
          >
            <Modules snapshot={snapshot} />
          </Card>
        </>
      )}
    </Space>
  );
};

export default Overview;
