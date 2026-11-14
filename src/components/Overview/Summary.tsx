import { useMemo } from "react";
import { Card, Col, Row, Statistic } from "antd";
import { useTranslation } from "react-i18next";
import type { Snapshot } from "../../api/dashboard";
import { formatBps, formatCount, formatDuration } from "./format";

const Summary = ({ snapshot }: { snapshot: Snapshot }) => {
  const { t } = useTranslation();
  const totals = useMemo(() => {
    const services = Object.values(snapshot.services);
    return {
      conns: services.reduce((n, svc) => n + svc.stats.currentConns, 0),
      inBps: services.reduce((n, svc) => n + svc.rate.inputBytesPerSecond, 0),
      outBps: services.reduce((n, svc) => n + svc.rate.outputBytesPerSecond, 0),
    };
  }, [snapshot.services]);

  const cards = [
    {
      title: t("overview.summary.uptime"),
      value: formatDuration(
        (Date.now() - Date.parse(snapshot.startedAt)) / 1000
      ),
    },
    {
      title: t("overview.summary.services"),
      value: formatCount(Object.keys(snapshot.services).length),
    },
    {
      title: t("overview.summary.conns"),
      value: formatCount(totals.conns),
    },
    {
      title: t("overview.summary.in"),
      value: formatBps(totals.inBps),
    },
    {
      title: t("overview.summary.out"),
      value: formatBps(totals.outBps),
    },
    {
      title: t("overview.summary.metrics"),
      value: snapshot.metricsEnabled
        ? t("overview.summary.enabled")
        : t("overview.summary.disabled"),
    },
    {
      title: t("overview.summary.interval"),
      value: `${snapshot.sampleIntervalSeconds}s`,
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card) => (
        <Col key={card.title} xs={12} md={8} xl={6}>
          <Card size="small">
            <Statistic title={card.title} value={card.value} />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default Summary;
