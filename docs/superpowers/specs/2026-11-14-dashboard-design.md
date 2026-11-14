# gost-ui Shell & Overview Design (GOST Dashboard Phase 5)

Date: 2026-11-14
Status: draft — supersedes `x/docs/superpowers/specs/2026-11-14-gost-dashboard-ui-design.md`

## Intent

Two changes to **gost-ui**, modelled on cuttle's admin layout:

1. Introduce a left navigation shell (persistent sidebar on desktop, drawer on
   mobile) shared by every authenticated page.
2. Add **Overview** as the first page, rendering `GET /dashboard/snapshot`.

The existing config page becomes a nav item ("Config"). Theme/language switches
move from the Manage header into the sidebar footer. The shell is the foundation
for the later mobile redesign of the existing pages; that redesign is **not** part
of this phase.

`gost` and `x` are unchanged: no embedded assets, no new endpoints, no config keys.

## Goals

- A `Shell` component: sidebar + header + content, responsive (`Sider` ≥ `lg`,
  `Drawer` < `lg`), usable down to 320 px wide.
- Nav: **Overview** (default) and **Config**; icons and i18n labels.
- Sidebar footer: theme toggle, language toggle, logout, connected address.
- Overview: services, chains, modules, events, history, polling every 5 s with
  hidden-tab pause and clear `loading/live/stale/disabled/unauthorized` states.
- Reuse the existing connection (`getInfo().addr` + basic auth), theme, and i18n.
- The config page keeps its behavior; only its global header actions move.

## Non-Goals

- Redesigning the config pages for mobile (next phase); this phase only provides
  the responsive shell and responsive Overview tables/cards.
- URL routing / deep links; navigation is component state, like cuttle.
- Embedding the UI in the `gost` binary; dropped.
- WebSocket/SSE, persistence, multi-instance aggregation.
- Chart libraries; sparklines are inline SVG.
- Backend changes.

## Anti-Goals

- Changing the Home/connect flow, the session model, or monaco.
- A second axios instance with different auth semantics.
- Per-poll `message.error`/`message.success` toasts.
- Hardcoding colors that break dark mode.
- Fixed pixel widths on page content that would block the mobile redesign.

## Compatibility findings

Reviewing gost-ui before this design ruled out embedding it in the gost binary:

| gost-ui fact | Consequence for binary embedding |
|---|---|
| `index.html` loads monaco from `%VITE_MONACO_URL%` (unpkg in production) | Offline/intranet breaks |
| `userInit` requires an API address via `?api=`/form/`?use=` | Same-origin mount still shows the connect page |
| `require` toasts every failure | 5 s polling would spam |
| antd is a manual chunk plus i18n bundles | Hundreds of KB |
| Separate repo/release | gost releases would depend on gost-ui artifacts |

All are non-issues when the UI stays in gost-ui and the user connects as today.

## Design

### Shell

New `src/components/Shell/index.tsx`:

```
<Layout>                      full height (100dvh)
  <Sider width={220} breakpoint="lg">   desktop only
    <Sidebar/>
  </Sider>
  <Drawer width={230}>        mobile only, opened by the header hamburger
    <Sidebar/>
  </Drawer>
  <Layout>
    <Header/>                 hamburger (<lg), page title
    <Content/>                renders the active page
  </Layout>
</Layout>
```

- `Grid.useBreakpoint()`; `isMobile = !screens.lg`.
- Sider uses `theme.useToken()` colors (`colorBgContainer` + `colorBorderSecondary`
  divider); no literal colors.
- Header is sticky, 56 px, and shows the page title; on mobile it also shows the
  hamburger. The connection address moves to the sidebar footer.
- Content: `padding: 16`, `overflow: auto`, `minWidth: 0`, page fills the height.
- `Shell` owns `page: 'overview' | 'config'` state (default `overview`) and the
  drawer open state. No URL changes.

