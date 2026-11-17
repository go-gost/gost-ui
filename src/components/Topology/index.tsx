import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type OnMove,
  type EdgeMouseHandler,
  type Node,
  type NodeMouseHandler,
  type OnNodeDrag,
  type OnNodesChange,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Config } from "../../api/types";
import type { Snapshot } from "../../api/dashboard";
import { buildGraph, type GraphNode } from "../../graph/build";
import { resolvePositions } from "../../graph/placement";
import { edgeFlowState, edgeWidth } from "../../graph/edgeFlow";
import {
  clampVelocity,
  decayVelocity,
  dragVelocity,
  INERTIA_MIN_SPEED,
  INERTIA_MIN_START_SPEED,
  speedOf,
  type PanSample,
} from "../../graph/inertia";
import { loadViewport, saveViewport } from "../../graph/viewport";
import { GRID_COLOR } from "../../graph/nodeSurface";
import { pulsesByLabel } from "../../graph/nodePulse";
import {
  applyNodePositionChanges,
  loadPositions,
  savePositions,
} from "../../graph/positions";
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
  onSelect,
}: TopologyProps) {
  const [flow, setFlow] = useState<ReactFlowInstance | null>(null);
  const [saved, setSaved] = useState(() => loadPositions(infoAddr));
  const viewportRef = useRef(loadViewport(infoAddr));
  const samplesRef = useRef<PanSample[]>([]);
  const glideRef = useRef<number | null>(null);
  const [layoutNonce, setLayoutNonce] = useState(0);
  const isDark = useIsDark();

  useEffect(() => {
    setSaved(loadPositions(infoAddr));
    viewportRef.current = loadViewport(infoAddr);
    setLayoutNonce((n) => n + 1);
  }, [infoAddr]);

  const built = useMemo(
    () => buildGraph({ config, snapshot }),
    [config, snapshot]
  );

  const { nodes, edges } = useMemo(() => {
    const placed = resolvePositions(built.nodes, built.edges, saved);
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
          width: edgeWidth(bytes),
          pulse: bytes > 0 ? 1 : 0,
          duration: bytes > 0 ? flowDuration(bytes) : 0.9,
        },
      };
    });

    return { nodes: laidNodes, edges: laidEdges };
  }, [built, activity, selection, layoutNonce, saved]);

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setSaved((prev) => applyNodePositionChanges(prev, changes));
  }, []);

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_, node) => {
      const next = { ...saved, [node.id]: node.position };
      setSaved(next);
      savePositions(infoAddr, next);
    },
    [infoAddr, saved]
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

  const cancelGlide = useCallback(() => {
    if (glideRef.current !== null) {
      cancelAnimationFrame(glideRef.current);
      glideRef.current = null;
    }
    samplesRef.current = [];
  }, []);

  useEffect(() => cancelGlide, [cancelGlide]);

  const onMoveStart: OnMove = useCallback(
    (event) => {
      cancelGlide();
      if (event?.type === "mousedown" || event?.type === "touchstart") {
        samplesRef.current = [];
      }
    },
    [cancelGlide]
  );

  const onMove: OnMove = useCallback((_, viewport) => {
    if (glideRef.current !== null) return;
    samplesRef.current.push({
      t: performance.now(),
      x: viewport.x,
      y: viewport.y,
    });
    if (samplesRef.current.length > 12) samplesRef.current.shift();
  }, []);

  const onMoveEnd: OnMove = useCallback(
    (_, viewport) => {
      saveViewport(infoAddr, viewport);
      if (glideRef.current !== null) return;
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      const velocity = clampVelocity(
        dragVelocity(samplesRef.current, performance.now())
      );
      samplesRef.current = [];
      if (speedOf(velocity) < INERTIA_MIN_START_SPEED || !flow) return;

      let current = velocity;
      let last = performance.now();
      const tick = (now: number) => {
        const dt = Math.min(now - last, 50);
        last = now;
        const vp = flow.getViewport();
        void flow.setViewport({
          x: vp.x + current.vx * dt,
          y: vp.y + current.vy * dt,
          zoom: vp.zoom,
        });
        current = decayVelocity(current, dt);
        if (speedOf(current) < INERTIA_MIN_SPEED) {
          glideRef.current = null;
          return;
        }
        glideRef.current = requestAnimationFrame(tick);
      };
      glideRef.current = requestAnimationFrame(tick);
    },
    [flow, infoAddr]
  );

  const selectedNodeId =
    selection?.kind === "node" ? selection.id : undefined;

  return (
    <div
      style={{ width: "100%", height: "100%" }}
      onPointerDownCapture={cancelGlide}
      onWheelCapture={cancelGlide}
    >
      <ReactFlow
        colorMode={isDark ? "dark" : "light"}
        nodes={nodes.map((n) => ({
          ...n,
          selected: n.id === selectedNodeId,
        }))}
        onNodesChange={onNodesChange}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView={!viewportRef.current}
        fitViewOptions={{ padding: 0.15 }}
        defaultViewport={viewportRef.current ?? undefined}
        nodesDraggable
        minZoom={0.2}
        maxZoom={1.75}
        onMoveStart={onMoveStart}
        onMove={onMove}
        onMoveEnd={onMoveEnd}
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

