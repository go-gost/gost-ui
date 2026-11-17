# Topology Edit Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cuttle-style monitor/edit toggle to the gost-ui Overview topology with config-backed connection editing, fix node dragging, remove the terminal card on routed paths, and remove the layout-reset button.

**Architecture:** One `editing` boolean in `Overview` gates a single `Topology` component. `graph/build.ts` produces a read-only DAG; `graph/links.ts` maps a whitelist of four source→target kind pairs to config mutations. Edits go through existing REST resource APIs and a config refresh, never optimistic updates. Node positions are controlled by `Topology` state and persisted per API address to localStorage.

**Tech Stack:** React 18, TypeScript strict, antd 5.16, `@xyflow/react` v12, Vite 4, Vitest 0.34 (no jsdom).

**Spec:** `docs/superpowers/specs/2026-11-17-topology-edit-mode-design.md`

## Global Constraints

- No jsdom / @testing-library: tests are pure helpers plus source-contract assertions, following existing `src/components/Topology/*.test.ts`.
- UI strings go through `t()`; add both zh and en rows to `src/i18n/languages.csv` (source of truth; generated `*.json` is gitignored).
- Code comments in English.
- Config edits are **not optimistic**: await the REST PUT, then `configEvent.emit("apiUpdate")` and `useServerConfig.set(await getConfig())`.
- There is **no `/config/nodes` endpoint**; node edits must go through `chains[].hops[].nodes[]` or `services[].forwarder.nodes[]`.
- `npm test` and `npm run build` must both pass after every task. Commit after every completed task; never push unless explicitly asked.

## Review Focus

- A service with no chain and no forwarder must still render exactly one `target:direct` card (Task 1 builds the test).
- Chain and forwarder paths must render **no** `target` card and **no** `exit` edge — the last `node` card is terminal (Task 1).
- Dragging must update the visible node position on every `onNodesChange` position event, not only on drag-stop (Task 2).
- Unsupported, duplicate, and conflicting connections must return `null` and leave config untouched (Task 3).
- Edit mode must not churn the graph from live snapshots, and read-only edges must not expose a connect affordance (Tasks 4, 5).

---

### Task 1: Graph cleanup — terminal rule and reset removal

**Files:**
- Modify `src/graph/build.ts:199-205,431-435,455-459,481-488`
- Modify `src/graph/build.test.ts`
- Modify `src/Pages/Overview.tsx`
- Modify `src/components/Topology/index.tsx`
- Modify `src/graph/positions.ts`, `src/graph/positions.test.ts`
- Delete `src/components/Topology/reset.ts`, `src/components/Topology/reset.test.ts`
- Modify `src/components/Topology/interaction.test.ts`

- [ ] **Step 1: Write failing graph tests**

In `build.test.ts`: a chain fixture must produce **no** node with `data.kind === "target"` and **no** edge with `kind === "exit"`; a forwarder-nodes fixture must produce neither; a service with no chain/forwarder must produce exactly one node with id `target:direct` and one edge with `kind === "direct"` pointing at it.

- [ ] **Step 2: Run them to confirm they fail**

Run `npx vitest run src/graph/build.test.ts`; expected FAIL on the new assertions.

- [ ] **Step 3: Change `build.ts`**

Narrow `ensureTarget` to `id: "target:direct"` only; delete the two `addEdge(..., "target", "exit", ...)` calls and their `ensureTarget("target")` calls in the chain-node loop and the forwarder-nodes loop. Leave the `direct` path untouched.

- [ ] **Step 4: Remove reset wiring**

In `Overview.tsx` delete the `resetLayout` import, `resetKey` state, the reset `Button` and the `resetKey` prop. In `Topology/index.tsx` delete the `resetKey` prop and change the effect dependency list from `[infoAddr, resetKey]` to `[infoAddr]`; keep the `loadPositions`/`setLayoutNonce` body. Remove the `clearPositions` export from `positions.ts` and its assertions from `positions.test.ts`. Delete `reset.ts` and `reset.test.ts`.

- [ ] **Step 5: Pin the removal in `interaction.test.ts`**

Assert `Overview.tsx` contains no `resetLayout` and `Topology/index.tsx` contains no `resetKey`.

- [ ] **Step 6: Verify and commit**

Run `npm test` and `npm run build`; both pass. Commit.

**Implementation record (fill after task):** date/status, repo + commit SHA, files changed, tests/commands + results, review findings + fixes, deferred items/limitations.

---

### Task 2: Controlled node positions so drag follows the cursor

