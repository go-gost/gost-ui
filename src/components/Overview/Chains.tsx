import {
  Card,
  Descriptions,
  Empty,
  Space,
  Table,
  type TableColumnsType,
} from "antd";
import { useTranslation } from "react-i18next";
import type { ChainSnapshot, Snapshot } from "../../api/dashboard";
import { formatCount, formatLatency } from "./format";
import StateTag from "./StateTag";

interface NodeRow {
  key: string;
  hop: string;
  name: string;
  state?: string;
  connects: number;
  errors: number;
  latencySumMicros: number;
  latencyCount: number;
}

const nodeRows = (chain: ChainSnapshot, empty: string): NodeRow[] => {
  if (chain.nodes?.length) {
    return chain.nodes.map((node) => ({
      key: node.name,
      hop: empty,
      name: node.name,
      state: node.state,
      connects: node.stats.connects,
      errors: node.stats.errors,
      latencySumMicros: node.stats.connectDurationSumMicros,
      latencyCount: node.stats.connectCount,
    }));
  }
  return (chain.hops ?? []).flatMap((hop) =>
    hop.nodes.map((node) => ({
      key: `${hop.name}/${node.name}`,
      hop: hop.name,
      name: node.name,
      state: node.state,
      connects: node.stats.connects,
      errors: node.stats.errors,
      latencySumMicros: node.stats.connectDurationSumMicros,
      latencyCount: node.stats.connectCount,
    }))
  );
};

const Chains = ({ snapshot }: { snapshot: Snapshot }) => {
  const { t } = useTranslation();
  const chains = Object.values(snapshot.chains).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const columns: TableColumnsType<NodeRow> = [
    {
      title: t("overview.chains.hop"),
      dataIndex: "hop",
      key: "hop",
      width: 110,
      ellipsis: true,
    },
    {
      title: t("overview.chains.node"),
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: t("overview.modules.state"),
      key: "state",
      width: 96,
      render: (_, row) => <StateTag state={row.state} />,
    },
    {
      title: t("overview.chains.connects"),
      key: "connects",
      width: 96,
      align: "right",
      render: (_, row) => formatCount(row.connects),
    },
    {
      title: t("overview.chains.errors"),
      key: "errors",
      width: 88,
      align: "right",
      render: (_, row) => formatCount(row.errors),
    },
    {
      title: t("overview.chains.avgConnect"),
      key: "avg",
      width: 120,
      align: "right",
      render: (_, row) =>
        formatLatency(row.latencySumMicros, row.latencyCount),
    },
  ];

  if (!chains.length) {
    return <Empty description={t("overview.empty")} />;
  }

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      {chains.map((chain) => (
        <Card size="small" key={chain.name} title={chain.name}>
          <Descriptions
            size="small"
            column={3}
            items={[
              {
                key: "connects",
                label: t("overview.chains.connects"),
                children: formatCount(chain.stats.connects),
              },
              {
                key: "errors",
                label: t("overview.chains.errors"),
                children: formatCount(chain.stats.errors),
              },
              {
                key: "avg",
                label: t("overview.chains.avgConnect"),
                children: formatLatency(
                  chain.stats.connectDurationSumMicros,
                  chain.stats.connectCount
                ),
              },
            ]}
          />
          <Table
            size="small"
            pagination={false}
            rowKey="key"
            scroll={{ x: 520 }}
            columns={columns}
            dataSource={nodeRows(chain, "—")}
          />
        </Card>
      ))}
    </Space>
  );
};

export default Chains;
