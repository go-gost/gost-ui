import { Empty, Table, Typography, type TableColumnsType } from "antd";
import { useTranslation } from "react-i18next";
import type { ServiceSnapshot, Snapshot } from "../../api/dashboard";
import {
  formatBps,
  formatBytes,
  formatCount,
  formatPercent,
} from "./format";
import StateTag from "./StateTag";

const Services = ({ snapshot }: { snapshot: Snapshot }) => {
  const { t } = useTranslation();
  const rows = Object.values(snapshot.services).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const columns: TableColumnsType<ServiceSnapshot> = [
    {
      title: t("overview.services.name"),
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      fixed: "left",
    },
    {
      title: t("overview.services.state"),
      dataIndex: "state",
      key: "state",
      width: 96,
      render: (state: string) => <StateTag state={state} />,
    },
    {
      title: t("overview.services.total"),
      key: "total",
      width: 96,
      align: "right",
      render: (_, svc) => formatCount(svc.stats.totalConns),
    },
    {
      title: t("overview.services.current"),
      key: "current",
      width: 96,
      align: "right",
      render: (_, svc) => formatCount(svc.stats.currentConns),
    },
    {
      title: t("overview.services.in"),
      key: "in",
      width: 120,
      align: "right",
      render: (_, svc) => (
        <>
          {formatBps(svc.rate.inputBytesPerSecond)}
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {formatBytes(svc.stats.inputBytes)}
          </Typography.Text>
        </>
      ),
    },
    {
      title: t("overview.services.out"),
      key: "out",
      width: 120,
      align: "right",
      render: (_, svc) => (
        <>
          {formatBps(svc.rate.outputBytesPerSecond)}
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {formatBytes(svc.stats.outputBytes)}
          </Typography.Text>
        </>
      ),
    },
    {
      title: t("overview.services.errs"),
      key: "errs",
      width: 88,
      align: "right",
      render: (_, svc) => formatCount(svc.stats.totalErrs),
    },
    {
      title: t("overview.services.errRate"),
      key: "errRate",
      width: 96,
      align: "right",
      render: (_, svc) =>
        formatPercent(svc.stats.totalErrs, svc.stats.totalConns),
    },
  ];

  if (!rows.length) {
    return <Empty description={t("overview.empty")} />;
  }

  return (
    <Table
      size="small"
      pagination={false}
      rowKey="name"
      scroll={{ x: 760 }}
      columns={columns}
      dataSource={rows}
    />
  );
};

export default Services;
