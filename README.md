# F1TV

A Formula 1 streaming and information site built with React, TypeScript and Vite. Watch live sessions from multiple public servers, follow live timing and weather, and dig into the championship, results, grid, news and highlights.

## Features

- **Floating navigation** — a glass nav pill with grouped dropdowns on desktop; on mobile the top bar is dropped entirely in favour of a thumb-reachable icon tab bar floating above the bottom edge
- **Live streaming** — 9 public stream servers with reachability checks, server switching, a stuck-player watchdog and keyboard shortcuts
- **Live session state** — shared across every page via one OpenF1 session poll, with a progress bar and countdown
- **Opt-in session alerts** — browser notification 5 minutes before a session and again when it goes live, deduped per session
- **Live weather** — air and track temperature, humidity, wind and rainfall for the current session, with a wet-track call
- **Dashboard** — next race countdown, championship snapshot, session queue, weather and recent news on one screen
- **Race calendar** — full season schedule with circuit imagery, local times, live/finished/upcoming status and `.ics` export
- **Race results** — Grand Prix *and* Sprint classifications, with grid position, positions gained, points and status
- **Qualifying results** — Q1/Q2/Q3 breakdown with a phase filter; only the tab you're viewing is fetched
- **Starting grid** — qualifying order drawn as the staggered two-column track formation, collapsing to a list on mobile
- **Weekend schedule** — every session of an upcoming weekend in your local timezone
- **Standings** — driver and constructor tables, selectable by round, with points bars
- **Drivers** — entry list with search, sorting, team livery accents and age
- **Highlights** — race, Sprint and qualifying videos from the official F1 YouTube channel
- **News** — Motorsport.com, Autosport and The Race feeds, filterable by source
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

## APIs Used

| Source | Used for |
|---|---|
| [OpenF1](https://openf1.org/) | Session schedules, session progress, live weather |
| [Jolpica](https://api.jolpi.ca/ergast/f1/) | Schedule, standings, race/Sprint/qualifying results, grid, weekend sessions, driver list |
| [RSS2JSON](https://api.rss2json.com/) | RSS-to-JSON proxy for the news feeds |
| [YouTube Data API](https://developers.google.com/youtube/) | Highlights, via the `api/youtube.js` serverless function |

### Environment

The only secret is the YouTube key, read by `api/youtube.js` on the server:

```bash
YOUTUBE_API_KEY=your_key_here
```

It has no `VITE_` prefix, so it is never bundled into the client. Set the same
variable in the Vercel project's environment for production.

`/api/youtube` is a Vercel serverless function, which `vite` does not run. Rather
than keep a stub that always returned zero videos — which made Highlights look
broken locally while working in production — `vite.config.ts` mounts the *real*
handler behind a small middleware shim in both `npm run dev` and `npm run preview`,
reading the key from `.env`. Local and production share one code path.

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
└── youtube.js           # Vercel serverless function: highlight queries (reads YOUTUBE_API_KEY)

src/
├── api/
│   ├── openf1.ts        # sessions, progress, weather, fallbacks + retry on 429
│   ├── f1Api.ts         # Jolpica: unwraps the MRData envelope, shared request cache,
│   │                    #   in-flight dedupe, per-endpoint TTL
│   ├── news.ts          # RSS2JSON feeds
│   └── youtube.ts       # highlight queries + 15-minute localStorage cache
├── components/
│   ├── ui/              # design-system primitives (Button, Panel, Table, Tabs, Modal, …)
│   ├── Header.tsx       # floating glass nav pill, grouped dropdowns, live ticker,
│   │                    #   and a bottom tab bar on mobile
│   ├── Footer.tsx
│   ├── Layout.tsx       # page shell + immersive full-bleed shell for /stream
│   ├── BackToTop.tsx
│   └── RouteFallback.tsx
├── context/
│   ├── SessionContext.tsx      # one session poll shared by the whole app
│   └── NotificationsContext.tsx
├── hooks/
│   ├── useAsync.ts       # polling, refresh, cancellation, staleness
│   └── useDocumentTitle.ts
├── data/
│   ├── teams.ts         # canonical constructor registry (colours, aliases)
│   ├── sessions.ts      # session badges, colours, weekend order
│   ├── tracks.ts        # circuit imagery
│   └── streamServers.ts
├── lib/
│   ├── format.ts        # Intl-backed date, number, flag and name formatters
│   ├── races.ts         # race status and schedule selectors
│   └── cn.ts
├── pages/               # one lazily-loaded chunk per route
└── index.css            # Tailwind theme + design system
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
- **Times are always converted to the viewer's local timezone.**
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

## Note

Stream servers are third-party public embeds and go down without notice; the
reachability dots are a hint, not a guarantee. This project is not affiliated
with, endorsed by, or connected to Formula 1, the FIA or FOM.

## Made by

[Devajuice](https://github.com/Devajuice)
