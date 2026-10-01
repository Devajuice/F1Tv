# F1TV

A Formula 1 streaming and information site built with React, TypeScript and Vite. Watch live sessions from multiple public servers, follow live timing and weather, and dig into the championship, results, grid, news and highlights.

## Features

- **Floating navigation** — a glass nav pill with grouped dropdowns on desktop; on mobile the top bar is dropped entirely in favour of a thumb-reachable icon tab bar floating above the bottom edge
- **Light and dark themes** — a full second palette, not inverted colours: surfaces, text, hairlines and semantic accents are all runtime custom properties, so light mode reads as designed rather than washed out
- **Display preferences** — dark / light / system, and a time-zone mode of *my device* / *at the circuit* / *one fixed zone*, persisted to `localStorage` and applied before first paint so there is no flash of the wrong theme
- **Live streaming** — 9 public stream servers with reachability checks, server switching, a stuck-player watchdog and keyboard shortcuts
- **Live session state** — shared across every page via one OpenF1 session poll, with a progress bar and countdown
- **Opt-in session alerts** — browser notification 5 minutes before a session and again when it goes live, deduped per session
- **Live weather** — air and track temperature, humidity, wind and rainfall for the current session, with a wet-track call
- **Dashboard** — next race countdown, championship snapshot, session queue, weather and recent news on one screen
- **Circuit outlines** — 24 self-hosted track layouts drawn as inline SVG that stroke with `currentColor`, so they inherit the active theme at any size with no image request
- **Race calendar** — full season schedule with circuit outlines, session times, live/finished/upcoming status and `.ics` export
- **Race results** — Grand Prix *and* Sprint classifications, with grid position, positions gained, points and status
- **Qualifying results** — Q1/Q2/Q3 breakdown with a phase filter; only the tab you're viewing is fetched
- **Starting grid** — qualifying order drawn as the staggered two-column track formation, collapsing to a list on mobile
- **Weekend schedule** — every session of an upcoming weekend, shown in the time zone your display preferences select
- **Standings** — driver and constructor tables, selectable by round, with points bars
- **Drivers** — entry list with search, sorting, team livery accents and age
- **Highlights** — race, Sprint and qualifying videos from the official F1 YouTube channel
- **News** — Motorsport.com, Autosport and The Race feeds, filterable by source, aggregated server-side behind a cache so three upstream requests don't fan out to every visitor
- **PWA** — installable manifest, offline page, and a service worker that caches the shell but never caches API or stream responses
- **Per-route code splitting** — every page is a separate lazy chunk

## Tech Stack

- **React 19** + TypeScript
- **Vite 8** (build tool, plus dev and preview servers with `/api/*` proxies and a local YouTube handler)
- **Tailwind CSS v4** (`@tailwindcss/vite`, theme declared in CSS)
- **React Router 7** (client-side routing, lazy routes)
- **Framer Motion** (animations)
- **Lucide React** (icons)
- **clsx** (conditional class names)
- **Geist / Geist Mono / Archivo** (Google Fonts)

Date and number formatting uses the native `Intl` API with module-level cached
formatters, so there's no date library in the bundle.

## Design

Dark, high-contrast broadcast styling: layered near-black surfaces, F1 red as the
single accent, and monospace or tabular numerals for anything a viewer scans or
compares. Chrome is glass rather than solid — a floating pill with a blurred
backdrop and a soft cast shadow, no hard border. On mobile that pill moves to the
bottom and drops its labels, so the primary destinations sit inside thumb reach.

The palette is declared as CSS custom properties in `src/index.css` rather than as
static Tailwind theme values, because the theme has to be switchable at runtime
and applied before React mounts. Tailwind v4's `@theme inline` maps tokens such as
`--color-line` onto the `--pal-*` layer, so switching `data-theme` on `<html>`
repaints the entire app with no re-render. Light mode is a separately specified
set of values, not a filter.