**Files:**
- Modify `src/graph/positions.ts` (add pure helper)
- Modify `src/graph/positions.test.ts`
- Modify `src/components/Topology/index.tsx`
- Modify `src/components/Topology/interaction.test.ts`

**Interfaces:**
- Produces: `applyNodePositionChanges(saved: PositionMap, changes: readonly {type: string; id: string; position?: {x:number;y:number}}[]): PositionMap` — used by Task 2's component only.
- Consumes: `loadPositions`, `savePositions`, `resolvePositions` (existing).

- [ ] **Step 1: Write the failing pure test**

In `positions.test.ts`: a `position` change with a new position replaces that id while preserving other saved entries; a `dimensions` change is ignored; an unchanged object identity is returned when there are no position changes.

- [ ] **Step 2: Run it to confirm it fails**

Run `npx vitest run src/graph/positions.test.ts`.

- [ ] **Step 3: Implement `applyNodePositionChanges` in `src/graph/positions.ts`**

Pure function, no mutation of `saved`.

- [ ] **Step 4: Wire controlled positions in `Topology/index.tsx`**

Replace `savedRef` with `const [saved, setSaved] = useState(() => loadPositions(infoAddr))`; keep the `infoAddr` effect reloading state; use `saved` in `resolvePositions`; add `onNodesChange` that calls `setSaved((prev) => applyNodePositionChanges(prev, changes))`; leave `onNodeDragStop` saving `saved` to localStorage. Add `onNodesChange={onNodesChange}` to `<ReactFlow>`.

- [ ] **Step 5: Add a source-contract assertion**

`interaction.test.ts`: `Topology/index.tsx` contains `onNodesChange=` and `applyNodePositionChanges(`.

- [ ] **Step 6: Verify and commit**

`npm test` + `npm run build`; commit.

**Implementation record (fill after task):** date/status, repo + commit SHA, files changed, tests/commands + results, review findings + fixes, deferred items/limitations.

---

### Task 3: `graph/links.ts` — whitelist and config mapping

**Files:**
- Create `src/graph/links.ts`
- Create `src/graph/links.test.ts`

**Interfaces:**
- Produces:
  - `type LinkKind = "service-chain" | "chain-hop" | "hop-node" | "service-forwarder"`
  - `interface LinkChange { resource: "services" | "chains" | "hops"; name: string; config: Config }`
  - `parseGraphId(id: string): { kind: string; name: string; chain?: string } | null`
  - `linkKind(source: GraphNodeData, target: GraphNodeData): LinkKind | null`
  - `connectLink(config: Config, sourceId: string, targetId: string, stage?: "handler" | "listener"): LinkChange | null`
  - `disconnectLink(config: Config, sourceId: string, targetId: string): LinkChange | null`
- Consumes: `Config` from `src/api/types.ts`, `GraphNodeData` from `src/graph/build.ts`.

- [ ] **Step 1: Write failing tests**

Cover: `linkKind` accepts exactly the four pairs and returns `null` for module/exit/direct pairs; `connectLink("service:web" → "chain:c1")` sets `handler.chain = "c1"` (and `listener.chain` when `stage === "listener"`); `chain:c1 → hop:registry-h` appends `{name:"registry-h"}` to `c1.hops`; `hop:registry-h → node:n1` appends `{name:"n1"}` to `hops[registry-h].nodes`; `service:web → hop:h1` sets `forwarder.hop = "h1"`. Duplicate links return `null`; `service-forwarder` when `forwarder.nodes` is non-empty returns `null`; unsupported pairs return `null`. `disconnectLink` inverts each case and returns `null` when the reference is absent.

- [ ] **Step 2: Run them to confirm they fail**

Run `npx vitest run src/graph/links.test.ts`.

- [ ] **Step 3: Implement `links.ts`**

Deep-clone config before mutating; keep helpers pure and side-effect free. For inline hop ids `hop:<chain>/<name>`, `hop-node` targets `chains[chain].hops[name].nodes`; for registry ids `hop:<name>`, target `hops[name].nodes`. Reject `chain → hop` when the target hop id is chain-scoped.

- [ ] **Step 4: Run tests and commit**

`npm test` + `npm run build`; commit.

**Implementation record (fill after task):** date/status, repo + commit SHA, files changed, tests/commands + results, review findings + fixes, deferred items/limitations.

---

### Task 4: Mode toggle, frozen snapshot, and drag gating

**Files:**
- Modify `src/Pages/Overview.tsx`
- Modify `src/components/Topology/index.tsx`
- Modify `src/i18n/languages.csv`
- Create `src/components/Topology/mode.test.ts`

