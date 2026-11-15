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
- Hops: same shape; matched by `record.path[].hop === hopIndex` where
  `hopIndex` is the position in the hop array (0-based, same index the
  collector records — the spec's golden tests confirm hop order == dial order).

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
Fill per task after completion.

### T1
### T2
### T3
### T4
