# gost-ui Shell & Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cuttle-style left navigation shell to gost-ui and an Overview page that renders `GET /dashboard/snapshot`, keeping Config as the default page.

**Architecture:** A `Shell` component owns the authenticated layout (`Sider` ≥ `lg`, `Drawer` below) and the `page` state (`config` → `overview`). `Sidebar` renders the nav plus theme/language/logout/address. `Manage` loses its global header and keeps only its config toolbar. `Overview` polls the snapshot every 5 s through the shared axios instance and renders summary, services, chains, modules, events, and history; no router, no new runtime dependency.

**Tech Stack:** React 18, TypeScript 5 (strict), antd 5.11, Vite 4.4, i18next, axios, vitest 0.34.

**Spec:** `docs/superpowers/specs/2026-11-14-dashboard-design.md`

## Global Constraints

- Work only in `/root/code/go-gost/gost-ui`; `x` and `gost` are untouched.
- No new runtime dependency. Only dev dependency: `vitest@^0.34.0` (Vite 4 compatible).
- All API reads go through `src/utils/require.ts` with `noMsg: true`; polling must never toast.
- Colors come from antd tokens / `theme.useContext()`; no literal colors in new components except event-level `Tag` colors.
- i18n: add rows to `src/i18n/languages.csv` (`key,zh,en`). Generated `src/i18n/*.json` is gitignored — never commit it, never edit it.
- Config stays the default page and first nav item; the Home/connect flow is unchanged.
- Tests are pure-logic only (`*.test.ts`, node environment); no RTL/jsdom.
- Commit after every task, including its implementation record; never push.

## Review Focus

1. **Empty instance** (dashboard enabled, no services/modules/chains/events, history empty): every section shows an empty state, summary shows zeros, no `NaN` or crash.
2. **History with 0 or 1 points / duplicate or non-increasing timestamps**: no division by zero, no `Infinity`, empty sparkline placeholder.
3. **Polling while the API is down, 401, or dashboard-disabled 404**: no toast storm, previous data stays visible, state banner matches, polling recovers when the API returns.
4. **Long names and 320 px viewport**: tables scroll horizontally, sidebar collapses to the drawer, no horizontal page overflow.
5. **Zero denominators** (latency count 0, total conns 0, percent of zero): `—` instead of `NaN`/`Infinity`.

---

### Task 1: Test tooling and nav model

**Files:**
- Modify: `package.json` (script `test`, devDependency `vitest`)
- Modify: `vite.config.ts`
- Create: `src/nav.ts`, `src/nav.test.ts`

**Interfaces:**
- Produces: `type Page = "config" | "overview"`; `NAV_ORDER: readonly Page[]`.

- [ ] **Step 1: Install vitest**

Run: `npm install -D vitest@^0.34.0`
Expected: `package.json` devDependencies contains `vitest`, `package-lock.json` updated.

- [ ] **Step 2: Add the test script and vitest config**

`package.json` scripts: add `"test": "vitest run"`.

`vite.config.ts`: add `/// <reference types="vitest" />` as the first line, and add `test: { include: ["src/**/*.test.ts"] }` to the `config` object literal (before the `mode === "development"` early return).

- [ ] **Step 3: Write the failing test**

```ts
// src/nav.test.ts
import { expect, test } from "vitest";
import { NAV_ORDER } from "./nav";

test("config is the default first nav item, overview second", () => {
  expect(NAV_ORDER).toEqual(["config", "overview"]);
});
```

- [ ] **Step 4: Run it to verify it fails**

Run: `npx vitest run src/nav.test.ts`
Expected: FAIL — cannot resolve `./nav`.

- [ ] **Step 5: Implement `src/nav.ts`**

```ts
export type Page = "config" | "overview";

/** Left navigation order. Config stays first so the landing page is unchanged. */
export const NAV_ORDER: readonly Page[] = ["config", "overview"];
```

- [ ] **Step 6: Verify**

Run: `npx vitest run src/nav.test.ts && npx tsc --noEmit && npm run lint`
Expected: 1 test passes; no type or lint errors.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/nav.ts src/nav.test.ts
git commit -m "test: add vitest and nav order"
```

---

### Task 2: Formatting helpers

**Files:**
- Create: `src/components/Overview/format.ts`, `src/components/Overview/format.test.ts`

**Interfaces:**
- Produces:
  - `formatBytes(n: number): string`
  - `formatBps(n: number): string`
  - `formatDuration(seconds: number): string`
  - `formatPercent(part: number, total: number): string`
  - `formatClock(iso: string): string`
  - `formatLatency(sumMicros: number, count: number): string`
  - `formatCount(n: number): string`

- [ ] **Step 1: Write the failing tests**

```ts
// src/components/Overview/format.test.ts
import { expect, test } from "vitest";
import {
  formatBps, formatBytes, formatClock, formatCount, formatDuration,
  formatLatency, formatPercent,
} from "./format";

test("formatBytes", () => {
  expect(formatBytes(0)).toBe("0 B");
  expect(formatBytes(512)).toBe("512 B");
  expect(formatBytes(1024)).toBe("1.0 KiB");
  expect(formatBytes(1536)).toBe("1.5 KiB");
  expect(formatBytes(10 * 1024)).toBe("10 KiB");
  expect(formatBytes(1024 ** 3)).toBe("1.0 GiB");
  expect(formatBytes(Number.NaN)).toBe("0 B");
});

test("formatBps", () => {
  expect(formatBps(2048)).toBe("2.0 KiB/s");
});

test("formatDuration", () => {
  expect(formatDuration(0)).toBe("0s");
  expect(formatDuration(7)).toBe("7s");
  expect(formatDuration(306)).toBe("5m 6s");
  expect(formatDuration(11040)).toBe("3h 4m");
  expect(formatDuration(93784)).toBe("1d 2h");
  expect(formatDuration(-5)).toBe("0s");
});

