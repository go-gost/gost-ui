import { useMemo } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Result,
  Row,
  Space,
  Spin,
  Typography,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { logout } from "../utils/server";
import {
  formatBps,
  formatClock,
  formatCount,
} from "../components/Overview/format";
import { historySamples } from "../components/Overview/history";
import Chains from "../components/Overview/Chains";
import Events from "../components/Overview/Events";
import Modules from "../components/Overview/Modules";
import Services from "../components/Overview/Services";
import Sparkline from "../components/Overview/Sparkline";
import Summary from "../components/Overview/Summary";
import { useSnapshot } from "../components/Overview/useSnapshot";

const Overview = () => {
  const { t } = useTranslation();
  const { snapshot, phase, error, updatedAt, refresh } = useSnapshot();
  const samples = useMemo(
    () => historySamples(snapshot?.history ?? []),
    [snapshot]
  );
  const last = samples[samples.length - 1];

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
          <Card title={t("overview.history.title")}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Typography.Text type="secondary">
                  {t("overview.history.in")}
                </Typography.Text>
                <div>{last ? formatBps(last.inBps) : "—"}</div>
                <Sparkline values={samples.map((sample) => sample.inBps)} />
              </Col>
              <Col xs={24} md={8}>
                <Typography.Text type="secondary">
                  {t("overview.history.out")}
                </Typography.Text>
                <div>{last ? formatBps(last.outBps) : "—"}</div>
                <Sparkline values={samples.map((sample) => sample.outBps)} />
              </Col>
              <Col xs={24} md={8}>
                <Typography.Text type="secondary">
                  {t("overview.history.conns")}
                </Typography.Text>
                <div>{last ? formatCount(last.conns) : "—"}</div>
                <Sparkline values={samples.map((sample) => sample.conns)} />
              </Col>
            </Row>
          </Card>
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
          <Card
            title={t("overview.chains.title")}
            styles={{ body: { padding: 8 } }}
          >
            <Chains snapshot={snapshot} />
          </Card>
          <Card
            title={t("overview.events.title")}
            styles={{ body: { padding: 8 } }}
          >
            <Events snapshot={snapshot} />
          </Card>
        </>
      )}
    </Space>
  );
};

export default Overview;
