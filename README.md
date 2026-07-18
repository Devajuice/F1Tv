# F1TV

A Formula 1 streaming and information website built with React, TypeScript, and Vite. Watch live F1 races from multiple free servers, track sessions with weather data, view highlights, standings, race results, and the full season calendar.

## Features

- **Live Streaming** — 9 free stream servers with online/offline detection, server switching, and keyboard shortcuts
- **Live Session Indicator** — Red pulse badge on the F1TV logo when a session is currently in progress
- **Push Notifications** — Browser notifications when a session is about to start or goes live
- **Session Widget** — Auto-progressing pill showing the current/next session with live countdown
- **Weather** — Real-time track weather (temperature, humidity, wind, rain) during race weekends
- **Race Calendar** — Full season schedule with circuit images, local times, countdown to next race, and ICS calendar export
- **Race Results** — Dropdown race selector with finishing order, position changes, team colors, and status
- **Qualifying Results** — Q1/Q2/Q3 breakdown with phase filter and race selector (auto-refreshes every 30s)
- **Starting Grid** — Qualifying-based grid lineup with real track formation (staggered on desktop, single-column on mobile), auto-refreshes every 30s
- **Session Schedule** — Practice, qualifying, sprint, and race times displayed in your local timezone (includes race session)
- **Championship Standings** — Driver and constructor standings with leader card, bar chart, and full table
- **Driver Profiles** — Grid of all drivers with expandable detail cards (team, nationality, age, stats, Wikipedia)
- **Highlights** — Race, Sprint, and Qualifying highlights from the official F1 YouTube channel
- **F1 News** — Live RSS feed from Motorsport.com, Autosport, and The Race
- **PWA Support** — Service worker with caching for offline-capable installation
- **Back to Top** — Floating scroll button for quick navigation
- **Mobile Responsive** — Fully responsive across all screen sizes
- **Dark Glassmorphism UI** — Modern glass-effect design with smooth animations

## Tech Stack

- **React 19** + TypeScript
- **Vite** (build tool)
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **React Router** (client-side routing)
- **Lucide React** (icons)
- **Framer Motion** (animations)
- **date-fns** (date utilities)
- **clsx** (conditional classNames)
- **Geist** font (Google Fonts)

## APIs Used

- [OpenF1](https://openf1.org/) — Session schedules and live weather data
- [Jolpica F1 API](https://api.jolpi.ca/ergast/f1/) — Driver and constructor championship standings, race schedule, race results, qualifying results, grid lineup, practice schedules, and driver profiles
- [RSS2JSON](https://api.rss2json.com/) — RSS-to-JSON proxy for F1 news feeds
- [YouTube](https://www.youtube.com/@Formula1) — Race, sprint, and qualifying highlights (curated video IDs)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

## Project Structure

```
src/
├── api/
│   ├── openf1.ts        # Session schedules and weather data
│   ├── f1Api.ts         # Standings, schedule, race/sprint/qualifying results, grid, driver profiles
│   └── news.ts          # RSS feed fetching via rss2json.com proxy
├── components/
│   ├── Header.tsx        # Responsive nav bar with live session indicator
│   ├── Footer.tsx        # Attribution and disclaimer
│   ├── PageWrapper.tsx   # Animated page transitions
│   └── BackToTop.tsx     # Floating scroll-to-top button
├── hooks/
│   └── useSessionNotifications.ts # Push notifications for session starts
├── data/
│   ├── streamServers.ts  # Stream server URLs
│   └── teams.ts          # Team names and colors
├── pages/
│   ├── Home.tsx          # Session widget, weather, quick standings, upcoming races
│   ├── Stream.tsx        # Iframe player with server selector
│   ├── Standings.tsx     # Driver & constructor tabs with charts
│   ├── Highlights.tsx    # Race, sprint, qualifying highlight tabs
│   ├── RaceCalendar.tsx  # Full season schedule with ICS export
│   ├── RaceResults.tsx   # Race selector with results table
│   ├── QualifyingResults.tsx # Q1/Q2/Q3 results with auto-refresh
│   ├── GridLineup.tsx    # Starting grid from qualifying data
│   ├── PracticeSchedule.tsx # Session times for any race weekend
│   ├── Drivers.tsx       # Driver grid with expandable profile cards
│   ├── News.tsx          # Live F1 news feed
│   └── NotFound.tsx      # 404 page
├── App.tsx               # Router configuration + notifications
├── main.tsx              # Entry point + service worker registration
└── index.css             # Tailwind, animations, glass styles
```

## Keyboard Shortcuts (Stream Page)

| Key | Action |
|-----|--------|
| `S` | Switch server |
| `F` | Toggle fullscreen |
| `P` | Picture-in-Picture |
| `H` | Toggle help overlay |
| `Esc` | Close modals |

## Made by

[Devajuice](https://github.com/Devajuice)
