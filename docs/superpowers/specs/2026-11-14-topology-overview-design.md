# gost-ui Topology Overview — Design

Date: 2026-11-14
Status: draft — supersedes the table-first Overview in
`2026-11-14-dashboard-design.md` (the shell, nav, polling and API client from
that design stay).

## Intent

Turn the Overview page into a **live topology graph** modelled on cuttle's
topology, but drawn from GOST's real pipeline instead of cuttle's
entrypoint → route → node → provider chain:

```
service (listener + handler)
  ├── admission / auther        (who may connect)
  ├── bypass / resolver / hosts (how the destination is resolved and routed)
  ├── limiter / climiter / rlimiter / quota (whether traffic is allowed)
  └── chain → hop → node → target (where the traffic goes)
```

Modules are first-class nodes on the canvas, not a side list. Every later
change to this page aims at the graph: the tables become drill-downs behind it,
not the primary view.

## Why now

Phases 0–4 instrumented exactly the data a graph needs: per-service live
counters, per-module call/hit/miss/error/latency and limiter aggregates, chain
and per-node connect stats, a 1 h history ring, and a bounded event log — all
exposed by `GET /dashboard/snapshot`. Until now that data was only rendered as
tables.

## Goals

- One canvas showing every service, the modules it is wired to, its chain,
  hops and nodes, and a terminal "target" node.
- A shared module referenced by several services is drawn **once**, with one
  edge per referencing service (cuttle draws shared providers the same way).
- Live: the graph updates on the existing 5 s poll; service-level edges pulse
  with new bytes; nodes carry health colour and counters.
- Selection: click a node or edge → drawer with its config and live numbers.
- Drag to arrange, zoom/pan, saved positions per API address.
- Mobile: graph is pan/zoom only (no drag), the drawer becomes a bottom sheet;
  tables stay reachable in a collapsible section.
- Keep the existing summary cards, history sparklines, and tables, below the
  canvas and collapsible, so nothing regresses.

## Non-Goals

- Backend changes. The graph is built entirely from `GET /config` and
  `GET /dashboard/snapshot`.
- Per-hop traffic counters (GOST counts bytes only at the service connection).
- cuttle's per-binding probe model (eligible/active/fallback); GOST nodes have
  `probe` config but no probe-result API.
- Editing the config from the graph (that stays in the Config page).
- WebSocket/SSE; polling stays.

## Anti-Goals

- A second source of truth: the graph must be derived, never a hand-maintained
  duplicate of the config.
