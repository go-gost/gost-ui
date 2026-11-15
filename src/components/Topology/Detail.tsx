import { useMemo } from "react";
import { Descriptions, Drawer, Empty, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import type { Snapshot } from "../../api/dashboard";
import type { GraphNode, GraphEdge } from "../../graph/build";
import type { Selection } from "./index";

interface Props {
  selection: Selection;
  nodes: GraphNode[];
  edges: GraphEdge[];
  snapshot: Snapshot | null;
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

  return (
    <Drawer
      title={node?.data.label ?? edge?.id ?? "—"}
      open={selection !== null}
      onClose={onClose}
      placement="right"
      width={360}
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