test("formatPercent", () => {
  expect(formatPercent(0, 0)).toBe("—");
  expect(formatPercent(1, 3)).toBe("33.3%");
});

test("formatClock uses local time and rejects invalid input", () => {
  expect(formatClock(new Date(2026, 0, 2, 3, 4, 5).toISOString())).toBe("03:04:05");
  expect(formatClock("nope")).toBe("—");
});

test("formatLatency", () => {
  expect(formatLatency(0, 0)).toBe("—");
  expect(formatLatency(4500, 2)).toBe("2.3 ms");
  expect(formatLatency(400, 1)).toBe("0.4 ms");
});

test("formatCount", () => {
  expect(formatCount(1234)).toBe("1,234");
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/Overview/format.test.ts`
Expected: FAIL — cannot resolve `./format`.

- [ ] **Step 3: Implement `format.ts`**

Rules: units `B, KiB, MiB, GiB, TiB, PiB`, divide by 1024; one decimal below 10 units above `B`, otherwise rounded. Duration: `d h`, else `h m`, else `m s`, else `s`; floor and clamp at 0. Percent: `toFixed(1)` + `%`, `—` when `total <= 0`. Clock: manual `HH:MM:SS` padding from local `getHours()`; `—` for invalid dates. Latency: `sumMicros / count / 1000`, one decimal under 10 ms, else rounded, `—` when `count <= 0`. Count: `Intl.NumberFormat("en-US")`.

- [ ] **Step 4: Verify**

Run: `npx vitest run src/components/Overview/format.test.ts`
Expected: all format tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Overview/format.ts src/components/Overview/format.test.ts
git commit -m "feat(overview): add formatting helpers"
```

---

### Task 3: History sampling

**Files:**
- Create: `src/components/Overview/history.ts`, `src/components/Overview/history.test.ts`

**Interfaces:**
- Produces: `interface HistoryInput { time: string; services: Record<string, { currentConns: number; inputBytes: number; outputBytes: number }> }`; `interface HistorySample { t: number; inBps: number; outBps: number; conns: number }`; `historySamples(history: HistoryInput[]): HistorySample[]`; `MAX_POINTS = 120`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/components/Overview/history.test.ts
import { expect, test } from "vitest";
import { historySamples, MAX_POINTS, type HistoryInput } from "./history";

const pt = (t: number, input: number, output: number, conns: number): HistoryInput => ({
  time: new Date(t).toISOString(),
  services: { svc: { currentConns: conns, inputBytes: input, outputBytes: output } },
});

test("no samples without two points", () => {
  expect(historySamples([])).toEqual([]);
  expect(historySamples([pt(0, 0, 0, 1)])).toEqual([]);
});

test("diffs byte counters and sums services", () => {
  const s = historySamples([
    { time: new Date(0).toISOString(), services: { a: { currentConns: 1, inputBytes: 0, outputBytes: 0 } } },
    { time: new Date(5000).toISOString(), services: { a: { currentConns: 2, inputBytes: 3000, outputBytes: 6000 } } },
    { time: new Date(10000).toISOString(), services: { a: { currentConns: 3, inputBytes: 5000, outputBytes: 10000 } } },
  ]);
  expect(s).toEqual([
    { t: 5000, inBps: 600, outBps: 1200, conns: 2 },
    { t: 10000, inBps: 400, outBps: 800, conns: 3 },
  ]);
});

test("skips duplicate timestamps", () => {
  expect(historySamples([pt(0, 0, 0, 1), pt(0, 10, 10, 1)])).toEqual([]);
});

test("caps at MAX_POINTS", () => {
  const points: HistoryInput[] = [];
  for (let i = 0; i <= 130; i++) points.push(pt(i * 1000, i * 1000, i * 2000, i));
  expect(historySamples(points)).toHaveLength(MAX_POINTS);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/Overview/history.test.ts`
Expected: FAIL — cannot resolve `./history` (and `../../api/dashboard`).

- [ ] **Step 3: Implement `history.ts`**

Sort a copy by `Date.parse(time)` ascending; sum `currentConns`, `inputBytes`, `outputBytes` over `Object.values(point.services)` per point. For each point after the first: `dt = (t - prev.t) / 1000`; skip when `dt <= 0`; `inBps = Math.max(0, (in - prev.in) / dt)` (same for out); push `{ t, inBps, outBps, conns }`. Keep the last `MAX_POINTS` samples.

- [ ] **Step 4: Verify**

Run: `npx vitest run src/components/Overview/history.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Overview/history.ts src/components/Overview/history.test.ts
git commit -m "feat(overview): derive history rates"
```

---

### Task 4: Snapshot phase mapping

**Files:**
- Create: `src/components/Overview/status.ts`, `src/components/Overview/status.test.ts`

**Interfaces:**
- Produces: `type SnapshotPhase = "loading" | "live" | "stale" | "disabled" | "unauthorized"`; `phaseForStatus(status: number | undefined): SnapshotPhase`.

- [ ] **Step 1: Write the failing test**

```ts
// src/components/Overview/status.test.ts
import { expect, test } from "vitest";
import { phaseForStatus } from "./status";

test("maps HTTP status to a snapshot phase", () => {
  expect(phaseForStatus(200)).toBe("live");
  expect(phaseForStatus(404)).toBe("disabled");
  expect(phaseForStatus(401)).toBe("unauthorized");
  expect(phaseForStatus(403)).toBe("unauthorized");
  expect(phaseForStatus(500)).toBe("stale");
  expect(phaseForStatus(undefined)).toBe("stale");
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/Overview/status.test.ts`
Expected: FAIL — cannot resolve `./status`.

- [ ] **Step 3: Implement `status.ts`**

```ts
export type SnapshotPhase = "loading" | "live" | "stale" | "disabled" | "unauthorized";

/** 404 = dashboard disabled, 401/403 = auther rejected, anything else = stale data. */
export function phaseForStatus(status: number | undefined): SnapshotPhase {
  if (status === 200) return "live";
  if (status === 404) return "disabled";
  if (status === 401 || status === 403) return "unauthorized";
  return "stale";
}
```

- [ ] **Step 4: Verify**

Run: `npx vitest run src/components/Overview/status.test.ts`
Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/Overview/status.ts src/components/Overview/status.test.ts
git commit -m "feat(overview): map snapshot status to phases"
```

---

### Task 5: Dashboard API client and quiet polling

**Files:**
- Create: `src/api/dashboard.ts`, `src/api/dashboard.test.ts`
- Modify: `src/utils/require.ts` (error interceptor honors `noMsg`)

**Interfaces:**
- Produces: `DASHBOARD_SNAPSHOT_PATH = "/dashboard/snapshot"`; `getDashboardSnapshot(signal?: AbortSignal): Promise<Snapshot>`; and the snapshot types below.

- [ ] **Step 1: Write the failing test**

```ts
// src/api/dashboard.test.ts
import { expect, test, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("../utils/require", () => ({ default: { get } }));

import { DASHBOARD_SNAPSHOT_PATH, getDashboardSnapshot } from "./dashboard";

test("requests the snapshot quietly", async () => {
  get.mockResolvedValue({ version: 1 });
  const signal = new AbortController().signal;
  await expect(getDashboardSnapshot(signal)).resolves.toEqual({ version: 1 });
  expect(get).toHaveBeenCalledWith(DASHBOARD_SNAPSHOT_PATH, { signal, noMsg: true });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/api/dashboard.test.ts`
Expected: FAIL — cannot resolve `./dashboard`.

- [ ] **Step 3: Implement `src/api/dashboard.ts`**

```ts
import require from "../utils/require";

export const DASHBOARD_SNAPSHOT_PATH = "/dashboard/snapshot";

export interface ServiceStats {
  totalConns: number; currentConns: number;
  inputBytes: number; outputBytes: number; totalErrs: number;
}
export interface ServiceRate {
  inputBytesPerSecond: number; outputBytesPerSecond: number;
}
export interface ServiceSnapshot {
  name: string; state: string; stats: ServiceStats; rate: ServiceRate;
}
export interface LimiterStats {
  calls: number; allowed: number; denied: number;
  waitCalls: number; requested: number; granted: number;
}
export interface ModuleStats {
  calls: number; hits: number; misses: number; errors: number;
  inputBytes: number; outputBytes: number;
  latencySumMicros: number; latencyCount: number;
  cacheHits: number; cacheMisses: number; cacheStores: number;
  limiter?: LimiterStats;
}
export interface ModuleSnapshot {
  kind: string; name: string; service?: string; state?: string; stats: ModuleStats;
}
export interface ChainStats {
  connects: number; errors: number;
  connectDurationSumMicros: number; connectCount: number;
}
export interface NodeSnapshot { name: string; state?: string; stats: ChainStats }
export interface HopSnapshot { name: string; nodes: NodeSnapshot[] }
export interface ChainSnapshot {
  name: string; hops?: HopSnapshot[]; nodes?: NodeSnapshot[]; stats: ChainStats;
}
export interface EventRecord {
  time: string; level: string; kind: string;
  name: string; service?: string; message: string;
}
export interface ServiceHistory {
  currentConns: number; inputBytes: number; outputBytes: number;
}
export interface HistoryPoint {
  time: string; services: Record<string, ServiceHistory>;
}
export interface Snapshot {
  version: number;
  generatedAt: string;
  startedAt: string;
  sampleIntervalSeconds: number;
  metricsEnabled: boolean;
  services: Record<string, ServiceSnapshot>;
  modules: ModuleSnapshot[];
  chains: Record<string, ChainSnapshot>;
  events: EventRecord[];
  history: HistoryPoint[];
}

export const getDashboardSnapshot = (signal?: AbortSignal): Promise<Snapshot> =>
  require.get(DASHBOARD_SNAPSHOT_PATH, { signal, noMsg: true } as any) as unknown as Promise<Snapshot>;
```

- [ ] **Step 4: Make the error interceptor honor `noMsg`**

In `src/utils/require.ts`, wrap the existing `message.error(msg)` call in the error interceptor:

```ts
if (!(error?.config as any)?.noMsg) {
  message.error(msg);
}
```

Everything else in the interceptor stays. This is what keeps 5 s polling from toasting on every failed request.

- [ ] **Step 5: Verify**

Run: `npx vitest run src/api/dashboard.test.ts && npx tsc --noEmit && npm run lint`
Expected: test passes; no type/lint errors.

- [ ] **Step 6: Commit**

```bash
git add src/api/dashboard.ts src/api/dashboard.test.ts src/utils/require.ts
git commit -m "feat(api): add quiet dashboard snapshot client"
```

---

### Task 6: Shell, sidebar, and Manage header extraction

**Files:**
- Create: `src/components/Sidebar/index.tsx`
- Create: `src/components/Shell/index.tsx`
- Create: `src/Pages/Overview.tsx` (temporary stub, replaced in Task 7)
- Modify: `src/Pages/Manage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/i18n/languages.csv` (nav/shell rows)

**Interfaces:**
- Consumes: `Page`, `NAV_ORDER` (Task 1); `useInfo`, `logout`, `getLocalServers` from `src/utils/server`; `GostApiConfig`.
- Produces: `Shell` default export used by `App`; `Sidebar` props `{ page: Page; info: GostApiConfig | null; onNavigate: (page: Page) => void }`.

- [ ] **Step 1: Add the i18n rows**

Append to `src/i18n/languages.csv`:

```csv
nav.menu,菜单,Menu
nav.config,配置,Config
nav.overview,总览,Overview
shell.menu.switch,切换服务,Switch server
shell.menu.new,新窗口,New window
```

- [ ] **Step 2: Create `Sidebar`**

Requirements:
- Root: `display:flex; flexDirection:column; height:100%`.
- Nav area: `flex:1; minHeight:0; overflowY:auto`; antd `Menu mode="inline" selectedKeys={[page]}` with `style={{ borderInlineEnd: "none", background: "transparent" }}`; items built from `NAV_ORDER` with labels `t(`nav.${p}`)` and icons `DashboardOutlined` (overview) / `SettingOutlined` (config); `onClick` calls `onNavigate(key as Page)`.
- Footer: `borderTop: "1px solid"` using `theme.useToken().token.colorBorderSecondary`, padding 12, `Space direction="vertical" size={8} style={{ width: "100%" }}`.
  - Row with the existing `<ThemeButton />` and `<LanguageButton />` (unchanged components).
  - `Dropdown.Button` styled `width: "100%"` with `onClick={() => logout()}` and `menu={{ items }}`; label `t("manage.cmd.logout")`. `items` are the current Manage items: local servers under `t("shell.menu.switch")` (each `<a href={`./?use=${addr}`}>{addr}</a>`), a divider, then `t("shell.menu.new")` opening `window.open(location.href, undefined, "noopener")`. Load locals with the existing `getLocalServers().then(sort by time desc)` effect and `useMemo`.
  - `<Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>{info?.addr}</Typography.Text>`.

- [ ] **Step 3: Create `Shell`**

```tsx
import { lazy, Suspense, useState } from "react";
import { Layout, Button, Typography, Drawer, Grid, Spin, theme } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useInfo } from "../../utils/server";
import { type Page } from "../../nav";
import Sidebar from "../Sidebar";

const Manage = lazy(() => import("../../Pages/Manage"));
const Overview = lazy(() => import("../../Pages/Overview"));

export default function Shell() {
  const [page, setPage] = useState<Page>("config");
  const [navOpen, setNavOpen] = useState(false);
  const isMobile = !Grid.useBreakpoint().lg;
  const info = useInfo();
  const token = theme.useToken().token;
  const { t } = useTranslation();
  const navigate = (next: Page) => { setPage(next); setNavOpen(false); };
  // Sider when !isMobile, Drawer when isMobile, Header with hamburger + t(`nav.${page}`),
  // Content with <Suspense fallback={<Spin/>}> and page === "config" ? <Manage/> : <Overview/>.
}
```

Layout decisions to follow exactly:
- Outer `<Layout style={{ height: "100dvh", overflow: "hidden" }}>`.
- Sider `width={220}` with `style={{ background: token.colorBgContainer, borderRight: `1px solid ${token.colorBorderSecondary}` }}`; render `Sidebar` inside when `!isMobile`.
- Drawer `placement="left" width={230} open={navOpen} onClose={() => setNavOpen(false)} styles={{ body: { padding: 0 } }}`; render the same `Sidebar`.
- Header: `height: 56`, `lineHeight: "normal"`, `display:flex`, `alignItems:center`, gap 8, paddingInline 16, `background: token.colorBgContainer`, `borderBottom: 1px solid ${token.colorBorderSecondary}`; hamburger only when `isMobile` (`aria-label={t("nav.menu")}`); then `<Typography.Text strong>{t(`nav.${page}`)}</Typography.Text>`.
- Content: `overflow: "auto"`, `padding: 16`, `background: token.colorBgLayout`, `minWidth: 0`.

- [ ] **Step 4: Replace the temporary Overview stub**

`src/Pages/Overview.tsx` renders `<Spin />` centered with `data-testid="overview-stub"`; Task 7 replaces it.

- [ ] **Step 5: Strip the Manage header**

In `src/Pages/Manage.tsx`:
- Remove the `Layout`, `Layout.Header`, `Layout.Content` wrapper and the `style={{ height: "100vh", overflow: "hidden" }}`.
- Remove from the header: the address `Col`, the logout `Dropdown.Button`, `ThemeButton`, `LanguageButton`.
- Delete the now-unused `locals` state, `items` memo, `getLocalServers` effect, and their imports (`Layout`, `Dropdown`, `logout`, `getLocalServers`, `ThemeButton`, `LanguageButton`, `useMemo` if unused).
- Return a fragment: a toolbar `<Space wrap style={{ marginBottom: 16 }}>` containing reload, `Space.Compact` save+settings, download (same buttons, handlers, loading states), then the existing `<Row gutter={[16, 16]}>…</Row>`, then the settings `<Modal>`.
- Keep `ref.current.onSave`, `isSaved`, `loading`, `show`, and the modal form untouched.

- [ ] **Step 6: Wire `App`**

In `src/App.tsx`: delete `const Manage = React.lazy(...)`; import `Shell from "./components/Shell"`; render `info ? <Shell /> : <Home />`. Keep the existing `React.Suspense` wrapper.

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: clean.

Manual smoke (two terminals):
```bash
cd /root/code/go-gost/gost && go run ./cmd/gost -L "http://:18080" -api ":18000" -C '{"dashboard":{"enabled":true}}'
cd /root/code/go-gost/gost-ui && npm run dev
```
Connect to `localhost:18000`: Config is shown with the sidebar; theme/language/logout/address are in the footer; the Overview item opens the spinner; resizing below 992 px hides the Sider and the hamburger opens the drawer.

- [ ] **Step 8: Commit**

```bash
git add src/components/Sidebar src/components/Shell src/Pages/Overview.tsx src/Pages/Manage.tsx src/App.tsx src/i18n/languages.csv
git commit -m "feat(shell): add sidebar navigation and move global controls"
```

---

### Task 7: Overview skeleton, polling, and summary

**Files:**
- Create: `src/components/Overview/useSnapshot.ts`
- Create: `src/components/Overview/Summary.tsx`
- Modify: `src/Pages/Overview.tsx`
- Modify: `src/i18n/languages.csv` (overview summary/state rows)

**Interfaces:**
- Consumes: `getDashboardSnapshot`, `Snapshot` (Task 5); `phaseForStatus`, `SnapshotPhase` (Task 4); `format*` (Task 2).
- Produces: `useSnapshot(pollMs?: number): { snapshot: Snapshot | null; phase: SnapshotPhase; error: string | null; updatedAt: number | null; refresh: () => void }`.

- [ ] **Step 1: Add the i18n rows**

```csv
overview.refresh,刷新,Refresh
overview.updated,更新于 {{time}},Updated {{time}}
overview.stale,数据可能已过期：{{error}},Data may be stale: {{error}}
overview.disabled.title,监控未启用,Dashboard disabled
overview.disabled.desc,在配置中设置 dashboard.enabled: true 后重载。,Set dashboard.enabled: true in the config and reload.
overview.unauthorized.title,认证失败,Authentication failed
overview.unauthorized.desc,连接凭据已失效，请重新连接。,The connection credentials are no longer valid.
overview.unauthorized.action,重新连接,Reconnect
overview.summary.uptime,运行时间,Uptime
overview.summary.services,服务,Services
overview.summary.conns,当前连接,Current connections
overview.summary.in,入站速率,Inbound
overview.summary.out,出站速率,Outbound
overview.summary.metrics,指标,Metrics
overview.summary.enabled,已启用,Enabled
overview.summary.disabled,未启用,Disabled
overview.summary.interval,采样间隔,Sample interval
```

- [ ] **Step 2: Implement `useSnapshot`**

Immediate load, then `setInterval(load, pollMs)` with `pollMs = 5000`; skip the tick when `document.hidden`; `visibilitychange` triggers `load` when visible. Each load aborts the previous `AbortController`. On success set `snapshot`, `phase = "live"`, `error = null`, `updatedAt = Date.now()`. On error: ignore aborted requests; derive `status` via `axios.isAxiosError(err) ? err.response?.status : undefined`; set `phase = phaseForStatus(status)`, keep the previous snapshot, set `error` from `err.message`. Cleanup clears the interval, removes the listener, and aborts.

- [ ] **Step 3: Implement `Summary`**

Props `{ snapshot: Snapshot }`. A responsive `Row gutter={[16, 16]}` of `Col xs={12} md={8} xl={4}` cards using antd `Statistic`:
- Uptime: `formatDuration((Date.now() - Date.parse(startedAt)) / 1000)`.
- Services: `Object.keys(services).length`.
- Current connections: sum of `stats.currentConns`.
- Inbound: `formatBps(sum of rate.inputBytesPerSecond)`.
- Outbound: `formatBps(sum of rate.outputBytesPerSecond)`.
- Metrics: `t("overview.summary.enabled"/"disabled")`; the interval card shows `${sampleIntervalSeconds}s` with title `t("overview.summary.interval")`.

Use `useMemo` for the sums. No literal colors.

- [ ] **Step 4: Implement the page states**

`src/Pages/Overview.tsx`:
- `phase === "loading" && !snapshot` → centered `<Spin size="large" />`.
- `phase === "disabled"` → `<Result status="info" title={t("overview.disabled.title")} subTitle={t("overview.disabled.desc")} />`; no polling controls.
- `phase === "unauthorized"` → `<Result status="warning" ... extra={<Button onClick={() => logout()}>{t("overview.unauthorized.action")}</Button>} />`.
- Otherwise: `phase === "stale"` renders `<Alert type="warning" showIcon message={t("overview.stale", { error })} />` above the content; a toolbar with refresh (`<Button icon={<ReloadOutlined />} onClick={refresh}>`) and `<Typography.Text type="secondary">{t("overview.updated", { time: updatedAt ? formatClock(new Date(updatedAt).toISOString()) : "—" })}</Typography.Text>`; then `<Summary snapshot={snapshot} />` when a snapshot exists.

- [ ] **Step 5: Verify manually**

With the smoke server running: Overview shows live numbers and updates every 5 s; the tab hidden stops requests (Network panel); `Ctrl+C` the gost process shows the stale alert (no toast); reconnecting clears it. Set `-C '{"dashboard":{"enabled":false}}'` and reload → disabled result; add an auther to the API config to check the unauthorized result.

- [ ] **Step 6: Commit**

```bash
git add src/components/Overview/useSnapshot.ts src/components/Overview/Summary.tsx src/Pages/Overview.tsx src/i18n/languages.csv
git commit -m "feat(overview): add polling and summary"
```

---

### Task 8: Services and modules tables

**Files:**
- Create: `src/components/Overview/Services.tsx`
- Create: `src/components/Overview/Modules.tsx`
- Create: `src/components/Overview/modules.ts`, `src/components/Overview/modules.test.ts`
- Modify: `src/Pages/Overview.tsx`
- Modify: `src/i18n/languages.csv`

**Interfaces:**
- Consumes: `Snapshot`, `ModuleSnapshot` (Task 5); format helpers (Task 2).
- Produces: `Services({ snapshot }: { snapshot: Snapshot })`, `Modules({ snapshot }: { snapshot: Snapshot })`, and `groupModules(modules: ModuleSnapshot[]): { kind: string; rows: ModuleSnapshot[] }[]`.

- [ ] **Step 1: Write the failing grouping test**

```ts
// src/components/Overview/modules.test.ts
import { expect, test } from "vitest";
import type { ModuleSnapshot } from "../../api/dashboard";
import { groupModules } from "./modules";

const mod = (kind: string, name: string): ModuleSnapshot => ({
  kind, name, stats: {
    calls: 0, hits: 0, misses: 0, errors: 0, inputBytes: 0, outputBytes: 0,
    latencySumMicros: 0, latencyCount: 0, cacheHits: 0, cacheMisses: 0, cacheStores: 0,
  },
});

test("groups by known kind order, then name", () => {
  const groups = groupModules([mod("limiter_rate", "b"), mod("bypass", "z"), mod("bypass", "a")]);
  expect(groups.map((g) => g.kind)).toEqual(["bypass", "limiter_rate"]);
  expect(groups[0].rows.map((r) => r.name)).toEqual(["a", "z"]);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/Overview/modules.test.ts`
Expected: FAIL — cannot resolve `./modules`.

- [ ] **Step 3: Implement `modules.ts`**

`KIND_ORDER = ["bypass", "admission", "auther", "hosts", "resolver", "limiter_conn", "limiter_rate", "limiter_traffic"]`; sort known kinds by that order, unknown kinds alphabetically after known ones; sort rows by `name`; drop empty groups. Keep `groupModules` pure.

- [ ] **Step 4: Implement `Services`**

`Table size="small" pagination={false} rowKey="name" scroll={{ x: 760 }}` over `Object.values(snapshot.services).sort(by name)`. Columns (title key / dataIndex or render):
- `overview.services.name` → `name`
- `overview.services.state` → `state` (Tag: `running` green, otherwise default)
- `overview.services.total` → `stats.totalConns` (`formatCount`)
- `overview.services.current` → `stats.currentConns` (`formatCount`)
- `overview.services.in` → `formatBps(rate.inputBytesPerSecond)` with `formatBytes(stats.inputBytes)` as a secondary line
- `overview.services.out` → same for output
- `overview.services.errs` → `formatCount(stats.totalErrs)`
- `overview.services.errRate` → `formatPercent(stats.totalErrs, stats.totalConns)`

When the map is empty render antd `<Empty description={t("overview.empty")} />`.

- [ ] **Step 5: Implement `Modules`**

`Table size="small" pagination={false} scroll={{ x: 900 }}`; rows from `groupModules(snapshot.modules).flatMap(g => g.rows)`; `rowKey={(m) => `${m.kind}/${m.service ?? "-"}/${m.name}`}`. Columns:
- kind label `t(`overview.module.kind.${m.kind}`)` falling back to `m.kind`
- name, service (`m.service ?? "—"`), state
- calls, hits, misses, errors (`formatCount`)
- avg latency `formatLatency(stats.latencySumMicros, stats.latencyCount)`
- limiter column: when `stats.limiter` exists show `allowed / calls` (or `granted / requested` when `requested > 0`), else `—`

`expandable={{ expandedRowRender }}` only for rows with `stats.limiter`: render a `Descriptions size="small" column={3}` with all limiter counters plus `cacheHits/cacheMisses/cacheStores` and input/output bytes. Empty modules → `<Empty description={t("overview.empty")} />`.

- [ ] **Step 6: Mount both sections**

In `src/Pages/Overview.tsx`, below `Summary`, render two `Card` sections with titles `t("overview.services.title")` and `t("overview.modules.title")` and `styles={{ body: { padding: 0 } }}` (tables carry their own padding via `size="small"` + a `padding: 8` wrapper).

- [ ] **Step 7: Add i18n rows**

```csv
overview.services.title,服务,Services
overview.services.name,名称,Name
overview.services.state,状态,State
overview.services.total,累计连接,Total
overview.services.current,当前连接,Current
overview.services.in,入站,In
overview.services.out,出站,Out
overview.services.errs,错误,Errors
overview.services.errRate,错误率,Error rate
overview.modules.title,模块,Modules
overview.modules.kind,类型,Kind
overview.modules.name,名称,Name
overview.modules.service,服务,Service
overview.modules.state,状态,State
overview.modules.calls,调用,Calls
overview.modules.hits,命中,Hits
overview.modules.misses,未命中,Misses
overview.modules.errors,错误,Errors
overview.modules.latency,平均耗时,Avg latency
overview.module.kind.admission,准入,Admission
overview.module.kind.auther,认证,Auther
overview.module.kind.bypass,绕过,Bypass
overview.module.kind.hosts,Hosts,Hosts
overview.module.kind.resolver,解析器,Resolver
overview.module.kind.limiter_conn,连接限流,Conn limiter
overview.module.kind.limiter_rate,速率限流,Rate limiter
overview.module.kind.limiter_traffic,流量限流,Traffic limiter
overview.empty,暂无数据,No data
```

- [ ] **Step 8: Verify**

Run: `npx vitest run src/components/Overview/modules.test.ts && npx tsc --noEmit && npm run lint`
Manual: with the smoke server, both tables render; disabling the dashboard mid-session keeps the tables and shows the stale alert; a 320 px viewport scrolls the tables horizontally without overflowing the page.

- [ ] **Step 9: Commit**

```bash
git add src/components/Overview/Services.tsx src/components/Overview/Modules.tsx src/components/Overview/modules.ts src/components/Overview/modules.test.ts src/Pages/Overview.tsx src/i18n/languages.csv
git commit -m "feat(overview): add service and module tables"
```

---

### Task 9: Chains, events, and history

**Files:**
- Create: `src/components/Overview/Chains.tsx`
- Create: `src/components/Overview/Events.tsx`
- Create: `src/components/Overview/Sparkline.tsx`
- Modify: `src/Pages/Overview.tsx`
- Modify: `src/i18n/languages.csv`

**Interfaces:**
- Consumes: `ChainSnapshot`, `EventRecord` (Task 5); `historySamples` (Task 3); format helpers (Task 2).
- Produces: `Chains({ snapshot })`, `Events({ snapshot })`, `Sparkline({ values, width?, height?, color? })`.

- [ ] **Step 1: Implement `Sparkline`**

Props `{ values: number[]; width?: number; height?: number; color?: string }` with defaults `width=280, height=48, color=token.colorPrimary`. With fewer than 2 points render `<Typography.Text type="secondary">—</Typography.Text>`. Otherwise an inline `<svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">` containing a `<polyline>` whose points map index → x (`width * i / (n-1)`) and value → y (`min === max ? height/2 : height - (v - min) / (max - min) * height`), `fill="none"`, `strokeWidth={1.5}`, `stroke={color}`. `aria-hidden`.

- [ ] **Step 2: Implement `Chains`**

`Object.values(snapshot.chains).sort(by name)`; for each, a `Card size="small" title={chain.name}` with `Descriptions` (`overview.chains.connects`, `errors`, avg connect via `formatLatency(stats.connectDurationSumMicros, stats.connectCount)`), then a `Table` of nodes (`scroll={{ x: 520 }}`, `pagination={false}`): hop, node name, state, connects, errors, avg connect. Use `chain.nodes` when non-empty, otherwise flatten `chain.hops` with the hop name. Empty → `<Empty description={t("overview.empty")} />`.

- [ ] **Step 3: Implement `Events`**

Sort a copy by `Date.parse(time)` descending (newest first). `Table size="small" pagination={false} scroll={{ x: 720 }}` with columns time (`formatClock`), level (`Tag`: `error` red, `warn` orange, otherwise blue), kind, name, service (`—` when absent), message. Empty → `<Empty description={t("overview.empty")} />`.

- [ ] **Step 4: Add the history section**

In `src/Pages/Overview.tsx`: `const samples = useMemo(() => historySamples(snapshot?.history ?? []), [snapshot]);` then a `Card` titled `t("overview.history.title")` with three labeled `Sparkline`s: inbound (`formatBps(last.inBps)`), outbound, connections (`formatCount(last.conns)`). Values are `samples.map(s => s.inBps | s.outBps | s.conns)`.

- [ ] **Step 5: Add i18n rows**

```csv
overview.chains.title,转发链,Chains
overview.chains.connects,连接,Connects
overview.chains.errors,错误,Errors
overview.chains.avgConnect,平均连接耗时,Avg connect
overview.chains.node,节点,Node
overview.chains.hop,跳,Hop
overview.events.title,事件,Events
overview.events.time,时间,Time
overview.events.level,级别,Level
overview.events.kind,类型,Kind
overview.events.name,名称,Name
overview.events.service,服务,Service
overview.events.message,消息,Message
overview.history.title,历史,History
overview.history.in,入站,Inbound
overview.history.out,出站,Outbound
overview.history.conns,连接,Connections
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Manual: chains render with node tables; events newest first with colored levels; sparklines appear after two samples and stay flat when idle.

- [ ] **Step 7: Commit**

```bash
git add src/components/Overview/Chains.tsx src/components/Overview/Events.tsx src/components/Overview/Sparkline.tsx src/Pages/Overview.tsx src/i18n/languages.csv
git commit -m "feat(overview): add chains, events, and history"
```

---

### Task 10: CI test gate and final verification

**Files:**
- Modify: `.github/workflows/autoDeployPages.yml`

- [ ] **Step 1: Add the test step to CI**

In `autoDeployPages.yml`, after `- run: npm install` and before `- run: npm run build`, add:

```yaml
      - run: npm test
```

- [ ] **Step 2: Full local verification**

Run:
```bash
npm test && npm run lint && npx tsc --noEmit && npm run build
```
Expected: all pass; `dist/` builds; no `src/i18n/*.json` in `git status`.

- [ ] **Step 3: End-to-end manual pass**

With the smoke server running, verify in this order:
1. Connect → Config is the landing page; sidebar shows Config/Overview, theme, language, logout, address.
2. Theme toggle and language toggle from the sidebar affect the whole app; logout returns to Home; Home is unchanged (no sidebar).
3. Overview live → stop the gost process (stale alert, no toast) → restart (recovers within 5 s).
4. Dashboard disabled (`-C '{"dashboard":{"enabled":false}}'`) → disabled result; with an auther configured → unauthorized result and Reconnect returns to Home.
5. 320 px viewport → hamburger drawer, no horizontal page overflow, tables scroll internally.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/autoDeployPages.yml
git commit -m "ci: run ui tests before build"
```

---

## Implementation records

Fill one subsection per task after it is complete, then amend it into that task's commit.

### Task 1
- Date/status: 2026-11-14 — complete
- Repository + commit SHA: gost-ui @ (this commit)
- Files changed: `package.json`, `package-lock.json`, `vite.config.ts`, `src/nav.ts`, `src/nav.test.ts`, `.gitignore` (SDD scratch), this plan.
- Tests/commands and results: `npx vitest run src/nav.test.ts` → 1 passed (RED first: unresolved `./nav`); `npx tsc --noEmit` → clean; `npx eslint src/nav.ts src/nav.test.ts vite.config.ts` → clean.
- Review findings and fixes: `npm run lint` is red at base (2 unused-disable errors in `Pages/Home.tsx:1:1` and `components/ModalForm.tsx:83:33`, 12 warnings), so the per-task lint gate was scoped to touched files.
- Deferred items/limitations: repo-wide lint baseline stays red (pre-existing).

### Task 2
- Date/status: 2026-11-14 — complete
- Repository + commit SHA: gost-ui @ (this commit)
- Files changed: `src/components/Overview/format.ts`, `src/components/Overview/format.test.ts`.
- Tests/commands and results: `npx vitest run src/components/Overview/format.test.ts` → 7 passed (RED first: unresolved `./format`); `npx tsc --noEmit` → clean; scoped `eslint` → clean.
- Review findings and fixes: none.
- Deferred items/limitations: none.

### Task 3
- Date/status: 2026-11-14 — complete
- Repository + commit SHA: gost-ui @ (this commit)
- Files changed: `src/components/Overview/history.ts`, `src/components/Overview/history.test.ts`.
- Tests/commands and results: `npx vitest run src/components/Overview/history.test.ts` → 4 passed (RED first: unresolved `./history`); `npx tsc --noEmit` → clean; scoped `eslint` → clean.
- Review findings and fixes: input decoupled via a structural `HistoryInput` so the task does not depend on the later API type file.
- Deferred items/limitations: none.

### Task 4
- Date/status: 2026-11-14 — complete
- Repository + commit SHA: gost-ui @ (this commit)
- Files changed: `src/components/Overview/status.ts`, `src/components/Overview/status.test.ts`.
- Tests/commands and results: `npx vitest run src/components/Overview/status.test.ts` → 1 passed (RED first: unresolved `./status`); `npx tsc --noEmit` → clean; scoped `eslint` → clean.
- Review findings and fixes: none.
- Deferred items/limitations: none.

### Task 5
- Date/status: 2026-11-14 — complete
- Repository + commit SHA: gost-ui @ (this commit)
- Files changed: `src/api/dashboard.ts`, `src/api/dashboard.test.ts`, `src/utils/require.ts`.
- Tests/commands and results: `npx vitest run src/api/dashboard.test.ts` → 1 passed (RED first: unresolved `./dashboard`); `npx tsc --noEmit` → clean; scoped `eslint` → clean.
- Review findings and fixes: the interceptor's error branch toasted every failed GET regardless of `noMsg`; added the guard so polling stays silent.
- Deferred items/limitations: the interceptor guard has no unit test (importing antd in node env); covered by the Task 7 manual 404/stale smoke.

### Task 6
- Date/status: 2026-11-14 — complete (automated gates; browser smoke pending user)
- Repository + commit SHA: gost-ui @ (this commit)
- Files changed: `src/App.tsx`, `src/components/Shell/index.tsx`, `src/components/Sidebar/index.tsx`, `src/Pages/Manage.tsx`, `src/Pages/Overview.tsx` (stub), `src/i18n/languages.csv`.
- Tests/commands and results: `npx tsc --noEmit` → clean; scoped `eslint` → 0 errors, 1 pre-existing `exhaustive-deps` warning in `App.tsx`; `npm run build` → ok (i18n regenerated from the CSV, Overview chunk 0.26 kB, Manage 62 kB, antd 999 kB). Browser smoke (Sider ↔ drawer, theme/language/logout/switch server, config reload/save/download) was not executable here: no browser binary is installed.
- Review findings and fixes: none.
- Deferred items/limitations: manual browser smoke is listed in the verification section for the user; `Manage` keeps `useInfo()!` because the shell only mounts it with a session; `Overview` is a temporary `Spin` stub replaced by Task 7; repo lint is red at base (Home.tsx, ModalForm.tsx), so only touched files were linted.

### Task 7
- Date/status: 2026-11-14 — complete (automated gates; browser smoke pending user)
- Repository + commit SHA: gost-ui @ (this commit)
- Files changed: `src/components/Overview/useSnapshot.ts`, `src/components/Overview/Summary.tsx`, `src/Pages/Overview.tsx`, `src/i18n/languages.csv`.
- Tests/commands and results: `npx tsc --noEmit` → clean; scoped `eslint` → clean; `npm run build` → ok (Overview chunk 3.88 kB); generated `zh.json`/`en.json` contain the new `overview.*`/`shell.*`/`nav.*` keys (checked via node). `npx vitest run` unaffected (13 passing).
- Review findings and fixes: none.
- Deferred items/limitations: polling/visibility behavior and the disabled/unauthorized/stale results have no automated test (no jsdom/RTL) and no browser is available here, so the browser smoke from the plan remains with the user.

### Task 8
- Date/status: 2026-11-14 — complete (automated gates; browser smoke pending user)
- Repository + commit SHA: gost-ui @ (this commit)
- Files changed: `src/components/Overview/Services.tsx`, `src/components/Overview/Modules.tsx`, `src/components/Overview/modules.ts`, `src/components/Overview/modules.test.ts`, `src/Pages/Overview.tsx`, `src/i18n/languages.csv`.
- Tests/commands and results: `npx vitest run src/components/Overview/modules.test.ts` → 2 passed (RED first: unresolved `./modules`); `npx tsc --noEmit` → clean; scoped `eslint` → clean; `npm run build` → ok (Overview chunk 8.74 kB); generated i18n contains the new keys.
- Review findings and fixes: unknown module kinds fall back to the raw kind via `defaultValue` instead of showing an i18n key; limiter rows expand only when `stats.limiter` exists.
- Deferred items/limitations: `npm run lint` is red at base, so lint was scoped to touched files; the 320 px horizontal-scroll check waits for the browser smoke (no browser here).

### Task 9
- Date/status:
- Repository + commit SHA:
- Files changed:
- Tests/commands and results:
- Review findings and fixes:
- Deferred items/limitations:

### Task 10
- Date/status:
- Repository + commit SHA:
- Files changed:
- Tests/commands and results:
- Review findings and fixes:
- Deferred items/limitations:
