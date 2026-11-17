import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type EdgeMouseHandler,
  type Node,
  type NodeMouseHandler,
  type OnNodeDrag,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Config } from "../../api/types";
import type { Snapshot } from "../../api/dashboard";
import { buildGraph, type GraphNode } from "../../graph/build";
import { resolvePositions } from "../../graph/placement";
import { edgeFlowState } from "../../graph/edgeFlow";
import { GRID_COLOR } from "../../graph/nodeSurface";
import { pulsesByLabel } from "../../graph/nodePulse";
import { loadPositions, savePositions } from "../../graph/positions";
import { flowDuration, type Activity } from "../../graph/activity";
import { nodeTypes } from "../../graph/nodes";
import { edgeTypes } from "../../graph/edges";
import { useIsDark } from "../../utils/useTheme";

export type Selection =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string }
  | null;

export interface TopologyProps {
  config: Config;
  snapshot: Snapshot | null;
  activity: Activity;
  selection: Selection;
  infoAddr?: string;
  resetKey: number;
  onSelect: (selection: Selection) => void;
}

type RFNode = Node<GraphNode["data"]>;
type RFEdge = Edge;

export default function Topology({
  config,
  snapshot,
  activity,
  selection,
  infoAddr,
  resetKey,
  onSelect,
}: TopologyProps) {
  const [flow, setFlow] = useState<ReactFlowInstance | null>(null);
  const savedRef = useRef(loadPositions(infoAddr));
  const [layoutNonce, setLayoutNonce] = useState(0);
  const isDark = useIsDark();

  useEffect(() => {
    savedRef.current = loadPositions(infoAddr);
    setLayoutNonce((n) => n + 1);
  }, [infoAddr, resetKey]);

  const built = useMemo(
    () => buildGraph({ config, snapshot }),
    [config, snapshot]
  );

  const { nodes, edges } = useMemo(() => {
    const placed = resolvePositions(built.nodes, built.edges, savedRef.current);
    const pulses = pulsesByLabel(activity);
    const laidNodes: RFNode[] = built.nodes.map((n) => ({
      id: n.id,
      type: n.data.kind,
      position: placed[n.id] ?? n.position,
      data: { ...n.data, pulse: pulses.get(n.data.label) ?? 0 },
    }));

    const deadServices = new Set(
      built.nodes
        .filter((n) => n.data.kind === "service" && n.data.dead)
        .map((n) => n.data.label)
    );

    const pulseBytes = new Map<string, number>();
    for (const [name, info] of Object.entries(activity.services)) {
      pulseBytes.set(name, info.bytes);
    }
    const serviceByEdge = new Map<string, string[]>();
    for (const edge of built.edges) {
      serviceByEdge.set(edge.id, edge.services);
    }

    const laidEdges: RFEdge[] = built.edges.map((edge) => {
      const services = serviceByEdge.get(edge.id) ?? [];
      const bytes = services.reduce(
        (sum, name) => sum + (pulseBytes.get(name) ?? 0),
        0
      );
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "dot",
        label: edge.label,
        animated: false,
        selected: selection?.kind === "edge" && selection.id === edge.id,
        data: {
          ...edgeFlowState(edge, deadServices),
          pulse: bytes > 0 ? 1 : 0,
          duration: bytes > 0 ? flowDuration(bytes) : 0.9,
        },
      };
    });

    return { nodes: laidNodes, edges: laidEdges };
  }, [built, activity, selection, layoutNonce]);

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_, node) => {
      savedRef.current = {
        ...savedRef.current,
        [node.id]: node.position,
      };
      savePositions(infoAddr, savedRef.current);
    },
    [infoAddr]
  );

  const onPaneClick = useCallback(() => onSelect(null), [onSelect]);
  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => onSelect({ kind: "node", id: node.id }),
    [onSelect]
  );
  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_, edge) => onSelect({ kind: "edge", id: edge.id }),
    [onSelect]
  );

  const selectedNodeId =
    selection?.kind === "node" ? selection.id : undefined;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        colorMode={isDark ? "dark" : "light"}
        nodes={nodes.map((n) => ({
          ...n,
          selected: n.id === selectedNodeId,
        }))}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable
        minZoom={0.2}
        maxZoom={1.75}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        onInit={setFlow}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} color={GRID_COLOR} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

