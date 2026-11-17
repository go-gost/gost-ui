import { Button, Drawer, message, Space, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import type { Config } from "../../api/types";
import type { GraphEdge, GraphNode } from "../../graph/build";
import { disconnectLink, linkKind } from "../../graph/links";
import { applyLinkChange } from "../../utils/applyLinkChange";
import type { Selection } from "./index";

interface Props {
  selection: Selection;
  nodes: GraphNode[];
  edges: GraphEdge[];
  config: Config;
  onClose: () => void;
}

export default function EditPanel({
  selection,
  nodes,
  edges,
  config,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const edge =
    selection?.kind === "edge"
      ? edges.find((item) => item.id === selection.id)
      : undefined;
  const node =
    selection?.kind === "node"
      ? nodes.find((item) => item.id === selection.id)
      : undefined;
  const source = edge
    ? nodes.find((item) => item.id === edge.source)
    : undefined;
  const target = edge
    ? nodes.find((item) => item.id === edge.target)
    : undefined;
  const kind = source && target ? linkKind(source.data, target.data) : null;
  const removable = edge
    ? disconnectLink(config, edge.source, edge.target) !== null
    : false;

  const disconnect = async () => {
    if (!edge) return;
    const change = disconnectLink(config, edge.source, edge.target);
    if (!change) {
      message.warning(t("topology.editUnsupported"));
      return;
    }
    try {
      await applyLinkChange(change);
      message.success(t("topology.editDisconnected"));
      onClose();
    } catch (err) {
      message.error(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Drawer
      title={node?.data.label ?? edge?.id ?? "—"}
      open={selection !== null}
      onClose={onClose}
      placement="right"
      width={420}
      destroyOnClose
    >
      {edge ? (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Tag>{edge.kind}</Tag>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {edge.source} → {edge.target}
          </Typography.Paragraph>
          {kind && removable ? (
            <Button danger onClick={() => void disconnect()}>
              {t("topology.editDisconnect")}
            </Button>
          ) : (
            <Typography.Paragraph type="secondary">
              {t("topology.editReadOnly")}
            </Typography.Paragraph>
          )}
        </Space>
      ) : node ? (
        <Typography.Paragraph type="secondary">
          {node.data.sub ?? node.data.label}
        </Typography.Paragraph>
      ) : null}
    </Drawer>
  );
}
