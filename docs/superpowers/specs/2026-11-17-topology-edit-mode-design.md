# Topology edit mode and graph cleanup — design (2026-11-17)

## Intent

Users want the Overview topology to become the primary configuration surface over
time, following cuttle's example. This change adds a cuttle-style monitor/edit
toggle with **config-backed connection editing** for a well-defined subset of
edges, fixes node dragging, removes the redundant terminal card on routed paths,
and removes the layout-reset button.

## Goals

1. Add an edit toggle matching cuttle's interaction model (single button,
   `aria-pressed`, monitor by default, edit mode pauses live graph updates).
2. In edit mode, support **connect**, **disconnect**, and node drag; every config
   change goes through the existing REST API and triggers a config refresh.
3. Only these four connection directions are editable:
   `service→chain`, `chain→hop`, `hop→node`, `service→forwarder`.
4. Remove the `target`/`exit` card from chain and forwarder paths; the last
   `node` card is the terminal. Keep `target:direct` for services with **no chain
   and no forwarder**.
5. Fix drag-follow with controlled node positions.
6. Remove the "Reset layout" button and its wiring.

## Non-goals

- Full entity CRUD (services/chains/hops/nodes/modules) in the topology — the
  Config page keeps that role for now. This is the first step toward
  topology-first configuration, not the end state.
- Editing module-attach edges, chain/hop `exit` edges, or the `direct` edge in
  the graph. Selecting them in edit mode shows "edit in Config" guidance.
- Server-side/shared position storage (cuttle's `topology_positions` table);
  gost has no such API, so positions remain per-browser localStorage.
- Autolayout rework beyond removing the reset control.

## Constraints

- `build.ts` derives nodes/edges from config on every snapshot; edges carry a
  `kind` (`attach|chain|hop|node|forward|exit|direct`) and `services[]`.
- gost REST config API (`src/api/index.ts`) has `services`, `chains`, `hops`,
  … resources but **no `/config/nodes` resource**; a node lives inside
  `chains[].hops[].nodes[]` or `services[].forwarder.nodes[]`.
- Config state is an external store (`useServerConfig` via `getUseValue`);
  refresh is driven by `configEvent.emit("apiUpdate")`.
- No jsdom / @testing-library in this repo. Tests are pure helpers plus
  source-contract assertions, consistent with the existing topology tests.

## Approaches considered

| Approach | Tradeoff |
|---|---|
| A — toggle only enables drag + disconnect | Small and safe, but cannot create connections; contradicts "连线可以修改". |
| **B — layered whitelist (chosen)** | Matches cuttle: allowed cross-layer directions only, config-backed connect/disconnect, side panel for reference fields, snapshots paused while editing. Enough to grow toward topology-first without a full editor. |
| C — full topology CRUD editor | Final form, but large (hundreds of lines of forms) and blocked by the missing `/config/nodes` endpoint; too risky in one change. |

## Decided behaviour

### Mode

- `Overview` holds `const [editing, setEditing] = useState(false)`.
- Toolbar: one `Button` with `EditOutlined`, label `编辑`/`退出编辑`,
  `aria-pressed={editing}`. In edit mode show an orange `Tag`
  "编辑模式 · 统计已暂停" and hide the animation switch (cuttle does the same).
- Entering edit mode freezes the graph snapshot: keep polling for status and
  notifications, but pass the snapshot captured at entry to `Topology` so live
  counters do not rebuild/drag-churn the graph. Config changes still rebuild it.
- Exiting edit mode resumes the live snapshot immediately.

### Dragging

- `Topology` owns node positions in state, seeded from `loadPositions(infoAddr)`;
  `onNodesChange` applies `position` changes so nodes follow the cursor.
- `onNodeDragStop` writes positions to localStorage, as today.
- `nodesDraggable={editing}`; monitor mode keeps nodes fixed. `deleteKeyCode={null}`.

### Editable connections and config mapping

A pure module `graph/links.ts` owns the whitelist and inverse operations:

| Source → Target | Config mutation | Resource API |
|---|---|---|
| `service` → `chain` | append chain name to `service.handler.chain` (stage selectable in panel: handler/listener) | `services.put(name, service)` |
| `chain` → `hop` | append `{name}` to `chains[chainName].hops` | `chains.put(name, chain)` |
| `hop` → `node` | append a node config to `hops[hopName].nodes`; panel collects `name`, `addr`, `connector`, `dialer` | `hops.put(name, hop)` |
| `service` → `forwarder` | set `service.forwarder.hop = hopName` (guard: `forwarder.nodes` must be empty) | `services.put(name, service)` |

Guards: reject unknown kinds, unsupported directions, self-links, duplicates
(no-op), and conflicting forwarder shapes. `connect`/`disconnect` are the inverse
of the same mapping so an edge created in the UI can be removed again.

Every mutation is awaited (no optimistic config update), followed by
`configEvent.emit("apiUpdate")`, then `useServerConfig.set(await getConfig())`.
Errors surface via `message.error`; success via `message.success("已保存"/"已断开")`.

### Panel

- Edit mode reuses the right-side drawer: selecting a node/edge opens
  `EditPanel` with the reference fields for the four link types and a
  `断开` button. Selecting a read-only edge shows an "edit in Config" hint.
- The existing monitor `Detail` panel stays unchanged.

### Graph cleanup

- `build.ts`: stop calling `ensureTarget("target")` for chain and forwarder
  paths and stop emitting their `exit` edges — the last `node` card is the
  terminal. Keep `ensureTarget("target:direct")` and its `direct` edge only for
  services with neither a chain nor a forwarder. Per the user clarification,
  `target`/`exit` is retained **only** for that direct path.
- Remove the reset button from `Overview`, plus `resetKey`, `reset.ts` and
  `reset.test.ts`. Position persistence remains at drag-stop.

## Verification

- New pure tests for `graph/links.ts` (each allowed direction, duplicates,
  disconnects, guards) watched red then green.
- `build.test.ts` updated for the new target/exit shape.
- Source-contract tests for edit toggle, mode gating, and reset removal.
- Full `npm test` and `npm run build` must pass.
- UI interaction verified only by TypeScript/Vitest/source checks (no browser
  regression suite in this repo).

## Deferred

- Full node/service/chain CRUD in the topology, and a `/config/nodes` API in gost.
- P95/token/attempt stats and per-route health — require new x/dashboard APIs.
