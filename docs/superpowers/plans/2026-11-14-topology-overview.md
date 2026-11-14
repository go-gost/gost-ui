# Topology Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the table-first Overview page with a live topology graph of services, modules, chains, hops, nodes and the exit target.

**Architecture:** A pure `src/graph/` layer derives nodes, edges, health moods, activity pulses and layout from `GET /config` plus `GET /dashboard/snapshot`; a thin `@xyflow/react` + `dagre` presentation layer renders it. The existing tables move below the graph into a collapsible section and stay unchanged.

**Tech Stack:** React 18, TypeScript 5, antd 5, Vite 4, vitest 0.34, `@xyflow/react` 12, `dagre` 0.8.

**Spec:** `docs/superpowers/specs/2026-11-14-topology-overview-design.md`

## Global Constraints

- No `x/` or `gost/` changes. The graph is derived entirely from `/config` and `/dashboard/snapshot`.
- `master` push deploys gh-pages; never push without an explicit instruction.
- Source strings are English; zh/en pairs go in `src/i18n/languages.csv` (`src/i18n/*.json` is generated and gitignored).
- Repo-wide `npm run lint` is red at base (`src/Pages/Home.tsx:1:1`,
  `src/components/ModalForm.tsx:83:33` unused-disable errors plus 12 warnings). Lint only the files a task touches and record the scoping.
- Test files match `src/**/*.test.ts` only (`vite.config.ts` `test.include`); component/`.tsx` tests are out of scope.
- Health ratios are `errors / (errors + successes)`; `connects`/`calls`/`totalConns` count successes because `errors` counts failures separately.
- Quota has no dashboard series; quota nodes read `services[].status.quotas[]`.
- Pulse source is a diff of `snapshot.services[name].stats` between polls, never `history[]`.
- Node ids: `service:<name>`, `module:<kind>:<name>`, `chain:<name>`, `hop:<name>` (registry) / `hop:<chain>/<hop>` (inline), `node:<hop>/<node>` (registry) / `node:<chain>/<hop>/<node>` (inline), `fwd:<service>/<index>`, `target`, `target:direct`.
- One shared `target` node; exit edges are labelled with the service name.
- Events stay in the table below this phase.

## Review Focus

- A service with **no chain and no forwarder** must still show a path to `target:direct`; a blank right-hand side would read as a broken graph.
- A service whose `listener.chain` and `handler.chain` differ must show **both** chains, or half of a real port-forward deployment disappears.
- A **shared module/hop/chain** (one name, several services) must be one card with N edges; duplicating it would break the "shared entity" promise and position stability.
- A config naming a module/chain/hop/node that does not exist must render a visible `unresolved` card, not silently drop the edge.
- A snapshot with `metricsEnabled: false` or a null snapshot (first poll still loading) must render the full topology with `—` counters instead of an empty canvas.
- Counters going **backwards** (process restart) must not produce a pulse burst or a negative rate.

---

### Task 1: Dependencies and config types

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)
- Modify: `vite.config.ts` (manual chunk)
- Modify: `src/api/types.ts` (quota types + `ServiceConfig.quotas`)

**Interfaces:**
- Produces: `ServiceQuota`, `ServiceConfig.quotas: ServiceQuota[]`, and a `xyflow` vendor chunk.

- [ ] **Step 1: Install the graph dependencies**

Run: `npm install @xyflow/react@^12.3.6 dagre@^0.8.5 && npm install -D @types/dagre@^0.7.52`
Expected: both appear in `package.json` (`@xyflow/react`, `dagre` in `dependencies`; `@types/dagre` in `devDependencies`).

- [ ] **Step 2: Add the vendor chunk**

In `vite.config.ts`, change the `manualChunks` object to include the graph runtime:

```ts
manualChunks: {
  antd: ["antd"],
  xyflow: ["@xyflow/react"],
},
```

- [ ] **Step 3: Add the quota types**

In `src/api/types.ts` add, next to `ServiceStats`:

```ts
export type ServiceQuota = {
  name: string;
  used: number;
  limit: number;
  startsAt: number;
  expiresAt: number;
  active: boolean;
  expired: boolean;
  blocked: boolean;
  direction: string;
};
```

and add to `ServiceConfig` (after `metadata`):

```ts
quotas: string[];
```

and to `ServiceStatus` (after `state`):

```ts
quotas: ServiceQuota[];
stoppedByLimit: boolean;
```

- [ ] **Step 4: Verify the build still passes**