`src/nav.ts` (mirrors cuttle's `nav.ts`):

```ts
export type Page = "overview" | "config";
export const NAV_ORDER: readonly Page[] = ["overview", "config"];
```

Labels live in i18n (`nav.overview`, `nav.config`); icons live in `Shell`
(`DashboardOutlined`, `SettingOutlined`).

### Sidebar

New `src/components/Sidebar/index.tsx`:

- `Menu mode="inline"`, `selectedKeys={[page]}`, transparent background, no
  trailing border — identical to cuttle.
- Scrollable nav area (`flex: 1`) + fixed footer (`borderTop`).
- Footer: `ThemeButton` and `LanguageButton` as full-width block buttons
  (`icon` + label), then `logout`, then the connected `info.addr` in small
  secondary text. All existing behavior is preserved (2-way light/dark toggle and
  zh/en toggle); no new theme modes.
- `onNavigate` closes the mobile drawer.

### App wiring

- `App.tsx`: when `isInit && info` render `<Shell/>` instead of `<Manage/>`;
  `Home` is untouched and never shows the shell.
- `Pages/Manage.tsx`: drop `Layout`, `Layout.Header`, `Layout.Content`, the addr
  text, `ThemeButton`, `LanguageButton`, and `logout` (moved to the shell).
  Keep a page-level toolbar with `reload`, `save`, `download`, settings, and
  new-window actions. The settings modal and save logic stay in `Manage`.
- Overview is lazily loaded like `Manage` (`React.lazy`), so the login screen does
  not download the dashboard.

### Overview data layer

`src/api/dashboard.ts`:

- Types mirroring `x/dashboard/snapshot.go` (`Snapshot`, `ServiceSnapshot`,
  `ModuleSnapshot`, `ChainSnapshot`, `EventRecord`, `HistoryPoint`, `LimiterStats`).
- `getDashboardSnapshot(signal?)` on the shared `require` instance with
  `{ noMsg: true }`; the endpoint returns the snapshot directly (no envelope).
- Path prefix is handled by `require` (`baseURL` already includes it).

`src/components/Overview/useSnapshot.ts`:

- Immediate fetch, then every 5 s (collector sampling interval).
- Pause on `visibilitychange`, fetch immediately on return.
- `AbortController` per request; aborted requests ignored.
- `phase`: `loading | live | stale | disabled | unauthorized`; last good snapshot
  retained; `updatedAt` and `error` exposed.
- 404 → `disabled`; 401 → `unauthorized` with a "reconnect" action that reuses
  `logout()`; other failures → `stale` with the previous data still visible.

`src/components/Overview/history.ts`: sum `currentConns` and diff
`inputBytes`/`outputBytes` across services per sample → `{t, inBps, outBps, conns}`;
skip non-positive `dt`, drop the first point, downsample to ≤ 120.

`src/components/Overview/format.ts`: bytes, Bps, duration, percent, clock time.

### Overview views

`src/components/Overview/index.tsx` composes:

- **Summary** — uptime, service count, current conns, total in/out Bps,
  `metricsEnabled`, sample interval, last update.
- **Services** — `Table`: name, state, total/current conns, in/out bytes and Bps,
  errors, error rate; `scroll={{x}}`, responsive summary cards.
- **Chains** — one `Card` per chain with chain stats and a node table (hop, node,
  state, connects, errors, avg connect ms).
- **Modules** — `Table` grouped by kind (`bypass`, `admission`, `hosts`,
  `resolver`, `auther`, `limiter_*`): calls, hits, misses, errors, avg latency,
  cache hit/miss/store; expandable rows for limiter counters.
- **Events** — newest-first table: time, level `Tag`, kind, name, service, message.
- **History** — three inline `Sparkline` SVGs (in Bps, out Bps, current conns).

Empty/disabled/unauthorized/loading states are explicit; no blank cards.

### i18n

Add `nav.*`, `shell.*`, `overview.*` keys to `src/i18n/languages.csv` (zh + en).
`src/i18n/*.json` is generated and gitignored; `prebuild` regenerates it.

### Tests

- Add `vitest@^0.34` (Vite 4 compatible); `npm test` = `vitest run`.
- Pure-logic tests only: `format.ts`, `history.ts`, snapshot status mapping, and
  `nav.ts` order/labels.
- Gates: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- `.github/workflows/autoDeployPages.yml`: run `npm test` before `npm run build`.
- Manual: wide screen shows the Sider; narrow screen shows the hamburger drawer;
  Overview live → kill API (`stale`) → disable dashboard (`disabled`) → enable an
  auther (`unauthorized`); Config still saves/reloads.

### Performance

- 5 s poll, hidden-tab pause, abort on unmount; memoized rows; ≤ 120 sparkline points.
- No new runtime dependency; antd/i18n already present.

## Open Questions

- Default page `overview` (monitoring first, like cuttle's topology) — confirm.
- Navigation without a router: no deep links and a reload returns to Overview.
  Deferred to the mobile-redesign phase, where URL structure will be revisited.
- Theme stays a 2-way light/dark toggle; cuttle's 3-way system/light/dark is not
  adopted in this phase.
- Should the sidebar show the gost version? There is no version endpoint; only the
  connected address is shown.

## Handoff

- No `x` or `gost` change.
- The `x` design doc `2026-11-14-gost-dashboard-ui-design.md` is marked superseded.
- Release: push to `master` auto-deploys `gh-pages` (ui.gost.run); self-hosted users
  rebuild the image.
- Phase 6: mobile redesign of the config pages (the shell already switches between
  `Sider` and `Drawer` and the Overview is responsive). Phase 7 candidates: SSE
  streaming, persistence, admission `Service` attribution, plugin coverage.
