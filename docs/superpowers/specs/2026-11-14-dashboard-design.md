# gost-ui Dashboard Design (GOST Dashboard Phase 5)

Date: 2026-11-14
Status: draft — supersedes `x/docs/superpowers/specs/2026-11-14-gost-dashboard-ui-design.md`

## Intent

`gost` (Phases 0–4) exposes `GET /dashboard/snapshot`, but nothing renders it.
Add a read-only monitoring view to **gost-ui**, the existing config frontend, so
operators who already use `ui.gost.run` (or a self-hosted copy) get a dashboard
next to the config they manage.

gost itself is not changed: no embedded assets, no new API surface, no new config.

## Goals

- A **Monitor** view in gost-ui showing services, chains, modules, events, and a
  short history, fed by `GET /dashboard/snapshot` on the already-connected API.
- Reuse the existing connection (`getInfo().addr` + basic auth), theme, and i18n.
- Poll on an interval, pause while the tab is hidden, never spam toasts.
- Clear states for disabled (404), unauthorized (401), stale, and empty.
- No new runtime dependencies; sparklines are inline SVG.
- Work identically for `ui.gost.run` (cross-origin) and self-hosted gost-ui.

## Non-Goals

- Embedding the UI in the `gost` binary; that option is dropped.
- Config editing changes, or any edit action inside the monitor view.
- WebSocket/SSE streaming (polling only), persistence, multi-instance aggregation.
- Chart libraries, topology graphs, saved layouts.
- Backend changes in `x` or `gost`; the snapshot contract is already stable.

## Anti-Goals

- Changing the Home "connect to API" flow, the login/session model, or monaco.
- Adding a second axios instance with different auth semantics.
- Per-poll `message.error`/`message.success` notifications.
- Hand-rolled colors that break dark mode.

## Compatibility findings

The earlier plan (serve a UI from the gost binary) was dropped after reviewing
gost-ui. Its design fits a hosted SPA but not a binary-embedded one:

| gost-ui fact | Consequence for embedding |
|---|---|
| `index.html` loads monaco from `%VITE_MONACO_URL%`; `.env.production` points at unpkg | Binary would fetch from the public internet; offline/intranet breaks |
| `userInit` requires an API address (`?api=`, form, or `?use=`) stored in sessionStorage | Same-origin mount would still show the connect page |
| `require` response interceptor toasts every failure | A 5 s poll would toast on every outage |
| antd is a manual chunk, plus i18n bundles | Several hundred KB, far above a purpose-built dashboard |
| Separate repo and release cycle | gost releases would depend on gost-ui artifacts |

In this design all of that is a non-issue: the user connects as today, monaco is
untouched, and the dashboard is just another component in the existing bundle.

## Design

### Navigation

- `Pages/Manage.tsx` gains a `Segmented` control in the header: **Config**
  (default) and **Monitor**. Labels via i18n (`dashboard.nav.config`,
  `dashboard.nav.monitor`).
- `view` is component state; the dashboard renders full width inside
  `Layout.Content`.
- Header keeps addr, theme, language, logout. Reload/save/download/settings
  actions are shown only in the config view; the monitor view shows its own
  refresh button, a live/stale indicator, and "updated at".

Rationale: monitoring needs full-width tables and is a different mode from
editing a config grid; a card in the grid would be cramped and would re-render
on config edits.

### Data layer

`src/api/dashboard.ts`:

- TypeScript types mirroring `x/dashboard/snapshot.go` exactly (`Snapshot`,
  `ServiceSnapshot`, `ModuleSnapshot`, `ChainSnapshot`, `EventRecord`,
  `HistoryPoint`, `LimiterStats`, …).
- `getDashboardSnapshot(signal?): Promise<Snapshot>` using the shared `require`
  instance with `{ noMsg: true }`. The endpoint returns the snapshot object
  directly (not the `Response{data}` envelope), so no unwrapping is needed.
- Path prefix comes for free: `require` sets `baseURL` from `getInfo().addr`,
  which already includes a configured `pathPrefix`.

`src/components/Dashboard/useSnapshot.ts`:

