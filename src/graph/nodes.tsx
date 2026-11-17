import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import {
  ApiOutlined,
  BranchesOutlined,
  CloudServerOutlined,
  CloseCircleOutlined,
  ExportOutlined,
  FrownOutlined,
  GatewayOutlined,
  LineChartOutlined,
  MehOutlined,
  SmileOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { formatCount } from "../components/Overview/format";
import { moodBadgeLabel, moodOf, type Mood } from "./health";
import type { GraphNodeData } from "./build";

type GNode = Node<GraphNodeData>;

const HANDLE_SIZE = 12;

const box: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: 10,
  borderRadius: 10,
  border: "1.5px solid",
  padding: "10px 12px",
  fontSize: 12,
  // React Flow switches these variables with its `colorMode`; antd CSS
  // variables are not available because cssVar is not enabled globally.
  background:
    "var(--xy-node-background-color, var(--xy-node-background-color-default, #fff))",
  color: "var(--xy-node-color, var(--xy-node-color-default, inherit))",
};

const handleStyle = (color: string): React.CSSProperties => ({
  width: HANDLE_SIZE,
  height: HANDLE_SIZE,
  background: color,
  border:
    "2px solid var(--xy-node-background-color, var(--xy-node-background-color-default, #fff))",
});

function selectionStyle(
  selected: boolean | undefined,
  color: string
): React.CSSProperties {
  return {
    borderColor: selected ? "#0ea5e9" : color,
    boxShadow: selected
      ? "inset 0 0 0 2px #0ea5e9"
      : "0 1px 2px rgba(16, 24, 40, 0.06)",
  };
}

const MOOD: Record<Exclude<Mood, "idle">, { color: string }> = {
  dead: { color: "#dc2626" },
  error: { color: "#d97706" },
  warn: { color: "#d97706" },
  healthy: { color: "#16a34a" },
};

function healthColor(counters: { errors: number; successes: number } | undefined, dead = false) {
  if (dead) return MOOD.dead.color;
  if (!counters) return "#94a3b8";
  const total = counters.errors + counters.successes;
  if (total === 0) return "#94a3b8";
  const ratio = counters.errors / total;
  if (ratio >= 0.5) return MOOD.dead.color;
  if (ratio > 0.05) return MOOD.error.color;
  if (ratio >= 0.01) return MOOD.warn.color;
  return MOOD.healthy.color;
}

function IconBadge({
  color,
  children,
  pulse,
}: {
  color: string;
  children: React.ReactNode;
  pulse?: number;
}) {
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: color,
        color: "#fff",
        flex: "none",
        outline: pulse ? `2px solid ${color}` : "none",
      }}
    >
      {children}
    </div>
  );
}

