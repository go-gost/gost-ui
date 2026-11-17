import type { CSSProperties } from "react";
import type { NodeKind } from "./build";

export const HANDLE_SIZE = 12;

const xyFallback =
  "var(--xy-node-background-color, var(--xy-node-background-color-default, #fff))";

/** Per-kind card surfaces. The CSS variables are defined for both themes in
 * src/index.less; the React Flow variable is the fallback if they are absent. */
export const NODE_SURFACE: Record<NodeKind, string> = {
  service: `var(--gost-node-service-bg, ${xyFallback})`,
  module: `var(--gost-node-module-bg, ${xyFallback})`,
  chain: `var(--gost-node-chain-bg, ${xyFallback})`,
  hop: `var(--gost-node-hop-bg, ${xyFallback})`,
  node: `var(--gost-node-node-bg, ${xyFallback})`,
  target: `var(--gost-node-target-bg, ${xyFallback})`,
  unresolved: `var(--gost-node-unresolved-bg, ${xyFallback})`,
};

export const GRID_COLOR = "var(--gost-topo-grid, #e2e8f0)";

/** Each card publishes its surface as --gost-node-active-bg. */
export const ACTIVE_SURFACE =
  "var(--gost-node-active-bg, var(--xy-node-background-color, var(--xy-node-background-color-default, #fff)))";

/** Publish a node kind's tinted surface for the card and its handles. */
export function surfaceStyle(kind: NodeKind): CSSProperties {
  return { "--gost-node-active-bg": NODE_SURFACE[kind] } as CSSProperties;
}

/** The shell is read-only: keep handles mounted as edge anchors, hide the dots. */
export function nodeHandleStyle(color: string, surface = ACTIVE_SURFACE): CSSProperties {
  return {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    background: color,
    border: `2px solid ${surface}`,
    opacity: 0,
  };
}