- [ ] **Step 1: Write failing source-contract tests**

Assert `Overview.tsx` contains `editing`, `EditOutlined`, `aria-pressed={editing}`, the two i18n keys `topology.edit` / `topology.exitEdit`, and the paused tag key `topology.editPaused`; assert `Topology/index.tsx` has an `editing: boolean` prop and `nodesDraggable={editing}`.

- [ ] **Step 2: Run them to confirm they fail**

`npx vitest run src/components/Topology/mode.test.ts`.

- [ ] **Step 3: Implement the toggle**

In `Overview`: add `const [editing, setEditing] = useState(false)`; add the toolbar button with `type={editing ? "primary" : "default"}`, `aria-pressed`, label `t(editing ? "topology.exitEdit" : "topology.edit")`, and pass `editing` to `<Topology>`. In edit mode render the orange `Tag` with `t("topology.editPaused")` and hide the animation `Space`. Keep `useSnapshot` polling for status; add `const [editSnapshot, setEditSnapshot] = useState<Snapshot | null>(null)` and set it from the current `snapshot` when entering edit mode, then pass `editing ? editSnapshot : snapshot` into `<Topology>`.

- [ ] **Step 4: Gate dragging**

In `Topology`: add `editing: boolean` to props, use `nodesDraggable={editing}` and `deleteKeyCode={null}`.

- [ ] **Step 5: Add i18n rows**

`topology.edit,编辑,Edit`, `topology.exitEdit,退出编辑,Exit edit`, `topology.editPaused,编辑模式 · 统计已暂停,Edit mode · stats paused` in `src/i18n/languages.csv`.

- [ ] **Step 6: Verify and commit**

`npm test` + `npm run build`; commit.

**Implementation record (fill after task):** date/status, repo + commit SHA, files changed, tests/commands + results, review findings + fixes, deferred items/limitations.

---

### Task 5: Connect/disconnect in edit mode with an edit panel

**Files:**
- Modify `src/components/Topology/index.tsx`
- Modify `src/graph/nodes.tsx`
- Create `src/components/Topology/EditPanel.tsx`
- Create `src/utils/applyLinkChange.ts`
- Modify `src/components/Topology/mode.test.ts`
- Modify `src/i18n/languages.csv`

**Interfaces:**
- Consumes: `LinkChange`, `connectLink`, `disconnectLink`, `linkKind` from Task 3; `editing` prop from Task 4.
- Produces: `applyLinkChange(change: LinkChange): Promise<void>` — performs the REST PUT, emits `configEvent("apiUpdate")` and refreshes `useServerConfig`.

- [ ] **Step 1: Write failing source-contract tests**

Assert `Topology/index.tsx` contains `onConnect=` and `connectLink(`; `nodes.tsx` uses `isConnectable={data.editable}`; `EditPanel.tsx` contains `disconnectLink(`; `applyLinkChange.ts` contains `configEvent.emit("apiUpdate")`.

- [ ] **Step 2: Run them to confirm they fail**

`npx vitest run src/components/Topology/mode.test.ts`.

- [ ] **Step 3: Make handles connectable only while editing**

In `Topology`'s node construction set `data: { ...n.data, pulse: ..., editable: editing }`. In `nodes.tsx`, each `Handle` uses `isConnectable={!!data.editable}` and `opacity: data.editable ? 1 : 0`; add `editable?: boolean` to `GraphNodeData`.

- [ ] **Step 4: Implement `applyLinkChange`**

`await API[change.resource].put(change.name, resourceObject)` where `resourceObject` is the entry with `name === change.name` in `change.config[change.resource]`; then `configEvent.emit("apiUpdate")` and `useServerConfig.set(await getConfig())`. Wrap errors so the caller can show `message.error`.

- [ ] **Step 5: Wire `onConnect` and the panel**

`Topology.onConnect = ({source,target}) => { const change = connectLink(config as Config, source, target); if (!change) { message.warning(...); return; } await applyLinkChange(change); }`. In edit mode render `EditPanel` for the current selection: for editable edges offer `断开` (`disconnectLink` + `applyLinkChange`), for read-only edges show the "edit in Config" hint. Add i18n rows `topology.edit.disconnect`, `topology.edit.readOnly`, `topology.edit.unsupported`.

- [ ] **Step 6: Verify and commit**

`npm test` + `npm run build`; commit. Report that UI interaction was verified only by TypeScript/Vitest/source checks, not a browser.

**Implementation record (fill after task):** date/status, repo + commit SHA, files changed, tests/commands + results, review findings + fixes, deferred items/limitations.
