import { Empty, Table, Tag, type TableColumnsType } from "antd";
import { useTranslation } from "react-i18next";
import type { EventRecord, Snapshot } from "../../api/dashboard";
import { formatClock } from "./format";

const LEVEL_COLORS: Record<string, string | undefined> = {
  error: "red",
  warn: "orange",
};

const Events = ({ snapshot }: { snapshot: Snapshot }) => {
  const { t } = useTranslation();
  const rows = [...snapshot.events].sort(
    (a, b) => Date.parse(b.time) - Date.parse(a.time)
  );

  const columns: TableColumnsType<EventRecord> = [
    {
      title: t("overview.events.time"),
      key: "time",
      width: 96,
      render: (_, event) => formatClock(event.time),
    },
    {
      title: t("overview.events.level"),
      key: "level",
      width: 88,
      render: (_, event) => (
        <Tag color={LEVEL_COLORS[event.level] ?? "blue"}>
          {event.level || "—"}
        </Tag>
      ),
    },
    {
      title: t("overview.events.kind"),
      dataIndex: "kind",
      key: "kind",
      width: 96,
      ellipsis: true,
    },
    {
      title: t("overview.events.name"),
      dataIndex: "name",
      key: "name",
      width: 140,
      ellipsis: true,
    },
    {
      title: t("overview.events.service"),
      key: "service",
      width: 120,
      ellipsis: true,
      render: (_, event) => event.service ?? "—",
    },
    {
      title: t("overview.events.message"),
      dataIndex: "message",
      key: "message",
      ellipsis: true,
    },
  ];

  if (!rows.length) {
    return <Empty description={t("overview.empty")} />;
  }

  return (
    <Table
      size="small"
      pagination={false}
      rowKey={(event) => `${event.time}/${event.kind}/${event.name}`}
      scroll={{ x: 720 }}
      columns={columns}
      dataSource={rows}
    />
  );
};

export default Events;