- Immediate fetch, then every 5 s (matches the collector's history interval).
- `document.visibilitychange` pauses the timer; becoming visible fetches
  immediately and restarts.
- One `AbortController` per request; aborted requests are ignored.
- Reducer-backed state: `phase` = `loading | live | stale | disabled |
  unauthorized`, `snapshot` (last good value retained), `updatedAt`, `error`.
- Status mapping: 404 → `disabled`, 401 → `unauthorized`, other errors → `stale`
  while keeping the previous snapshot.
- 401 renders a "reconnect" action that calls the existing `logout()`.

`src/components/Dashboard/history.ts`:

- `deriveHistory(history)` sums `currentConns` and diffs `inputBytes`/
  `outputBytes` across services per sample → `{ t, inBps, outBps, conns }`.
- Skips non-positive `dt`, drops the first sample, downsamples to ≤ 120 points.

`src/components/Dashboard/format.ts`: bytes, Bps, duration, percent, clock time.

### Views

`src/components/Dashboard/index.tsx` composes:

- **Summary** — uptime (`now − startedAt`), service count, total current conns,
  total in/out Bps, `metricsEnabled` badge, sample interval.
- **Services** — antd `Table`: name, state, total/current conns, in/out bytes and
  Bps, errors, error rate. `service.rate` is used directly; no client-side diffing.
- **Chains** — one `Card` per chain with per-chain stats and a node table:
  hop, node, state, connects, errors, avg connect ms
  (`connectDurationSumMicros / connectCount`).
- **Modules** — antd `Table` grouped by `kind` (`bypass`, `admission`, `hosts`,
  `resolver`, `auther`, `limiter_conn`, `limiter_rate`, `limiter_traffic`):
  calls, hits, misses, errors, avg latency, cache hit/miss/store; expandable rows
  for limiter counters (calls/allowed/denied/waitCalls/requested/granted).
- **Events** — newest-first table: time, level (colored `Tag`), kind, name,
  service, message.
- **History** — three inline `Sparkline` SVGs (in Bps, out Bps, current conns)
  from `deriveHistory`.

Empty services/chains/modules/events render an empty-state hint, not a blank box.

### i18n

- Add `dashboard.*` keys to `src/i18n/languages.csv` (zh + en).
- `src/i18n/*.json` is generated and gitignored; `prebuild` already runs
  `npm run init:i18n`.

### Styling

- antd components and `theme.useToken()` only; reuse `ProCard`/card conventions
  from `ListCard` so light/dark mode work without custom colors.
- Tables use `size="small"`, stable row keys, and `scroll={{ x: ... }}` for narrow
  screens.

### Tests

- Add `vitest@^0.34` (the line that supports Vite 4) as a dev dependency;
  `npm test` = `vitest run`. No DOM testing library. Tests cover pure logic only:
  - `format.ts` — byte/Bps/duration/percent boundaries.
  - `history.ts` — rate derivation, dt guards, downsampling.
  - status mapping — 404/401/network → `phase`.
- Gates: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- `.github/workflows/autoDeployPages.yml`: insert `npm test` before `npm run build`
  so master cannot deploy a red dashboard.
- Manual: connect to a gost with `dashboard.enabled: true`, toggle views, kill the
  API to see `stale`, disable the dashboard to see `disabled`, add an auther to
  see `unauthorized`.

### Performance

- 5 s poll, hidden-tab pause, abort in flight on unmount.
- Derived rows memoized; history capped at 120 points per sparkline.
- No new bundle-level dependency; antd/i18n already present.

## Open Questions

- Should the Monitor toggle be hidden when `/dashboard/snapshot` returns 404, or
  stay visible with a "disabled" explainer? Chosen: stay visible; discoverability
  beats a hidden feature, and the explainer tells the operator what to enable.
- Pause when `document.hidden` but keep the last snapshot visible; resume with an
  immediate fetch. Accepted.
- 5 s vs 3 s polling: 5 s matches the collector's sampling interval and avoids
  duplicate points. Revisit if the collector interval becomes configurable.

## Handoff

- No `x` or `gost` change; the snapshot contract is consumed as-is.
- The `x` design doc `2026-11-14-gost-dashboard-ui-design.md` is marked superseded.
- Release: normal gost-ui release. A push to `master` auto-deploys `gh-pages`
  (served at `ui.gost.run`), so merging lands the dashboard for hosted users;
  self-hosted users rebuild/upgrade the image.
- Phase 6 candidates: SSE streaming in `x/api`, dashboard persistence, admission
  `Service` attribution, plugin chain/resolver coverage (unchanged by this work).
