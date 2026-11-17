import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Descriptions,
  Drawer,
  Empty,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import { useTranslation } from "react-i18next";
import {
  getDashboardConnections,
  type ConnectionRecord,
} from "../../api/dashboard";
import type { GraphNode, GraphEdge } from "../../graph/build";
import {
  matchesSelection,
  selectionFilter,
} from "../../graph/connections";
import { formatBytes, formatCount, formatDuration } from "../Overview/format";
import type { Selection } from "./index";

interface Props {
  selection: Selection;
  nodes: GraphNode[];
  edges: GraphEdge[];
  snapshot: import("../../api/dashboard").Snapshot | null;
  onClose: () => void;
}

function countersText(counters: { errors: number; successes: number } | undefined) {
  if (!counters) return "—";
  return `${counters.successes} ok / ${counters.errors} err`;
}

export default function Detail({
  selection,
  nodes,
  edges,
  snapshot,
  onClose,
}: Props) {
  const { t } = useTranslation();

  const node = useMemo(() => {
    if (!selection) return null;
    return nodes.find((n) => n.id === selection.id) ?? null;
  }, [selection, nodes]);

  const edge = useMemo(() => {
    if (!selection) return null;
    return edges.find((e) => e.id === selection.id) ?? null;
  }, [selection, edges]);

  // ---- Recent connections ----
  const filter = useMemo(
    () => (selection ? selectionFilter(selection) : { kind: "other" as const }),
    [selection]
  );
  const [records, setRecords] = useState<ConnectionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    if (filter.kind === "other") {
      setRecords([]);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      if (filter.kind === "service") {
        const rows = await getDashboardConnections({
          service: filter.name,
          limit: 100,
        });
        setRecords(rows);
      } else {
        const rows = await getDashboardConnections({ limit: 200 });
        setRecords(
          rows.filter((row) => matchesSelection(row, filter)).slice(0, 100)
        );
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!selection) {
      setRecords([]);
      setLoadError(null);
      return;
    }
    void fetchConnections();
    const timer = window.setInterval(() => {
      if (!document.hidden) void fetchConnections();
    }, 5000);
    return () => {
      window.clearInterval(timer);
    };
  }, [selection, fetchConnections]);

  const dest = (rec: ConnectionRecord) => {
    const hops = rec.path ?? [];
    const last = hops[hops.length - 1];
    return last?.addr ?? "—";
  };

  const columns = [
    {
      title: t("topology.connections.time"),
      dataIndex: "time",
      key: "time",
      render: (value: string) => new Date(value).toLocaleTimeString(),
      width: 90,
    },
    {
      title: "⇢",
      key: "bytes",
      render: (_: unknown, row: ConnectionRecord) =>
        `${formatBytes(row.bytesIn)} / ${formatBytes(row.bytesOut)}`,
      width: 110,
    },
    {
      title: t("topology.connections.dur"),
      dataIndex: "durationMs",
      key: "durationMs",
      render: (value: number) => formatDuration(value / 1000),
      width: 90,
    },
    {
      title: "",
      key: "err",
      render: (_: unknown, row: ConnectionRecord) =>
        row.err ? (
          <Typography.Text type="danger" style={{ fontSize: 11 }}>
            ×
          </Typography.Text>
        ) : null,
      width: 16,
    },
  ];

  return (
    <Drawer
      title={node?.data.label ?? edge?.id ?? "—"}
      open={selection !== null}
      onClose={onClose}
      placement="right"
      width={420}
      destroyOnClose
    >
      {node ? (
        <>
          <div style={{ marginBottom: 12 }}>
            <Tag color={node.data.kind === "unresolved" ? "red" : "blue"}>
              {t(`topology.kind.${node.data.kind}`)}
            </Tag>
            {node.data.moduleKind ? (
              <Tag>{node.data.moduleKind}</Tag>
            ) : null}
          </div>
          <Typography.Paragraph type="secondary">
            {node.data.sub}
          </Typography.Paragraph>
          <Descriptions column={1} size="small">
            <Descriptions.Item label={t("topology.detail.counters")}>
              {countersText(node.data.counters)}
            </Descriptions.Item>
            {node.data.quota ? (
              <>
                <Descriptions.Item label="quota">
                  {node.data.quota.used}/{node.data.quota.limit}
                </Descriptions.Item>
                <Descriptions.Item label="blocked">
                  {node.data.quota.blocked ? "yes" : "no"}
                </Descriptions.Item>
              </>
            ) : null}
            {node.data.unresolvedRef ? (
              <Descriptions.Item label={t("topology.detail.ref")}>
                {node.data.unresolvedRef}
              </Descriptions.Item>
            ) : null}
          </Descriptions>

          {filter.kind !== "other" && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 16,
                  marginBottom: 8,
                }}
              >
                <Typography.Text strong>
                  {t("topology.connectionsTitle")}
                </Typography.Text>
                <Typography.Link
                  onClick={() => void fetchConnections()}
                  style={{ fontSize: 12 }}
                >
                  {t("topology.connections.refresh")}
                </Typography.Link>
              </div>
              {loadError ? (
                <Typography.Paragraph type="danger">
                  {loadError}
                </Typography.Paragraph>
              ) : loading && records.length === 0 ? (
                <Spin size="small" />
              ) : records.length === 0 ? (
                <Typography.Paragraph type="secondary">
                  {t("topology.connections.empty")}
                </Typography.Paragraph>
              ) : (
                <Table<ConnectionRecord>
                  dataSource={records}
                  columns={columns}
                  rowKey={(row) => `${row.sid}:${row.time}`}
                  pagination={false}
                  size="small"
                  expandable={{
                    expandedRowRender: (row) => (
                      <div style={{ fontSize: 12 }}>
                        <div style={{ color: "#6b7280", marginBottom: 4 }}>
                          {row.sid}
                          {row.remoteAddr ? ` · ${row.remoteAddr}` : ""}
                          {row.chain ? ` · chain: ${row.chain}` : ""}
                        </div>
                        {(row.path ?? []).map((hop) => (
                          <div
                            key={`${hop.hop}-${hop.node}-${hop.addr}`}
                            style={{
                              display: "flex",
                              gap: 6,
                              alignItems: "center",
                              padding: "2px 0",
                            }}
                          >
                            <span style={{ opacity: 0.6 }}>hop {hop.hop}</span>
                            <span>{hop.node || "—"}</span>
                            <span style={{ opacity: 0.6 }}>
                              {hop.addr} · {hop.connectMs} ms
                            </span>
                            {hop.err ? (
                              <Typography.Text type="danger">
                                {hop.err}
                              </Typography.Text>
                            ) : null}
                          </div>
                        ))}
                        {row.err ? (
                          <Typography.Text type="danger">
                            {row.err}
                          </Typography.Text>
                        ) : null}
                      </div>
                    ),
                    rowExpandable: () => true,
                  }}
                />
              )}
            </>
          )}
        </>
      ) : edge ? (
        <>
          <Tag>{edge.kind}</Tag>
          <Typography.Paragraph style={{ marginTop: 12 }}>
            {edge.source} → {edge.target}
          </Typography.Paragraph>
          <Descriptions column={1} size="small">
            <Descriptions.Item label={t("topology.detail.stage")}>
              {edge.label ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label={t("topology.detail.services")}>
              {edge.services.join(", ") || "—"}
            </Descriptions.Item>
          </Descriptions>
        </>
      ) : (
        <Empty />
      )}
    </Drawer>
  );
}
