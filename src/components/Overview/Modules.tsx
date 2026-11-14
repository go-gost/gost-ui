import {
  Descriptions,
  Empty,
  Table,
  Tag,
  type TableColumnsType,
} from "antd";
import { useTranslation } from "react-i18next";
import type { ModuleSnapshot, Snapshot } from "../../api/dashboard";
import { formatBytes, formatCount, formatLatency } from "./format";
import { groupModules } from "./modules";

const Modules = ({ snapshot }: { snapshot: Snapshot }) => {
  const { t } = useTranslation();
  const rows = groupModules(snapshot.modules).flatMap((group) => group.rows);
  const kindLabel = (kind: string) =>
    t(`overview.module.kind.${kind}`, { defaultValue: kind });

  const columns: TableColumnsType<ModuleSnapshot> = [
    {
      title: t("overview.modules.kind"),
      key: "kind",
      width: 120,
      render: (_, mod) => kindLabel(mod.kind),
    },
    {
      title: t("overview.modules.name"),
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: t("overview.modules.service"),
      key: "service",
      ellipsis: true,
      render: (_, mod) => mod.service ?? "—",
    },
    {
      title: t("overview.modules.state"),
      key: "state",
      width: 96,
      render: (_, mod) =>
        mod.state ? (
          <Tag color={mod.state === "running" ? "green" : undefined}>
            {mod.state}
          </Tag>
        ) : (
          "—"
        ),
    },
    {
      title: t("overview.modules.calls"),
      key: "calls",
      width: 88,
      align: "right",
      render: (_, mod) => formatCount(mod.stats.calls),
    },
    {
      title: t("overview.modules.hits"),
      key: "hits",
      width: 88,
      align: "right",
      render: (_, mod) => formatCount(mod.stats.hits),
    },
    {
      title: t("overview.modules.misses"),
      key: "misses",
      width: 88,
      align: "right",
      render: (_, mod) => formatCount(mod.stats.misses),
    },
    {
      title: t("overview.modules.errors"),
      key: "errors",
      width: 88,
      align: "right",
      render: (_, mod) => formatCount(mod.stats.errors),
    },
    {
      title: t("overview.modules.latency"),
      key: "latency",
      width: 104,
      align: "right",
      render: (_, mod) =>
        formatLatency(mod.stats.latencySumMicros, mod.stats.latencyCount),
    },
    {
      title: t("overview.modules.limiter"),
      key: "limiter",
      width: 120,
      align: "right",
      render: (_, mod) => {
        const limiter = mod.stats.limiter;
        if (!limiter) return "—";
        return limiter.requested > 0
          ? `${formatCount(limiter.granted)}/${formatCount(limiter.requested)}`
          : `${formatCount(limiter.allowed)}/${formatCount(limiter.calls)}`;
      },
    },
  ];

  if (!rows.length) {
    return <Empty description={t("overview.empty")} />;
  }

  return (
    <Table
      size="small"
      pagination={false}
      rowKey={(mod) => `${mod.kind}/${mod.service ?? "-"}/${mod.name}`}
      scroll={{ x: 900 }}
      columns={columns}
      dataSource={rows}
      expandable={{
        rowExpandable: (mod) => Boolean(mod.stats.limiter),
        expandedRowRender: (mod) => {
          const limiter = mod.stats.limiter;
          if (!limiter) return null;
          return (
            <Descriptions
              size="small"
              column={3}
              items={[
                {
                  key: "calls",
                  label: t("overview.modules.calls"),
                  children: formatCount(limiter.calls),
                },
                {
                  key: "allowed",
                  label: t("overview.modules.allowed"),
                  children: formatCount(limiter.allowed),
                },
                {
                  key: "denied",
                  label: t("overview.modules.denied"),
                  children: formatCount(limiter.denied),
                },
                {
                  key: "waitCalls",
                  label: t("overview.modules.waitCalls"),
                  children: formatCount(limiter.waitCalls),
                },
                {
                  key: "requested",
                  label: t("overview.modules.requested"),
                  children: formatCount(limiter.requested),
                },
                {
                  key: "granted",
                  label: t("overview.modules.granted"),
                  children: formatCount(limiter.granted),
                },
                {
                  key: "cacheHits",
                  label: t("overview.modules.cacheHits"),
                  children: formatCount(mod.stats.cacheHits),
                },
                {
                  key: "cacheMisses",
                  label: t("overview.modules.cacheMisses"),
                  children: formatCount(mod.stats.cacheMisses),
                },
                {
                  key: "cacheStores",
                  label: t("overview.modules.cacheStores"),
                  children: formatCount(mod.stats.cacheStores),
                },
                {
                  key: "in",
                  label: t("overview.modules.inBytes"),
                  children: formatBytes(mod.stats.inputBytes),
                },
                {
                  key: "out",
                  label: t("overview.modules.outBytes"),
                  children: formatBytes(mod.stats.outputBytes),
                },
              ]}
            />
          );
        },
      }}
    />
  );
};

export default Modules;