- Layout that drifts on every poll: positions are stable, new nodes are placed
  in free slots (cuttle's `placeNewNodes` approach).
- Colour-only signalling of failure (needs a badge/tooltip too, for
  accessibility and for colour-blind users).
- Re-fetching `/config` on every poll; it changes only on reload.

## Data available

From `GET /config` (already loaded by gost-ui into `useServerConfig`):

| Entity | Fields that wire the graph |
|---|---|
| `services[]` | `name`, `addr`, `handler{type, chain, chainGroup, auther(s), limiter, retries}`, `listener{type, auther(s), chain, chainGroup}`, `admission(s)`, `bypass(es)`, `resolver`, `hosts`, `limiter`, `climiter`, `rlimiter`, `quotas[]`, `forwarder{hop, nodes[]}` |
| `chains[]` | `name`, `hops[]` (each hop: registry reference by `name`, or inline with `nodes[]`) |
| `hops[]` | top-level hop definitions, referenced by name |
| `nodes[]` | top-level node definitions, referenced by name |
| `bypasses/authers/admissions/hosts/resolvers/limiters/climiters/rlimiters/quotas[]` | `name` (+ config detail for the drawer) |

From `GET /dashboard/snapshot`:

| Data | Use in the graph |
|---|---|
| `services[name]` | service node: state, total/current conns, in/out rate, errors |
| `modules[]` (`kind`, `name`, `service`, `stats`) | module node counters; `service` scopes a series to the services that use it |
| `chains[name]` | chain node connects/errors/avg latency; `nodes[]` per node name |
| `history[]` | pulse trigger (byte deltas) + the existing sparklines |

Known gaps, accepted and shown as `—`:

- `ChainSnapshot.Hops` is never populated; hop nodes show no counters.
- Chain/node stats come from Prometheus, so they are empty unless
  `metrics.addr` is configured (`snapshot.metricsEnabled`). The graph shows a
  hint in that case.
- Chain/node labels are node **names** from metric labels; two hops declaring
  the same node name collapse into one series (pre-existing backend
  limitation, not introduced here).

### What the read model actually contains (verified during builder check)

These were checked in `x/dashboard` and `x/config/parsing` and change the
implementation, so they are settled here rather than left to the builder:

| Claim | Reality | Consequence |
|---|---|---|
| Module counters are per referring service | `bypass`/`auther`/`admission` are service-scoped; `hosts` and `resolver` are registered with `set.get("")`; the three limiter kinds are global per **name** (`sampleLimiter` on `set.get("")`) | Module counters are read as "the series for this name"; do not multiply or split them per referencing service. A shared module legitimately shows one global number. |
| `quota` has dashboard counters | No `quota` series exists at all. Quota state is only in `GET /config` → `services[].status.quotas[]` (`used`, `limit`, `blocked`, `expired`, `direction`) | Quota nodes are **status cards fed from the config**, not snapshot counters. See "Quota nodes" below. |
| `service.limiter` = `limiter_traffic` | Correct: `cfg.Limiter` wraps the listener via `TrafficLimiterRegistry`, `cfg.Handler.Limiter` wraps the handler, `cfg.CLimiter`→`limiter_conn`, `cfg.RLimiter`→`limiter_rate` | The graph maps each config field to its snapshot kind; two limiter fields may share one name and therefore one node with two labelled edges. |
| `connects` and `errors` are complementary | `connects` comes from the connect-duration histogram, observed **only on success**; `errors` increments on failed attempts. They are disjoint counts, never a total | Every health ratio uses `errors / (connects + errors)` — see "Node health". |
| `history[]` can drive a per-edge pulse | `historySamples` collapses all services into one aggregate series | Pulse comes from diffing `snapshot.services[name].stats` between two polls. `historySamples` stays as it is, for the sparklines only. |
| A hop can be shared by chains | Inline hop → `hop:<chain>/<hop>`; registry hop (name only) → `hop:<name>` | Node ids follow the hop's own identity: registry hop nodes are `node:<hop>/<node>`, inline hop nodes are `node:<chain>/<hop>/<node>`. |


## Approaches considered

| Approach | Trade-off | Verdict |
|---|---|---|
| **A. Shared entity graph** — each named entity drawn once, multiple edges for multiple referrers | Shows sharing (a bypass used by 5 services is visibly a single point); the canvas stays proportional to the config, not to services × modules. Can look busy when a service has many modules; selection highlight is what makes one path readable. | **Chosen** |
| B. Per-service lanes — one row per service, its modules repeated | Each path is trivial to read; sharing is invisible, the canvas grows with services × modules, and it fights the "see the whole structure" goal. | Rejected |
| C. Skeleton + module badges on the service card | Cleanest canvas; modules are not entities in the graph, which the user explicitly asked for. | Rejected |

## Design

### Graph model

`src/graph/build.ts` — pure function, no React:

```ts
buildGraph(
  cfg: Config,
  snapshot: Snapshot | null,
  prev?: PositionMap,
): { nodes: GraphNode[]; edges: GraphEdge[] }
```

Node kinds and their column (left → right):

| Column | Kind | Rendered card |
|---|---|---|
| 0 | `service` | name, `handlerType+listenerType`, `addr`, state badge, conns, rate |
| 1 | `module` (`admission`, `auther`, `bypass`, `resolver`, `hosts`, `limiter`, `climiter`, `rlimiter`, `quota`) | kind label, name, calls/hits/misses or limiter allowed/denied |
| 2 | `chain` | name, hop count, connects, errors, avg connect |
| 3 | `hop` | name (inline hops get `chain/hop` identity), node count |
| 4 | `node` | name, `connector/dialer`, `addr`, connects, errors, avg connect |
| 5 | `target` | a single shared sink labelled `target` (+ `direct` variant when a service bypasses chains) |

Stable ids (`node.id`), so edges and saved positions survive a rename of
display labels:

- `service:<name>`
- `module:<kind>:<name>` — `kind` is the snapshot kind (`bypass`, `auther`,
  `admission`, `hosts`, `resolver`, `limiter_conn`, `limiter_rate`,
  `limiter_traffic`, `quota`)
- `chain:<name>`
- `hop:<name>` for a registry hop, `hop:<chain>/<hop>` for an inline hop
- `node:<hop>/<node>` for a registry hop's node,
  `node:<chain>/<hop>/<node>` for an inline hop's node
- `fwd:<service>/<index>` — forwarder nodes have no name in the config and are
  positional; the index is their position in `forwarder.nodes`
- `target`, `target:direct`

Ids are derived from config identities only. Display labels never enter an id,
so renaming a module in the UI's language does not reset positions.

Edges:

| Edge | Source → target | Style |
|---|---|---|
| `attach` | service → module | thin dashed, neutral; label = the module's live numbers when non-zero |
| `chain` | service → chain | solid, coloured per chain; label = `listener` / `handler` when the same chain is declared at both stages, and the stage when the two stages declare different chains |
| `direct` | service → `target:direct` | solid, neutral, dashed; only when the service has no chain at either stage and no forwarder |
| `hop` | chain → hop | solid, same chain colour |
| `node` | hop → node | solid, same chain colour |
| `exit` | node → target | solid, neutral |
| `forward` | service → forwarder node, or `forwarder.hop` → forwarder node | solid, amber |

**Chain precedence.** `listener.chain` and `handler.chain` are genuinely two
routers; both are drawn when both are declared, each edge carrying its stage.
`chainGroup.chains[]` expands to one edge per entry, deduplicated by chain id
per stage. A service whose `metadata.ignoreChain` is true draws no chain edge
at all (it dials directly) — that flag is visible in `service.metadata`.

**Forwarder.** `forwarder.nodes[]` are their own entities: they are neither
registry `nodes[]` nor hop children, they carry no connect counters, and they
are addressed only by position, hence `fwd:<service>/<index>`. They live in a
column right of the service (same column as modules, above the chain column)
and get a `forward` edge from the service. When `forwarder.hop` names a hop,
the hop's nodes are reused: the edge comes from that hop card instead of from
the service, so a shared forward hop is still drawn once. A service with a
forwarder does **not** also get a `direct` edge.

Module edges come from these fields, each mapping to one snapshot kind:

| Config field | Module kind | Stage label |
|---|---|---|
| `admissions[]`/`admission` | `admission` | — |
| `bypasses[]`/`bypass` | `bypass` | — |
| `resolver` | `resolver` | — |
| `hosts` | `hosts` | — |
| `limiter` | `limiter_traffic` | `listener` |
| `handler.limiter` | `limiter_traffic` | `handler` |
| `climiter` | `limiter_conn` | — |
| `rlimiter` | `limiter_rate` | — |
| `quotas[]` | `quota` | — |
| `listener.auther(s)` | `auther` | `listener` |
| `handler.auther(s)` | `auther` | `handler` |

The same name at two stages yields **one node with two labelled edges** (an
auther listed on both listener and handler is the common case). Edges are keyed
`<service>:<kind>:<name>:<stage>` so the two survive dedup and can carry
different labels.

### Module and chain node contents

- `bypass` / `auther` / `admission`: calls, hits, misses, errors, avg latency —
  service-scoped series, so the card shows the numbers of the series belonging
  to the service on the edge when there is exactly one referrer; a shared
  module shows the sum of its series and the drawer breaks it down per service.
- `hosts` / `resolver`: the same shape from their (global) series, plus cache
  hit/miss/store for resolvers.
- `limiter_conn` / `limiter_rate` / `limiter_traffic`: allowed, denied from the
  limiter aggregate; `requested`/`granted` for the rate limiter.
- `chain`: connects, errors, avg connect (Prometheus; `—` without metrics).
- `hop`: no counters exist (`ChainSnapshot.Hops` is never populated) → shows
  its node count only, and never carries a health badge.
- `node`: connects, errors, avg connect from the chain snapshot's node row.

### Quota nodes

Quota has no dashboard series, so a quota card is fed from the config itself:
`services[].status.quotas[]` (`used`, `limit`, `blocked`, `expired`,
`direction`) — which is already refreshed on every `/config` read and on every
client-side config edit, so it needs no extra polling. The card shows
`used/limit` and a blocked badge; the health mapping is `blocked → dead`,
`expired → warn`, otherwise `healthy` when `used > 0`, else `idle`. When the
same quota name is listed by several services, the card shows the first
service's status and the drawer lists every referencing service with its own
`used/limit` (the counter is shared, so the numbers normally agree).

### Node health

Reuse cuttle's vocabulary, but with denominators that are actually totals.
`connects` counts **successful** dials only and `errors` counts failed ones, so
every ratio is `errors / (errors + successes)`:

| Mood | Condition | Badge |
|---|---|---|
| `dead` | service/listener state `failed` or `closed`; quota `blocked`; node with `errors > 0 && connects === 0`; node whose error ratio ≥ 50 % | ✕ |
| `error` | ratio > 5 % | ▲ |
| `warn` | ratio ≥ 1 % | ! |
| `healthy` | ratio < 1 %, with traffic | none (green border) |
| `idle` | no traffic yet (no counters, or both denominators zero) | none (neutral border) |

Service and module ratios use the same shape: service
`totalErrs / (totalErrs + totalConns)`, module `errors / (errors + calls)`,
node `errors / (errors + connects)`. `hop` never gets a badge. Colour is never
the only signal: the badge is a glyph with a tooltip carrying the
numerator/denominator.

### Live animation

- The pulse source is a diff of `snapshot.services[name].stats` between two
  consecutive polls (`inputBytes + outputBytes`, plus `currentConns` for
  liveness). `historySamples` is aggregate-only and stays with the sparklines.
- `service`, `chain`, `hop` and `node` edges pulse when the bound service's
  byte total increases; the whole path of that service lights up, which is
  what makes one service's route readable inside the shared graph.
- `attach` edges pulse on the referenced series' `calls` increase.
- Chains and nodes are shared, so a chain on two services' paths pulses when
  either increases.
- Pulse = three light dots travelling the edge once (cuttle's `DotEdge`), no
  SMIL, no loop.
- Nodes with no counter never pulse, so an idle tunnel looks idle.
- `diffActivity` semantics are copied from cuttle: the first snapshot never
  animates, and a counter going backwards (process restart) resets the
  baseline instead of producing a burst.

### Layout and positions

- `dagre` left-to-right, node sizes per kind (cuttle's `sizes` table adapted),
  24 px gap.
- New nodes are placed with cuttle's `placeNewNodes`: a saved layout wins; a
  node not in it takes dagre's slot and walks down/right until it does not
  overlap.
- Positions persist in `localStorage` under
  `gost-ui:topology:<api addr>`; a "reset layout" action clears that key.
  (cuttle persists on the server; gost-ui is a static SPA with no place to put
  that, so this is a deliberate downgrade.)

### Page composition

`src/Pages/Overview.tsx` becomes:

1. Toolbar: refresh, updated-at, chain/metrics hints, `reset layout`,
   `collapse tables`.
2. `<TopologyGraph>` filling the remaining height (`min-height: 60vh`).
3. Detail drawer (right on desktop, bottom sheet < `md`) for the selected node
   or edge: config fields from `/config` + live numbers from the snapshot.
4. Collapsible "details" area holding the existing Summary cards, History
   sparklines, and the Services / Modules / Chains / Events tables (unchanged,
   moved).

States (`loading`/`live`/`stale`/`disabled`/`unauthorized`) stay as they are;
`stale` keeps the last graph and shows the alert above it.

### Dependencies

`@xyflow/react` ^12 and `dagre` ^0.8 (+ `@types/dagre`) — the same stack cuttle
uses, compatible with React 18 / Vite 4. They are added to `dependencies`, and
the existing manual-chunk split keeps them out of the login bundle.

Verified by a throwaway probe build: `@xyflow/react` 12 + `dagre` 0.8 install and
build cleanly under this repo's Vite 4.4.5 / React 18 / TS 5 setup (423 kB raw,
139 kB gzip for the probe, which includes the whole React Flow runtime).
`@xyflow/react` needs its stylesheet imported once
(`@xyflow/react/dist/style.css`).

This supersedes the earlier "no new runtime dependency" note in the previous
design; the graph is not practical to hand-roll, and cuttle's implementation is
the reference the user asked to match.

### Tests

Pure-logic tests, no DOM:

- `build.test.ts` — service/module/chain/hop/node wiring, shared modules
  produce one node with N attach edges, `chainGroup` expansion, unresolvable
  references become `unresolved`, `forwarder` edges (inline and via
  `forwarder.hop`), the same auther at listener+handler yields one node and two
  labelled edges, `ignoreChain` suppresses chain edges, shared-hop node ids stay
  chain-independent.
- `health.test.ts` — mood mapping and badge thresholds, including the
  `errors / (errors + successes)` denominators and the quota moods.
- `layout.test.ts` — stable positions for a saved map, new node walks to a free
  slot.
- `activity.test.ts` — pulse only on increase, first snapshot silent, counter
  reset silent, chain/node pulse when any bound service ticks.

Component/visual checks stay manual (Playwright smoke, as in the previous
phase).

### Rollout

One page, one PR-sized change set on `gost-ui` master; no `x`/`gost` changes.
`master` push deploys gh-pages, so the push happens only on explicit approval.

## Calls made during the builder check

A fresh reviewer read the design against the code and raised six gaps. Five were
settleable here (they are technical, and a wrong guess would have shown up as
silently-empty cards); they are already folded into the sections above:

1. **Quota has no dashboard series** → quota nodes are status cards fed from
   `services[].status.quotas[]` in `/config`, not snapshot counters.
2. **`connects` counts successes only** → all health ratios use
   `errors / (errors + successes)`, and the node `dead` rule is
   `errors > 0 && connects === 0` or ratio ≥ 50 %.
3. **Forwarder nodes had no identity** → `fwd:<service>/<index>`, no counters,
   and `forwarder.hop` reuses the hop card instead of duplicating it.
4. **`historySamples` cannot drive a per-edge pulse** (it aggregates all
   services) → pulses come from diffing `services[name].stats` between polls;
   `historySamples` stays with the sparklines.
5. **Shared hops and node ids** → registry hops own their nodes
   (`node:<hop>/<node>`), so a hop shared by two chains is drawn once with one
   set of children.

The sixth needed a real choice and became the `target` question below.

## Open questions

- Should the `target` sink be one shared node or one per service? One shared
  node keeps the canvas small but turns every exit edge into a converging fan;
  per-service targets are clearer but multiply by service count. Proposal:
  **one shared** `target`, with the service name on the exit edge label.
- Should events be drawn on the graph (a flash on the entity named in a new
  event) instead of only in the table? Proposal: **yes, later** — first
  iteration keeps events in the table below, since the flash needs its own
  dedup rules.

## Handoff

- Phase 6 (this): graph, health, pulse, drawer, positions, tables moved below.
- Phase 7 candidates: event flashes on nodes, per-hop instrumentation in `x`
  (so hop counters are real), graph-embedded editing, probe-result API.