function NodeBody({ label, sub }: { label: string; sub?: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>
        {label}
      </div>
      {sub ? (
        <div
          style={{
            fontSize: 11,
            opacity: 0.7,
            marginTop: 2,
            whiteSpace: "nowrap",
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function NodeStats({
  counters,
}: {
  counters?: { errors: number; successes: number };
}) {
  if (!counters) return null;
  const total = counters.errors + counters.successes;
  const label = total === 0 ? "—" : `${formatCount(total)} ops`;
  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        marginTop: 2,
        fontSize: 11,
        opacity: 0.75,
        textAlign: "center",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {label}
      {counters.errors > 0 ? (
        <span style={{ color: "#dc2626" }}>{` · ${counters.errors} err`}</span>
      ) : null}
    </div>
  );
}

function MoodBadge({
  mood,
  label,
}: {
  mood: ReturnType<typeof moodOf>;
  label: string;
}) {
  if (mood === "idle") return null;
  const icon =
    mood === "dead" || mood === "error" ? (
      mood === "dead" ? (
        <CloseCircleOutlined />
      ) : (
        <FrownOutlined />
      )
    ) : mood === "warn" ? (
      <MehOutlined />
    ) : (
      <SmileOutlined />
    );
  return (
    <span
      data-status={mood}
      role="img"
      aria-label={label || undefined}
      title={label || undefined}
      style={{
        position: "absolute",
        top: 6,
        right: 6,
        color: MOOD[mood].color,
        fontSize: 14,
        lineHeight: 1,
        pointerEvents: "none",
      }}
    >
      {icon}
    </span>
  );
}

const TargetNode = ({ data, selected }: NodeProps<GNode>) => {
  return (
    <div
      style={{
        ...box,
        ...selectionStyle(selected, "#6366f1"),
        minWidth: 140,
        justifyContent: "center",
      }}
    >
      <IconBadge color="#6366f1">
        <ExportOutlined />
      </IconBadge>
      <NodeBody label={data.label} sub={data.sub} />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        style={handleStyle("#6366f1")}
      />
    </div>
  );
};

const ServiceNode = ({ data, selected }: NodeProps<GNode>) => {
  const counters = data.counters;
  const mood = moodOf(
    counters ?? { errors: 0, successes: 0 },
    !!data.dead
  );
  return (
    <div
      style={{
        ...box,
        ...selectionStyle(selected, healthColor(counters, !!data.dead)),
        minWidth: 250,
      }}
    >
      <IconBadge color="#0ea5e9">
        <GatewayOutlined />
      </IconBadge>
      <NodeBody label={data.label} sub={data.sub} />
      {data.rateIn !== undefined || data.rateOut !== undefined ? (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            fontSize: 11,
            opacity: 0.75,
            textAlign: "center",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {`↓${formatCount(data.rateIn ?? 0)}/s  ↑${formatCount(data.rateOut ?? 0)}/s`}
        </div>
      ) : null}
      <MoodBadge mood={mood} label={moodBadgeLabel(mood, counters)} />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        style={handleStyle("#0ea5e9")}
      />
    </div>
  );
};

const ModuleNode = ({ data, selected }: NodeProps<GNode>) => {
  const counters = data.counters;
  const kind = data.moduleKind ?? "module";
  const icon =
    kind === "auther" ? (
      <ApiOutlined />
    ) : kind === "bypass" ? (
      <BranchesOutlined />
    ) : kind === "limiter_traffic" ||
      kind === "limiter_conn" ||
      kind === "limiter_rate" ? (
      <LineChartOutlined />
    ) : (
      <ApiOutlined />
    );
  const color =
    kind === "auther"
      ? "#6366f1"
      : kind === "bypass"
        ? "#0ea5e9"
        : kind === "admission"
          ? "#8b5cf6"
          : kind === "quota"
            ? "#f97316"
            : "#0891b2";
  const mood = moodOf(counters ?? { errors: 0, successes: 0 }, !!data.dead);
  return (
    <div
      style={{
        ...box,
        ...selectionStyle(selected, color),
        minWidth: 210,
      }}
    >
      <IconBadge color={color}>{icon}</IconBadge>
      <NodeBody label={data.label} sub={data.sub} />
      <NodeStats counters={counters} />
      <MoodBadge mood={mood} label={moodBadgeLabel(mood, counters)} />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        style={handleStyle(color)}
      />
    </div>
  );
};

const ChainNode = ({ data, selected }: NodeProps<GNode>) => {
  const counters = data.counters;
  const mood = moodOf(counters ?? { errors: 0, successes: 0 }, !!data.dead);
  return (
    <div
      style={{
        ...box,
        ...selectionStyle(selected, healthColor(counters, !!data.dead)),
        minWidth: 210,
      }}
    >
      <IconBadge color="#0891b2">
        <BranchesOutlined />
      </IconBadge>
      <NodeBody label={data.label} sub={data.sub ?? "chain"} />
      <NodeStats counters={counters} />
      <MoodBadge mood={mood} label={moodBadgeLabel(mood, counters)} />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        style={handleStyle("#0891b2")}
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        style={handleStyle("#0891b2")}
      />
    </div>
  );
};

const HopNode = ({ data, selected }: NodeProps<GNode>) => {
  return (
    <div
      style={{
        ...box,
        ...selectionStyle(selected, "#7c3aed"),
        minWidth: 180,
        padding: "8px 12px",
      }}
    >
      <IconBadge color="#7c3aed">
        <BranchesOutlined />
      </IconBadge>
      <NodeBody label={data.label} sub={data.sub} />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        style={handleStyle("#7c3aed")}
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        style={handleStyle("#7c3aed")}
      />
    </div>
  );
};

const NodeCard = ({ data, selected }: NodeProps<GNode>) => {
  const counters = data.counters;
  const mood = moodOf(counters ?? { errors: 0, successes: 0 }, !!data.dead);
  return (
    <div
      style={{
        ...box,
        ...selectionStyle(selected, healthColor(counters, !!data.dead)),
        minWidth: 230,
      }}
    >
      <IconBadge color="#0891b2">
        <CloudServerOutlined />
      </IconBadge>
      <NodeBody label={data.label} sub={data.sub} />
      <NodeStats counters={counters} />
      <MoodBadge mood={mood} label={moodBadgeLabel(mood, counters)} />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        style={handleStyle("#0891b2")}
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        style={handleStyle("#0891b2")}
      />
    </div>
  );
};

const UnresolvedNode = ({ data, selected }: NodeProps<GNode>) => {
  return (
    <div
      style={{
        ...box,
        ...selectionStyle(selected, "#dc2626"),
        minWidth: 190,
        borderStyle: "dashed",
        // Translucent so it reads as light pink on white and dark red on dark.
        background: "rgba(220, 38, 38, 0.12)",
      }}
    >
      <IconBadge color="#dc2626">
        <WarningOutlined />
      </IconBadge>
      <NodeBody label={data.label} sub={data.sub} />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        style={handleStyle("#dc2626")}
      />
    </div>
  );
};

export const nodeTypes = {
  service: ServiceNode,
  module: ModuleNode,
  chain: ChainNode,
  hop: HopNode,
  node: NodeCard,
  target: TargetNode,
  unresolved: UnresolvedNode,
};
