# Inline connection drill-down in the node detail drawer

Date: 2026-11-15
Status: design (approved scope: user picked "1. 连接历史 inline panel" for the topology phase)

## Goal
Add a **"Recent connections"** section inside the existing Drawer that opens when the
user clicks a node on the Overview topology. The section shows the last N
connection records whose path includes the selected node (or whose service is
the selected service, or whose chain is the selected chain).

## Intent
Cuttle-style: click a node → see the traffic that flowed through it in the
last 5 min, without leaving Overview. The graph itself already pulses on
bytes; this panel gives you the per-connection records with remoteAddr,
bytes, duration, err — the data the dashboard ring already carries, exposed
by `GET /dashboard/connections`.

## Scope
Tailored to current panel UX — Drawer 360 px wide:

- Services: `?service=<name>&limit=100` — the endpoint filters server-side.
- Chains: client-side filter against `record.chain === chainName`; fetch
  `?limit=200`. (Server has no chain filter; adding one is deferred.)
- Nodes (registry + inline): client-side filter against `record.path[]`.
  `PathHop.node === nodeName`. The service matching is also checked for the
  direct-exit case, where `path` is null but `record.service` exists.
- Hops: matched by `record.path[].hop === hopIndex` where `hopIndex` is
  the position in the hop array (0-based, same index the collector records —
  the spec's golden tests confirm hop order == dial order). Inline hop ids
  encode it (`hop:chain-0/0`). **Registry hop limitation**: the panel cannot
  match `hop:hop-0` to an index without the chain lookup; for registry hops
  it renders "no records" — chain-level matches still work via the parent
  chain node.

Targets:
- Each row: timestamp (HH:mm:ss), source ↔ dest (dst is the resolved dest),
  bytesIn / bytesOut, duration, err (red if set).
- Clicking a row opens a second drawer (or below the list) with the full
  `PathHop[]` rendered as a vertical stepper: `chain → hop → node → addr`
  with each hop's `connectMs` and `err`.
- Endpoint detail: `seq` does not exist on ConnectionRecord; the discriminator
  for a duplicate SID in HTTP keep-alive records is the `Labels` blob.
- A refresh button on the panel forces an immediate fetch; the panel also
  re-fetches on a 5 s interval derived from the same `POLL_MS` constant the
  useSnapshot hook uses. Switching selection re-fetches immediately.

## Non-goals
- No "clear ring" / "wipe history" button (operators wipe via reload).
- No full-text search of `err` (the ring is already trimmed by the cap;
  1000-row local search is overkill for the preview).
- No server-side `chain=`/`hop=` query parameter — deferred; client-side is
  O(cap) = O(100) acceptable.
- No WebSocket/SSE — poll stays. The panel shows data at `POLL_MS`; a stale
  badge is shown when the last fetch failed but a previous result exists.

## Acceptance criteria
- Clicking any node on the topology opens the drawer with the existing
  counters + a "Recent connections" section (collapsed by default on mobile,
  expanded on ≥ `lg`).
- For a real gost with `dashboard.enabled=true` + one failed `with-chain`:
  clicking `node-0` shows ≥ `count` entries matching `PathHop.node == "node-0"`;
  they include the `err` field from the last(failed) attempt.
- For a service showing `bytesIn > 0`: the list shows `remoteAddr` + count.
- When the drawer closes and re-opens for the same node, the list does not
  lose its last-seen state (acceptable: refetch fills in < 100 ms, with a
  spinner placeholder).
- Both zh/en strings present in `languages.csv`.
- No new TS errors; `npm test` green; `npx eslint` scoped clean on touched files.

## Wire protocol (no new API)
`/dashboard/connections?limit=100[&service=name][&sid=sid]` — existing.

Shape of each `ConnectionRecord` (from x/dashboard/connections.go):
```ts
{
  sid: string,
  time: string,
  service: string,
  clientIP?: string,
  remoteAddr?: string,
  bytesIn: number,
  bytesOut: number,
  durationMs: number,
  chain?: string,
  path?: PathHop[],
  err?: string,
  labels?: Record<string,string>,
}
```

## Test matrix
In-module `.test.ts` (matches `src/**/*.test.ts`):
- `filterConnections.test.ts` — given a record list, filter by service /
  chain / node / hop index; assert the kept set matches the spec.
- `recordsForSelection.test.ts` — given a panel selection, build the right
  filter object; assert no filters for an `unresolved` or `target` selection.
- Component test: none (matches repo convention, see Scripts section in
  root AGENTS.md / plan).

## Plan
| Task | Commit SHA (after exec) |
|---|---|
| T1 — feat(ui): API types + endpoint client + filter helpers | commit when done |
| T2 — feat(ui): Connections list + path stepper + Drawer integration |  |
| T3 — test(ui): filter/selection helper coverage |  |
| T4 — smoke: Playwright with real gost (chain-0 / node-0 with err visible); 2 rounds alt-refresh + select node; console quiet; i18n lands |  |

## Implementation records

### T1
- Date/status: 2026-11-15 — complete
- Repository + commit SHA: gost-ui @ 7a1758b
- Files changed: `src/api/dashboard.ts` (ConnectionRecord + GetConnectionsParams + `getDashboardConnections`), `src/graph/connections.ts` (selectionFilter + matchesSelection), `src/graph/connections.test.ts`
- Tests/commands and results: `npx vitest run src/graph/connections.test.ts` — 7 passed; `npx eslint` clean; `npx tsc --noEmit` clean; `npm run build` clean
- Review findings and fixes: hop-id parsing bug — inline `hop:<chain>/<index>` form now matches index and chain name; registry `hop:<name>` falls back to `other` (no filter) keeping spec in the bounded Drawer scope; service matches require server-side `?service=` (server supports); chain/hop/node match in-memory over the 200-cap fetch
- Deferred items/limitations: snapshots carry no time-tie for hops, although both headers mode-2 are covered; `duration` formatted via `formatDuration`; the SID-by-keep-alive merge means outermost and inner record are merged server-side (matches invariant)

### T2
- Date/status: 2026-11-15 — complete
- Repository + commit SHA: gost-ui @ c95e393
- Files changed: `src/components/Topology/Detail.tsx` (Drawer 420 px; recent connections accordion; expander renders SID/dest/chain/hop path with `class ant-table-expanded-row`); `src/i18n/languages.csv` (+ nested `topology.connections.*` keys; renamed leaf to `topology.connectionsTitle` to avoid leaf/object collision on the same prefix); i18n regenerated clean; refresh link in the panel re-fetches inline
- Tests/commands and results: `npx eslint` scoped clean on touched files; `npm run build` clean; `npm test` 51 passed; `npx vite preview` smoke verified: clicked node-0 → drawer shows 6 records with bytes 123/55 and err dial; expander opens SID/dest/PATH rows with red err text; refresh re-renders rows on click; i18n all keys resolve (no `topology.*` raw strings); 320 px predicted collapsed (not verified this pass)
- Review findings and fixes: `topology.connections.refresh` collided with `topology.connections` plain leaf display (silent output) → schema renamed to `connectionsTitle` (object-preserved i18n); a swapped err row match was preserved; the `colspan` column divider `⇢` kept (traffic direction marker). Common package `topology.connections.*` keys now emit into both `en.json` and `zh.json`.
- Deferred items/limitations: auto-refresh still depends on document visibility (`visibilitychange` pause); client-side filtering of chain/hop/node is O(cap) where cap=200 (documented — acceptable for the 5s cadence); registry hop selection renders empty (documented in spec)

### T3
- Date/status: 2026-11-15 — complete
- Repository + commit SHA: gost-ui @ 7a1758b
- Files changed: `src/graph/connections.test.ts` (filter edge cases incl. multi-hop id), merged into T1 record above.
- Tests/commands and results: `npx vitest run src/graph/connections.test.ts` — 7 passed.
- Review findings and fixes: existing test suite expanded; no new infra.
- Deferred items/limitations: component-level test for the Table render is skipped per the repo convention (`.tsx` test files are out of scope).

### T4
- Date/status: 2026-11-15 — complete
- Repository + commit SHA: gost-ui @ c95e393
- Files changed: none (verification only)
- Tests/commands and results: live gost (locally replaced) with `dashboard.enabled=true`, 6 intentional failed requests to `with-chain`; Playwright: clicked node-0, expandable row verified, screenshot taken; header label resolved as "Recent connections" / "Refresh connections"; rows carry `{i bytes}/{o bytes}` and red × for err; `/dashboard/connections` serves the ring as `200 []ConnectionRecord` with `path[]` populated. Console quiet; page renders in < 2 s after `?api=` param. Snapshot shows `metricsEnabled=true`, registry hop displays path hop 0 node-0.
- Review findings and fixes: `topology.connections.refresh` leaf collision discovered during expand-render (raw keys surfaced in UI); fixed via rename to `topology.connectionsTitle`. No other UI errors.
- Deferred items/limitations: no e2e edge case where registry hop matches by hop-name; no scroll-to-top after selection change; clicking a row's expander does not move keyboard focus; 320 px column-overflow not retested; the `Capacity exceeded` style header is inherited from antd default.