Run: `npx tsc --noEmit && npm run build`
Expected: clean; the output lists a `xyflow` chunk.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/api/types.ts
git commit -m "chore: add xyflow and dagre for the topology graph"
```

---

### Task 2: Health moods

**Files:**
- Create: `src/graph/health.ts`
- Test: `src/graph/health.test.ts`

**Interfaces:**
- Produces:
  - `type Mood = "dead" | "error" | "warn" | "healthy" | "idle"`
  - `interface Counters { errors: number; successes: number }`
  - `errorRatio(c: Counters): number | null` — `errors/(errors+successes)`, `null` when both are 0
  - `moodOf(c: Counters, dead?: boolean): Mood`
  - `quotaMood(q: { blocked?: boolean; expired?: boolean; used?: number }): Mood`

- [ ] **Step 1: Write the failing test**

```ts
import { expect, test } from "vitest";
import { errorRatio, moodOf, quotaMood } from "./health";

test("ratio uses errors over errors plus successes", () => {
  expect(errorRatio({ errors: 20, successes: 1 })).toBeCloseTo(20 / 21);
  expect(errorRatio({ errors: 0, successes: 0 })).toBeNull();
  expect(errorRatio({ errors: 0, successes: 5 })).toBe(0);
});

test("moods follow the thresholds", () => {
  expect(moodOf({ errors: 0, successes: 0 })).toBe("idle");
  expect(moodOf({ errors: 0, successes: 10 })).toBe("healthy");
  expect(moodOf({ errors: 1, successes: 99 })).toBe("warn");
  expect(moodOf({ errors: 1, successes: 10 })).toBe("error");
  expect(moodOf({ errors: 1, successes: 1 })).toBe("dead");
});

test("dead wins over any ratio, including no traffic", () => {
  expect(moodOf({ errors: 0, successes: 0 }, true)).toBe("dead");
  expect(moodOf({ errors: 0, successes: 100 }, true)).toBe("dead");
});

test("a failed service with no traffic is dead, not idle", () => {
  expect(moodOf({ errors: 0, successes: 0 }, true)).not.toBe("idle");
});

