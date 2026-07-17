# F1TV

A Formula 1 streaming website built with React, TypeScript, and Vite. Watch live F1 races from multiple free servers, track upcoming sessions with live countdowns, view race/sprint/qualifying highlights, and check championship standings.

## Features

- **Live Streaming** — 9 free stream servers with online/offline detection and server switching
- **Session Widget** — Auto-progressing pill showing the current/next session with live countdown
- **Weather** — Real-time track weather (temperature, humidity, wind, rain) during race weekends
- **Highlights** — Race, Sprint, and Qualifying highlights from the official F1 YouTube channel with tab navigation
- **Championship Standings** — Driver and constructor standings with leader card, bar chart, and full table
- **Mobile Responsive** — Fully responsive across all screen sizes
- **Dark Glassmorphism UI** — Modern glass-effect design with smooth animations

## Tech Stack

- **React 19** + TypeScript
- **Vite** (build tool)
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **React Router** (client-side routing)
- **Lucide React** (icons)
- **Geist** font (Google Fonts)

## APIs Used

- [OpenF1](https://openf1.org/) — Session schedules and live weather data
- [Jolpica F1 API](https://api.jolpi.ca/ergast/f1/) — Driver and constructor championship standings
- [YouTube](https://www.youtube.com/@Formula1) — Race, sprint, and qualifying highlights (curated video IDs)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── api/
│   ├── openf1.ts        # Session & weather data with caching and retry logic
│   └── f1Api.ts         # Championship standings from Jolpica API
├── data/
│   └── streamServers.ts # Stream server URLs
├── pages/
│   ├── Home.tsx          # Session widget, weather, quick standings
│   ├── Stream.tsx        # Iframe player with server selector
│   ├── Standings.tsx     # Driver & constructor tabs with charts
│   └── Highlights.tsx    # Race, sprint, qualifying highlight tabs
├── App.tsx               # Router configuration
├── main.tsx              # Entry point
└── index.css             # Tailwind, animations, glass styles
```

## Made by

[Devajuice](https://github.com/Devajuice)
