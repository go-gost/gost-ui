import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Empty,
  Result,
  Row,
  Space,
  Spin,
  Switch,
  Typography,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { logout, useInfo, useServerConfig, useSettings } from "../utils/server";
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
import Topology, { type Selection } from "../components/Topology";
import Detail from "../components/Topology/Detail";
import { useSnapshot } from "../components/Overview/useSnapshot";
import {
  diffActivity,
  emptyActivity,
} from "../graph/activity";
import { buildGraph } from "../graph/build";
import type { Config } from "../api/types";

const Overview = () => {
  const { t } = useTranslation();
  const { snapshot, phase, error, updatedAt, refresh } = useSnapshot();
  const info = useInfo();
  const cfg = useServerConfig() as Config | null;

  const [selection, setSelection] = useState<Selection>(null);
  const [showDetails, setShowDetails] = useState(false);
  const settings = useSettings();
  const animationEnabled = settings?.animation !== false;
  const setAnimationEnabled = (value: boolean) =>
    useSettings.set({ ...settings, animation: value });
  const prevRef = useRef(snapshot);
  const [activity, setActivity] = useState(() => emptyActivity());

  useEffect(() => {
    if (!snapshot) return;
    const prev = prevRef.current ?? null;
    prevRef.current = snapshot;
    // Keep the baseline advancing while animations are off so switching back
    // on does not replay a stale pulse.
    if (!animationEnabled) return;
    setActivity((current) => {
      const next = diffActivity(prev, snapshot, Date.now());
      // Activity is a point-in-time event; keep daemon cheap.
      return next.services && Object.keys(next.services).length
        ? next
        : Object.keys(next.modules).length
          ? next
          : current;
    });
  }, [snapshot, animationEnabled]);

  const samples = useMemo(
    () => historySamples(snapshot?.history ?? []),
    [snapshot]
  );
  const last = samples[samples.length - 1];

  const graphData = useMemo(
    () => ({ ...buildGraph({ config: cfg ?? emptyConfig, snapshot }), configReady: !!cfg }),
    [cfg, snapshot]
  );
  const topologyNodes = graphData.nodes;
  const topologyEdges = graphData.edges;

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
        <Space>
          <Typography.Text type="secondary">
            {showDetails ? t("topology.details.hide") : t("topology.details.show")}
          </Typography.Text>
          <Switch checked={showDetails} onChange={setShowDetails} size="small" />
        </Space>
        <Space>
          <Typography.Text type="secondary">
            {t("topology.animation")}
          </Typography.Text>
          <Switch
            checked={animationEnabled}
            onChange={setAnimationEnabled}
            size="small"
            aria-label={t("topology.animation")}
          />
        </Space>
      </Space>
      {snapshot && !snapshot.metricsEnabled && (
        <Alert
          type="info"
          showIcon
          message={t("topology.metrics.disabled")}
        />
      )}
      {cfg ? (
        topologyNodes.length === 0 ? (
          <Card>
            <Empty description={t("topology.empty")} />
          </Card>
        ) : (
          <Card
            title={t("topology.graph")}
            styles={{
              body: { padding: 0, height: "clamp(420px, 62vh, 900px)" },
            }}
          >
            <Topology
              config={cfg}
              snapshot={snapshot}
              activity={activity}
              selection={selection}
              infoAddr={info?.addr}
              onSelect={setSelection}
            />
          </Card>
        )
      ) : (
        <Card>
          <Spin />
        </Card>
      )}
      {snapshot && (
        <Collapse
          activeKey={showDetails ? ["details"] : []}
          onChange={(key) => setShowDetails(key.length > 0)}
          items={[
            {
              key: "details",
              label: t("topology.detailsLabel"),
              children: (
                <>
                  <Summary snapshot={snapshot} />
                  <Card title={t("overview.history.title")}>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={8}>
                        <Typography.Text type="secondary">
                          {t("overview.history.in")}
                        </Typography.Text>
                        <div>{last ? formatBps(last.inBps) : "—"}</div>
                        <Sparkline
                          values={samples.map((sample) => sample.inBps)}
                        />
                      </Col>
                      <Col xs={24} md={8}>
                        <Typography.Text type="secondary">
                          {t("overview.history.out")}
                        </Typography.Text>
                        <div>{last ? formatBps(last.outBps) : "—"}</div>
                        <Sparkline
                          values={samples.map((sample) => sample.outBps)}
                        />
                      </Col>
                      <Col xs={24} md={8}>
                        <Typography.Text type="secondary">
                          {t("overview.history.conns")}
                        </Typography.Text>
                        <div>{last ? formatCount(last.conns) : "—"}</div>
                        <Sparkline
                          values={samples.map((sample) => sample.conns)}
                        />
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
              ),
            },
          ]}
        />
      )}

      <Detail
        selection={selection}
        nodes={topologyNodes}
        edges={topologyEdges}
        snapshot={snapshot}
        onClose={() => setSelection(null)}
      />
    </Space>
  );
};

const emptyConfig: Config = {
  admissions: [],
  api: {} as Config["api"],
  authers: [],
  bypasses: [],
  chains: [],
  climiters: [],
  hops: [],
  hosts: [],
  ingresses: [],
  limiters: [],
  log: {} as Config["log"],
  loggers: [],
  metrics: {} as Config["metrics"],
  nodes: [],
  observers: [],
  profiling: {} as Config["profiling"],
  quotas: [],
  recorders: [],
  resolvers: [],
  rlimiters: [],
  routers: [],
  sds: [],
  services: [],
  tls: {} as Config["tls"],
};

export default Overview;