The theme is applied by a small inline script in `index.html` before first paint,
because reading `localStorage` in React is too late to avoid a flash of dark. That
script's exact contents are hashed into the CSP in `vercel.json`
(`script-src 'self' 'sha256-…'`), so **editing it means regenerating the hash**,
or the bootstrap will be blocked and the theme will flash.

## APIs Used

| Source | Used for |
|---|---|
| [OpenF1](https://openf1.org/) | Session schedules, session progress, live weather |
| [Jolpica](https://api.jolpi.ca/ergast/f1/) | Schedule, standings, race/Sprint/qualifying results, grid, weekend sessions, driver list |
| [RSS2JSON](https://api.rss2json.com/) | RSS-to-JSON proxy for the news feeds |
| [YouTube Data API](https://developers.google.com/youtube/) | Highlights, via the `api/youtube.js` serverless function |

`openf1` and `jolpica` are reached through the same-origin `/api/*` paths so the
browser never makes a cross-origin request; `vercel.json` proxies them.

### Environment

The only secret is the YouTube key, read by `api/youtube.js` on the server:

```bash
YOUTUBE_API_KEY=your_key_here
```

It has no `VITE_` prefix, so it is never bundled into the client. Set the same
variable in the Vercel project's environment for production.

`/api/youtube` and `/api/news` are Vercel serverless functions, which `vite` does
not run. Rather than keep a stub that always returned zero videos — which made
Highlights look broken locally while working in production — `vite.config.ts`
mounts the *real* handlers behind a small middleware shim in both `npm run dev`
and `npm run preview`, reading the key from `.env`. Local and production share
one code path.

The shim covers the `status` / `json` / `setHeader` subset of the Vercel request
and response objects, and it collects handler headers so `Cache-Control` set
inside a function still reaches the browser. Each handler is also wrapped in a
guard: Vite's connect middleware does not isolate async handlers, so without one a
single failing request took the whole dev server down instead of returning a 500.

Without a valid key the request rejects with a descriptive error and the page
renders an `ErrorState` with retry, instead of an empty grid that looked like
"no videos published yet". Everything else talks to public, key-free endpoints.

## Getting Started

```bash
npm install     # install dependencies
npm run dev     # dev server with API proxies
npm run build   # typecheck, then production build
npm run lint    # oxlint
npm run preview # serve the production build, with the same API proxies
```

## Project Structure

```
api/
├── news.js              # Vercel serverless function: RSS2JSON aggregation + edge cache
└── youtube.js           # Vercel serverless function: highlight queries (reads YOUTUBE_API_KEY)

public/
├── tracks/              # 24 circuit layouts (upstream SVGs, kept for provenance)
│   └── CREDITS.md       # source, licence and per-layout provenance
└── sw.js                # service worker: shell + immutable assets only

src/
├── api/
│   ├── openf1.ts        # sessions, progress, weather, fallbacks + retry on 429
│   ├── f1Api.ts         # Jolpica: unwraps the MRData envelope, shared request cache,
│   │                    #   in-flight dedupe, per-endpoint TTL
│   ├── news.ts          # calls /api/news, with cache and stale fallback
│   └── youtube.ts       # highlight queries + two-season fallback, bounded cache
├── components/
│   ├── ui/              # design-system primitives (Button, Panel, Table, Tabs, Modal, …)
│   │   └── TrackMap.tsx # inline circuit outline, viewBox applied here
│   ├── Header.tsx       # floating glass nav pill, grouped dropdowns, live ticker,
│   │                    #   and a bottom tab bar with theme toggle on mobile
│   ├── SettingsPanel.tsx# theme and time-zone preferences
│   ├── Footer.tsx
│   ├── Layout.tsx       # page shell + immersive full-bleed shell for /stream
│   ├── BackToTop.tsx
│   └── RouteFallback.tsx
├── context/
│   ├── ThemeContext.tsx       # dark/light/system, persisted, pre-paint bootstrap
│   ├── TimeZoneContext.tsx    # local/circuit/custom zone resolution
│   ├── SessionContext.tsx     # one session poll shared by the whole app
│   └── NotificationsContext.tsx
├── hooks/
│   ├── useAsync.ts       # polling, refresh, cancellation, staleness
│   └── useDocumentTitle.ts
├── data/
│   ├── teams.ts         # canonical constructor registry (colours, aliases)
│   ├── sessions.ts      # session badges, colours, weekend order
│   ├── tracks.ts        # circuit registry: ids, aliases, time zones, path loaders
│   ├── trackPaths.ts    # lazy dispatcher
│   ├── trackPaths/      # one module per layout, lazily imported
│   └── streamServers.ts
├── lib/
│   ├── format.ts        # Intl-backed date, number, flag and name formatters
│   ├── races.ts         # race status and schedule selectors
│   └── cn.ts
├── App.tsx              # provider composition + lazy route table
├── main.tsx             # entry, service worker registration
├── pages/               # one lazily-loaded chunk per route
└── index.css            # --pal-* token layer, Tailwind theme, design system
```

### Conventions

- **One data source per topic.** Team colours, session labels, flags and date
  formatting used to be duplicated across pages; they now live in `src/data`
  and `src/lib`.
- **Errors are shown, not swallowed.** API helpers reject, and pages render an
  `ErrorState` with a retry instead of an empty table.
- **Fetch only what is visible.** Lazily-loaded routes, tab-scoped requests, and
  a request cache with in-flight de-duplication so four pages asking for the
  schedule make one request.
- **Times are always converted, never assumed.** Formatting goes through
  `TimeZoneContext`, so the same session renders in your device's zone, the zone
  the circuit physically sits in, or one fixed zone you choose. Callers pass the
  circuit and let `resolve()` decide rather than reaching for the device zone.
- **Strict by default.** `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`
  and `noUnusedParameters` are all on, so indexing an array or a record is a
  compile error rather than a runtime `undefined`.
- **View counts ignore the device locale.** `Intl` compact notation follows it, so
  1,500,000 renders as `15L` under `en-IN` (lakh), `15 लाख` under `hi-IN` and
  `1,5 Mio.` under `de-DE`. `formatCompact` hand-rolls K/M/B so a count reads the
  same everywhere.
- **Every Jolpica response is unwrapped once.** The API nests everything under an
  `MRData` key; `request()` strips it before caching, so no caller can forget and
  silently get empty tables.

## Keyboard Shortcuts (Stream page)

| Key | Action |
|-----|--------|
| `S` | Open the server picker |
| `N` | Jump to the next server |
| `F` | Toggle fullscreen |
| `P` | Request picture-in-picture |
| `H` | Toggle the shortcut panel |
| `Esc` | Close a panel |

## Deployment

`vercel.json` carries three things worth knowing about, since each one fails
quietly rather than loudly:

- **Rewrites.** `/api/openf1/*` and `/api/jolpica/*` proxy upstream, and
  `/((?!api/).*)` sends everything else to `index.html` for client-side routing.
  The negative lookahead is what keeps `/api/*` from being swallowed by the SPA
  fallback and rewritten to HTML.
- **Headers.** `headers` entries take `source` and `headers` only — a
  `destination` key is rejected by the schema and fails the build. `destination`
  belongs to `rewrites` only. Hashed build assets are immutable for a year, the
  circuit SVGs a week, `/api/news` five minutes with stale-while-revalidate.
- **CSP.** `script-src` is `'self'` plus the `sha256` of the theme bootstrap in
  `index.html`. Nothing else may be inline.

## Note

Stream servers are third-party public embeds and go down without notice; the
reachability dots are a hint, not a guarantee. This project is not affiliated
with, endorsed by, or connected to Formula 1, the FIA or FOM.

Circuit outlines in `public/tracks/` are derived from
[f1-circuits-svg](https://github.com/julesr0y/f1-circuits-svg) by ROY Jules,
used under CC-BY-4.0. See `public/tracks/CREDITS.md` for what was changed and
why.

## Made by

[Devajuice](https://github.com/Devajuice)