test("quota moods", () => {
  expect(quotaMood({ blocked: true, used: 5 })).toBe("dead");
  expect(quotaMood({ expired: true, used: 5 })).toBe("warn");
  expect(quotaMood({ used: 5 })).toBe("healthy");
  expect(quotaMood({ used: 0 })).toBe("idle");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/graph/health.test.ts`
Expected: FAIL — cannot resolve `./health`.

- [ ] **Step 3: Implement `src/graph/health.ts`**

Thresholds: `dead` when the caller passes `dead`, or when `errors > 0 && successes === 0`, or when the ratio is ≥ 0.5; `error` > 0.05; `warn` ≥ 0.01; `healthy` otherwise with traffic; `idle` when `errorRatio` is `null`.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/graph/health.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Lint the touched files**

Run: `npx eslint src/graph/health.ts src/graph/health.test.ts`
Expected: clean (repo-wide lint is red at base; scoping is recorded).

- [ ] **Step 6: Commit**

```bash
git add src/graph/health.ts src/graph/health.test.ts
git commit -m "feat(graph): map counters to health moods"
```

---

### Task 3: Graph builder

**Files:**
- Create: `src/graph/build.ts`
- Test: `src/graph/build.test.ts`
- Modify: `src/api/dashboard.ts` (no change expected; only import its types)

**Interfaces:**
- Consumes: `Config`, `ServiceConfig`, `ServiceQuota` from `src/api/types`; `Snapshot`, `ModuleSnapshot` from `src/api/dashboard`.
- Produces:

```ts
export type NodeKind = "service" | "module" | "chain" | "hop" | "node" | "target" | "unresolved";
export type ModuleKind = "admission" | "auther" | "bypass" | "resolver" | "hosts" | "limiter_conn" | "limiter_rate" | "limiter_traffic" | "quota";
export type EdgeKind = "attach" | "chain" | "direct" | "hop" | "node" | "exit" | "forward";
export interface GraphNodeData extends Record<string, unknown> {
  kind: NodeKind;
  label: string;
  sub?: string;
  moduleKind?: ModuleKind;
  stage?: string;
  // raw counters, filled from the snapshot where one exists
  counters?: { errors: number; successes: number };
  dead?: boolean;
  bytesIn?: number;
  bytesOut?: number;
  conns?: number;
  rateIn?: number;
  rateOut?: number;
  quota?: { used: number; limit: number; blocked: boolean; expired: boolean };
  chain?: string;
  unresolvedRef?: string;
}
export type GraphNode = { id: string; position: { x: number; y: number }; data: GraphNodeData };
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  label?: string;
  chain?: string;
  services: string[];
}
export function buildGraph(input: { config: Config; snapshot: Snapshot | null }): { nodes: GraphNode[]; edges: GraphEdge[] };
```

- [ ] **Step 1: Write the failing test**

```ts
import { expect, test } from "vitest";
import { buildGraph } from "./build";
import type { Config, ServiceConfig } from "../api/types";
import type { Snapshot } from "../api/dashboard";

const empty = { services: [], chains: [], hops: [], nodes: [], bypasses: [], authers: [], admissions: [], hosts: [], resolvers: [], limiters: [], climiters: [], rlimiters: [], quotas: [] } as unknown as Config;

const service = (name: string, patch: Partial<ServiceConfig> = {}): ServiceConfig =>
  ({ name, addr: `:${name}`, listener: { type: "tcp" }, handler: { type: "http" }, metadata: {}, ...patch } as ServiceConfig);

const cfg = (patch: Partial<Config>): Config => ({ ...empty, ...patch });

test("a service with no chain and no forwarder draws a direct edge", () => {
  const { nodes, edges } = buildGraph({ config: cfg({ services: [service("a")] }), snapshot: null });
  expect(nodes.find((n) => n.id === "service:a")).toBeTruthy();
  expect(edges.find((e) => e.kind === "direct")?.target).toBe("target:direct");
});

test("a shared bypass is one node with one edge per service", () => {
  const { nodes, edges } = buildGraph({
    config: cfg({
      services: [service("a", { bypass: "by" } as any), service("b", { bypass: "by" } as any)],
      bypasses: [{ name: "by" } as any],
    }),
    snapshot: null,
  });
  expect(nodes.filter((n) => n.id === "module:bypass:by")).toHaveLength(1);
  expect(edges.filter((e) => e.target === "module:bypass:by")).toHaveLength(2);
  // No snapshot row (and no metrics) means no counters, not zeros.
  expect(nodes.find((n) => n.id === "module:bypass:by")?.data.counters).toBeUndefined();
});

test("the same auther on listener and handler is one node with two staged edges", () => {
  const { nodes, edges } = buildGraph({
    config: cfg({
      services: [service("a", { listener: { type: "tcp", auther: "au" } as any, handler: { type: "http", auther: "au" } as any })],
      authers: [{ name: "au" } as any],
    }),
    snapshot: null,
  });
  expect(nodes.filter((n) => n.id === "module:auther:au")).toHaveLength(1);
  const attach = edges.filter((e) => e.target === "module:auther:au");
  expect(attach.map((e) => e.label).sort()).toEqual(["handler", "listener"]);
});

test("listener and handler chains are both drawn", () => {
  const { edges } = buildGraph({
    config: cfg({
      services: [service("a", { listener: { type: "tcp", chain: "c1" } as any, handler: { type: "http", chain: "c2" } as any })],
      chains: [{ name: "c1", hops: [] } as any, { name: "c2", hops: [] } as any],
    }),
    snapshot: null,
  });
  expect(edges.filter((e) => e.kind === "chain").map((e) => e.target).sort()).toEqual(["chain:c1", "chain:c2"]);
});

test("ignoreChain draws no chain edge", () => {
  const { edges } = buildGraph({
    config: cfg({
      services: [service("a", { metadata: { ignoreChain: true }, handler: { type: "http", chain: "c1" } as any })],
      chains: [{ name: "c1", hops: [] } as any],
    }),
    snapshot: null,
  });
  expect(edges.filter((e) => e.kind === "chain")).toHaveLength(0);
});

test("chainGroup expands to one edge per chain", () => {
  const { edges } = buildGraph({
    config: cfg({
      services: [service("a", { handler: { type: "http", chainGroup: { chains: ["c1", "c2"] } } as any })],
      chains: [{ name: "c1", hops: [] } as any, { name: "c2", hops: [] } as any],
    }),
    snapshot: null,
  });
  expect(edges.filter((e) => e.kind === "chain").map((e) => e.target).sort()).toEqual(["chain:c1", "chain:c2"]);
});

test("an inline hop nests under its chain, a registry hop is shared and owns its nodes", () => {
  const shared = { name: "h1", nodes: [{ name: "n1", addr: "1.2.3.4:80" }] };
  const { nodes, edges } = buildGraph({
    config: cfg({
      services: [service("a", { handler: { type: "http", chain: "c1" } as any }), service("b", { handler: { type: "http", chain: "c2" } as any })],
      chains: [
        { name: "c1", hops: [{ name: "h1" }] } as any,
        { name: "c2", hops: [{ name: "h1" }] } as any,
      ],
      hops: [shared as any],
    }),
    snapshot: null,
  });
  expect(nodes.filter((n) => n.id === "hop:h1")).toHaveLength(1);
  expect(nodes.filter((n) => n.id === "node:h1/n1")).toHaveLength(1);
  expect(edges.filter((e) => e.target === "hop:h1")).toHaveLength(2);
});

test("a dangling reference becomes a visible unresolved card", () => {
  const { nodes, edges } = buildGraph({
    config: cfg({ services: [service("a", { bypass: "missing" } as any)] }),
    snapshot: null,
  });
  const unresolved = nodes.find((n) => n.data.kind === "unresolved");
  expect(unresolved?.data.unresolvedRef).toBe("missing");
  expect(edges.some((e) => e.target === unresolved?.id)).toBe(true);
});

test("forwarder nodes are positional and suppress the direct edge", () => {
  const { nodes, edges } = buildGraph({
    config: cfg({
      services: [service("a", { forwarder: { nodes: [{ name: "fw1", addr: "10.0.0.1:80" }, { name: "fw2", addr: "10.0.0.2:80" }] } as any })],
    }),
    snapshot: null,
  });
  expect(nodes.filter((n) => n.id.startsWith("fwd:a/")).map((n) => n.id)).toEqual(["fwd:a/0", "fwd:a/1"]);
  expect(edges.filter((e) => e.kind === "forward")).toHaveLength(2);
  expect(edges.filter((e) => e.kind === "direct")).toHaveLength(0);
});

test("counters come from the snapshot and quota from the config", () => {
  const snapshot = {
    version: 1, generatedAt: "", startedAt: "", sampleIntervalSeconds: 5, metricsEnabled: true,
    services: { a: { name: "a", state: "ready", stats: { totalConns: 10, currentConns: 2, inputBytes: 100, outputBytes: 200, totalErrs: 5 }, rate: { inputBytesPerSecond: 10, outputBytesPerSecond: 20 } } },
    modules: [], chains: {}, events: [], history: [],
  } as unknown as Snapshot;
  const { nodes } = buildGraph({
    config: cfg({
      services: [service("a", { quotas: ["q1"], status: { state: "ready", quotas: [{ name: "q1", used: 7, limit: 10, blocked: false, expired: false }] } as any })],
      quotas: [{ name: "q1" } as any],
    }),
    snapshot,
  });
  const svc = nodes.find((n) => n.id === "service:a")!;
  expect(svc.data.counters).toEqual({ errors: 5, successes: 10 });
  expect(svc.data.rateOut).toBe(20);
  const quota = nodes.find((n) => n.id === "module:quota:q1")!;
  expect(quota.data.quota).toMatchObject({ used: 7, limit: 10 });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/graph/build.test.ts`
Expected: FAIL — cannot resolve `./build`.

- [ ] **Step 3: Implement `src/graph/build.ts`**

Required behavior, all covered by the tests above:

- Column order is encoded in `kind`; positions stay `{x: 0, y: 0}` here (Task 5 lays out).
- Service node: label `name`, sub `${handler.type}+${listener.type} ${addr}`, `dead` when state is `failed`/`closed`; counters from `snapshot.services[name].stats` (`successes = totalConns`, `errors = totalErrs`).
- Module nodes come from the mapping table in the spec: `admissions/admission`, `bypasses/bypass`, `resolver`, `hosts`, `limiter` (`limiter_traffic`, stage `listener`), `handler.limiter` (`limiter_traffic`, stage `handler`), `climiter` (`limiter_conn`), `rlimiter` (`limiter_rate`), `quotas` (`quota`), `listener.auther(s)`/`handler.auther(s)` (`auther`, staged). Arrays and the single-name field are merged and deduplicated per stage. Edge id is `<service>:<kind>:<name>:<stage>`.
- Module counters: sum the snapshot module rows whose `kind` matches and whose `name` matches; `successes = calls`, `errors = errors`. A missing row leaves `counters` undefined.
- Quota nodes use the first referencing service's `status.quotas` entry by name for `quota`.
- Chain nodes: from `chains[]` resolved by name; unknown name → `unresolved` card with `unresolvedRef`.
- Hop resolution: an entry with `nodes`, `plugin`, `file`, `redis` or `http` is inline (`hop:<chain>/<hop>`); otherwise it is a registry hop (`hop:<name>`) resolved from `config.hops`, falling back to `unresolved`.
- Node resolution mirrors it: inline hop children are `node:<chain>/<hop>/<node>`, registry hop children are `node:<hop>/<node>`.
- Chain/node counters from `snapshot.chains[name]` (and its `nodes[]` by name); `successes = connects`, `errors = errors`.
- Forwarder: `forwarder.nodes[]` → `fwd:<service>/<index>` with a `forward` edge; `forwarder.hop` → edge from that hop card to the same forwarder nodes and no duplicate cards.
- `direct` edge only when no chain edge exists and no forwarder is configured.
- `exit` edges: each node row → `target`, label = the service name(s) that reach it.
- Every edge carries `services: []` (the service names whose traffic flows on it), used by Task 4.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/graph/build.test.ts`
Expected: 10 passed.

- [ ] **Step 5: Lint the touched files**

Run: `npx eslint src/graph/build.ts src/graph/build.test.ts`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/graph/build.ts src/graph/build.test.ts
git commit -m "feat(graph): build the topology from config and snapshot"
```

---

### Task 4: Activity pulses

**Files:**
- Create: `src/graph/activity.ts`
- Test: `src/graph/activity.test.ts`

**Interfaces:**
- Consumes: `Snapshot` from `src/api/dashboard`.
- Produces:

```ts
export interface Activity {
  services: Record<string, { pulse: number; bytes: number }>;
  modules: Record<string, { pulse: number }>;
}
export function emptyActivity(): Activity;
export function flowDuration(bytes: number): number;
export function diffActivity(prev: Snapshot | null, next: Snapshot, pulse: number): Activity;
```

`modules` is keyed `<kind>:<name>` and pulses on a `calls` increase.

- [ ] **Step 1: Write the failing test**

```ts
import { expect, test } from "vitest";
import { diffActivity, flowDuration } from "./activity";
import type { Snapshot } from "../api/dashboard";

const snap = (bytes: number, calls = 0): Snapshot =>
  ({
    version: 1, generatedAt: "", startedAt: "", sampleIntervalSeconds: 5, metricsEnabled: true,
    services: { a: { name: "a", state: "ready", stats: { totalConns: 1, currentConns: 1, inputBytes: bytes, outputBytes: 0, totalErrs: 0 }, rate: { inputBytesPerSecond: 0, outputBytesPerSecond: 0 } } },
    modules: [{ kind: "bypass", name: "by", stats: { calls, hits: 0, misses: 0, errors: 0, inputBytes: 0, outputBytes: 0, latencySumMicros: 0, latencyCount: 0, cacheHits: 0, cacheMisses: 0, cacheStores: 0 } }],
    chains: {}, events: [], history: [],
  }) as unknown as Snapshot;

test("the first snapshot never animates", () => {
  expect(diffActivity(null, snap(1000), 1)).toEqual({ services: {}, modules: {} });
});

test("a byte increase pulses the service", () => {
  const a = diffActivity(snap(1000), snap(1500), 2);
  expect(a.services.a).toEqual({ pulse: 2, bytes: 500 });
});

test("no increase means no pulse", () => {
  expect(diffActivity(snap(1000), snap(1000), 3).services.a).toBeUndefined();
});

test("counters going backwards reset instead of pulsing", () => {
  expect(diffActivity(snap(5000), snap(10), 4).services.a).toBeUndefined();
});

test("module calls increase pulses the module", () => {
  const a = diffActivity(snap(0, 10), snap(0, 12), 5);
  expect(a.modules["bypass:by"]).toEqual({ pulse: 5 });
  expect(a.modules["bypass:by"]).toBeTruthy();
});

test("flowDuration stays inside its bounds", () => {
  expect(flowDuration(0)).toBeCloseTo(0.9);
  expect(flowDuration(1e9)).toBeCloseTo(0.45);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/graph/activity.test.ts`
Expected: FAIL — cannot resolve `./activity`.

- [ ] **Step 3: Implement `src/graph/activity.ts`**

`flowDuration` is cuttle's: `min(0.9, max(0.45, 0.9 / sqrt(max(bytes, 1))))`. A service pulses when `inputBytes + outputBytes` increased; a restart (any counter lower than before) yields no pulses for that service. Modules pulse only when `calls` increased.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/graph/activity.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/graph/activity.ts src/graph/activity.test.ts
git commit -m "feat(graph): derive pulse activity between snapshots"
```

---

### Task 5: Layout and saved positions

**Files:**
- Create: `src/graph/layout.ts`, `src/graph/positions.ts`
- Test: `src/graph/layout.test.ts`, `src/graph/positions.test.ts`

**Interfaces:**
- Consumes: `GraphNode`, `GraphEdge`, `NodeKind` (Task 3).
- Produces:
  - `nodeSize(kind: NodeKind): { w: number; h: number }`
  - `layoutGraph(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[]`
  - `placeNewNodes(nodes: GraphNode[], saved: PositionMap): PositionMap`
  - `type PositionMap = Record<string, { x: number; y: number }>`
  - `positionKey(addr?: string): string`
  - `loadPositions(addr?: string): PositionMap`
  - `savePositions(addr: string | undefined, p: PositionMap): void`
  - `clearPositions(addr?: string): void`
  - `mergePositions(saved: PositionMap, nodes: Array<{ id: string; position: { x: number; y: number } }>): PositionMap`

- [ ] **Step 1: Write the failing layout test**

```ts
import { expect, test } from "vitest";
import { layoutGraph, nodeSize, placeNewNodes } from "./layout";
import type { GraphNode } from "./build";

const node = (id: string, kind: GraphNode["data"]["kind"]): GraphNode => ({ id, position: { x: 0, y: 0 }, data: { kind, label: id } });

test("sizes are positive and kind-specific", () => {
  expect(nodeSize("service").w).toBeGreaterThan(0);
  expect(nodeSize("service").w).not.toBe(nodeSize("module").w);
});

test("layout assigns distinct positions left to right", () => {
  const nodes = layoutGraph([node("service:a", "service"), node("chain:c", "chain")], [
    { id: "e", source: "service:a", target: "chain:c", kind: "chain", services: ["a"] },
  ]);
  const a = nodes.find((n) => n.id === "service:a")!;
  const c = nodes.find((n) => n.id === "chain:c")!;
  expect(a.position.x).toBeLessThan(c.position.x);
  expect(a.position).not.toEqual(c.position);
});

test("saved positions win and new nodes avoid them", () => {
  const nodes = [node("service:a", "service"), node("module:bypass:by", "module")];
  const placed = placeNewNodes(nodes, { "service:a": { x: 100, y: 100 } });
  expect(placed["service:a"]).toBeUndefined();
  expect(placed["module:bypass:by"]).toBeTruthy();
});
```

- [ ] **Step 2: Write the failing positions test**

```ts
import { beforeEach, expect, test } from "vitest";
import { clearPositions, loadPositions, mergePositions, positionKey, savePositions } from "./positions";

const store = new Map<string, string>();
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as unknown as Storage;

beforeEach(() => store.clear());

test("positions are keyed per API address", () => {
  expect(positionKey("http://a:1")).toBe("gost-ui:topology:http://a:1");
  expect(positionKey()).toBe("gost-ui:topology:-");
});

test("save, load and clear", () => {
  savePositions("x", { "service:a": { x: 1, y: 2 } });
  expect(loadPositions("x")).toEqual({ "service:a": { x: 1, y: 2 } });
  clearPositions("x");
  expect(loadPositions("x")).toEqual({});
});

test("corrupt storage reads as empty", () => {
  savePositions("x", {});
  localStorage.setItem(positionKey("x"), "not json");
  expect(loadPositions("x")).toEqual({});
});

test("merge keeps saved entries and adds new ones", () => {
  const merged = mergePositions({ a: { x: 1, y: 1 } }, [
    { id: "a", position: { x: 9, y: 9 } },
    { id: "b", position: { x: 2, y: 2 } },
  ]);
  expect(merged).toEqual({ a: { x: 1, y: 1 }, b: { x: 2, y: 2 } });
});
```

- [ ] **Step 3: Run both to verify they fail**

Run: `npx vitest run src/graph/layout.test.ts src/graph/positions.test.ts`
Expected: FAIL — the modules do not exist.

- [ ] **Step 4: Implement `src/graph/layout.ts` and `src/graph/positions.ts`**

`layout.ts` copies cuttle's approach: dagre `rankdir: "LR"`, `nodesep: 36`, `ranksep: 110`, margins 24, subtract half the node size from dagre's centre; `placeNewNodes` walks down then right in `size + 24` steps until the card does not overlap a saved one. Sizes: `service {w:250,h:82}`, `module {w:210,h:74}`, `chain {w:210,h:80}`, `hop {w:180,h:66}`, `node {w:230,h:82}`, `target {w:150,h:60}`, `unresolved {w:210,h:70}`.

`positions.ts` is the `localStorage` wrapper above with `try`/`catch` guards on both read and write.

- [ ] **Step 5: Run to verify they pass**

Run: `npx vitest run src/graph/layout.test.ts src/graph/positions.test.ts`
Expected: 3 + 4 passed.

- [ ] **Step 6: Commit**

```bash
git add src/graph/layout.ts src/graph/positions.ts src/graph/layout.test.ts src/graph/positions.test.ts
git commit -m "feat(graph): lay out the topology and persist positions"
```

---

### Task 6: Graph presentation

**Files:**
- Create: `src/graph/nodes.tsx`, `src/graph/edges.tsx`, `src/components/Topology/index.tsx`
- Modify: `src/i18n/languages.csv`

**Interfaces:**
- Consumes: everything from Tasks 3–5.
- Produces:
  - `type Selection = { kind: "node" | "edge"; id: string } | null`
  - `Topology({ config, snapshot, activity, selection, onSelect }: { config: Config; snapshot: Snapshot | null; activity: Activity; selection: Selection; onSelect: (s: Selection) => void })`
  - `nodeTypes` / `edgeTypes` registered for React Flow.
  - `resetLayout(): void` exported from `src/components/Topology/index.tsx` for the page toolbar.

- [ ] **Step 1: Implement `src/graph/nodes.tsx`**

One card component per kind, styled with `theme.useToken()` colours (no literals except the shared accent palette): an icon square, a title and a sub-line, a mood badge from `moodOf`, and a stats line rendered absolutely below the card so it never changes the node size. Handles: a `target` handle on the left and a `source` on the right for every non-service kind; service nodes have a source only; `target` has a target only. Register:

```ts
export const nodeTypes = { service: ServiceNode, module: ModuleNode, chain: ChainNode, hop: HopNode, node: NodeCard, target: TargetNode, unresolved: UnresolvedNode };
```

- [ ] **Step 2: Implement `src/graph/edges.tsx`**

`DotEdge` copied from cuttle: `getBezierPath`, `BaseEdge`, optional label at the midpoint, and three dots animated with `requestAnimationFrame` along the path when `data.pulse` changes (one traversal, then stop). Edge stroke comes from `data.color`, dashed when `data.dashed`. Register `edgeTypes = { dot: DotEdge }`.

- [ ] **Step 3: Implement `src/components/Topology/index.tsx`**

- `buildGraph` + `layoutGraph` in a `useMemo` keyed on `config` only (structure must not rebuild on every poll).
- Positions: `loadPositions(info?.addr)` on mount, `mergePositions` + `savePositions` on `onNodeDragStop`, and `placeNewNodes` for nodes missing from the saved map.
- Metrics/activity: a second `useEffect` merges fresh counters, mood and pulse into node data without touching positions.
- `ReactFlow` with `<Background />` and `<Controls />`, `fitView` on first render, `onNodeClick`/`onEdgeClick` → `onSelect`, `onPaneClick` → `onSelect(null)`, `nodesDraggable` and `panOnDrag` enabled, `nodesConnectable={false}`, `minZoom={0.2}`.
- Import `@xyflow/react/dist/style.css`.
- `resetLayout()` clears the stored positions and remounts the graph.

- [ ] **Step 4: Add i18n rows**

Append to `src/i18n/languages.csv`:

```csv
topology.kind.service,服务,Service
topology.kind.module,模块,Module
topology.kind.chain,转发链,Chain
topology.kind.hop,跳,Hop
topology.kind.node,节点,Node
topology.kind.target,目标,Target
topology.kind.unresolved,未解析引用,Unresolved
topology.stage.listener,监听器,Listener
topology.stage.handler,处理器,Handler
topology.mood.dead,不可用,Dead
topology.mood.error,错误率高,High error rate
topology.mood.warn,有错误,Errors
topology.mood.healthy,正常,Healthy
topology.mood.idle,无流量,No traffic
topology.empty,暂无可绘制的拓扑,No topology to draw
topology.metrics.disabled,未启用 metrics，链与节点无连接统计。,metrics is off; chain and node counters are unavailable.
topology.resetLayout,重置布局,Reset layout
topology.graph,拓扑图,Topology
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npx eslint src/graph src/components/Topology`
Expected: clean. `npm run build` lists the `xyflow` chunk.

- [ ] **Step 6: Commit**

```bash
git add src/graph/nodes.tsx src/graph/edges.tsx src/components/Topology/index.tsx src/i18n/languages.csv
git commit -m "feat(graph): render the topology canvas"
```

---

### Task 7: Detail panel and page composition

**Files:**
- Create: `src/components/Topology/Detail.tsx`
- Modify: `src/Pages/Overview.tsx`
- Modify: `src/i18n/languages.csv`

**Interfaces:**
- Consumes: `buildGraph` output, `Selection` (Task 6), `useSnapshot` (existing), `Summary`/`Services`/`Modules`/`Chains`/`Events`/`Sparkline` (existing).
- Produces: `Detail({ selection, nodes, edges, snapshot, onClose })` rendering a `Drawer` (right, 420 px; on `<md` a bottom drawer at 70 vh).

- [ ] **Step 1: Implement `src/components/Topology/Detail.tsx`**

Node drawer: title = label, a mood `Tag`, a `Descriptions` of the kind-specific numbers (service: state, addr, conns, in/out rate/bytes, errors; module: calls/hits/misses/errors/avg latency, limiter allowed/denied, quota used/limit/blocked; chain/node: connects, errors, avg connect; hop: node count; unresolved: the missing name) and, for a module with several referrers, one row per service with its own counters. Edge drawer: kind, source label → target label, stage, and the services whose traffic uses it. Unknown ids render the raw id, never a blank panel.

- [ ] **Step 2: Rewrite `src/Pages/Overview.tsx`**

Keep `useSnapshot` and the four result states. In the live/stale branch render, in order:

1. Toolbar: refresh button, updated-at text, the metrics hint (`topology.metrics.disabled`) when `!snapshot.metricsEnabled`, `Reset layout`, and a `Switch`/`Button` toggling the details area.
2. `<Topology … />` in a `Card` with `height: clamp(420px, 62vh, 900px)` and `padding: 0`.
3. Collapsed-by-default details area with the existing `Summary`, `History` sparklines, `Services`, `Modules`, `Chains`, `Events` cards, otherwise unchanged.

`const activity = useMemo(() => diffActivity(prevRef.current, snapshot, seq), …)` keeping the previous snapshot in a ref so the pulse only fires on an actual delta.

- [ ] **Step 3: Add i18n rows**

```csv
topology.details,详情明细,Details
topology.details.show,展开明细,Show details
topology.details.hide,收起明细,Hide details
topology.detail.services,相关服务,Services
topology.detail.ref,引用,Reference
topology.detail.stage,阶段,Stage
topology.detail.counters,计数,Counters
topology.detail.config,配置,Config
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx eslint src/Pages/Overview.tsx src/components/Topology && npm test`
Expected: clean; all existing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/Pages/Overview.tsx src/components/Topology/Detail.tsx src/i18n/languages.csv
git commit -m "feat(overview): put the topology above the tables"
```

---

### Task 8: End-to-end verification

**Files:** none (verification only); `docs/superpowers/specs/2026-11-14-topology-overview-design.md` gets the outcome appended if reality differs.

**Interfaces:** none.

- [ ] **Step 1: Full gate**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all pass, `xyflow` chunk present, no generated `src/i18n/*.json` in `git status`.

- [ ] **Step 2: Live smoke against a real gost**

Build `gost` against the local `x` (`replace github.com/go-gost/x => ../x`, restored afterwards), run
`gost -L 'http://127.0.0.1:18080?bypass=by1' -F 'http://127.0.0.1:9?bypass=by1' -api 127.0.0.1:18000 -metrics 127.0.0.1:19000 -C '{"dashboard":{"enabled":true},"bypasses":[{"name":"by1","whitelist":true,"patterns":["*"]}]}'`,
serve `dist/` with the loopback demo proxy used in the previous phase, and open `/?api=…`.

Verify, in this order: graph renders with service, bypass, chain, hop, node and `target`; the bypass card shows calls after a few proxied requests; with `-metrics` off the chain/node counters read `—` and the hint appears; killing the process shows the stale alert over a still-rendered graph; a 404 shows the disabled result; dragging a node and reloading keeps its position; `Reset layout` restores the dagre arrangement; a 320 px viewport pans/zooms without page overflow.

- [ ] **Step 3: Record the outcome**

Append a "Verification" section to the spec with the date, the commands, and anything that differed from the design.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-11-14-topology-overview-design.md
git commit -m "docs(specs): record topology verification"
```

---

## Implementation records

Fill one subsection per task after it is complete, then include it in that task's commit.

### Task 1
- Date/status:
- Repository + commit SHA:
- Files changed:
- Tests/commands and results:
- Review findings and fixes:
- Deferred items/limitations:

### Task 2
- Date/status:
- Repository + commit SHA:
- Files changed:
- Tests/commands and results:
- Review findings and fixes:
- Deferred items/limitations:

### Task 3
- Date/status:
- Repository + commit SHA:
- Files changed:
- Tests/commands and results:
- Review findings and fixes:
- Deferred items/limitations:

### Task 4
- Date/status:
- Repository + commit SHA:
- Files changed:
- Tests/commands and results:
- Review findings and fixes:
- Deferred items/limitations:

### Task 5
- Date/status:
- Repository + commit SHA:
- Files changed:
- Tests/commands and results:
- Review findings and fixes:
- Deferred items/limitations:

### Task 6
- Date/status:
- Repository + commit SHA:
- Files changed:
- Tests/commands and results:
- Review findings and fixes:
- Deferred items/limitations:

### Task 7
- Date/status:
- Repository + commit SHA:
- Files changed:
- Tests/commands and results:
- Review findings and fixes:
- Deferred items/limitations:

### Task 8
- Date/status:
- Repository + commit SHA:
- Files changed:
- Tests/commands and results:
- Review findings and fixes:
- Deferred items/limitations:
