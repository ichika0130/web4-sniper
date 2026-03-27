# WEB4 SNIPER

**Sniping the Hype. Analyzing the Tech.**

The frontend for Web4 Sniper — an investigative journalism platform that reads the whitepaper so you don't have to. Tracks Web4 projects, scores them for vaporware, and publishes teardowns.

> **Screenshot**
> _Add screenshot here — homepage hero + stats bar recommended_

![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-deploy-0B0D0E?logo=railway&logoColor=white)

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Styling | Tailwind CSS v4 — design tokens defined in `globals.css` via `@theme`, no config file |
| Language | TypeScript 5 |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Rendering | Statically prerendered (SSG) with 5-minute ISR revalidation |
| Output | `standalone` — runs as a Node.js server, Docker-friendly |

---

## Pages

### `/` — Homepage
The brief. Four sections stacked top to bottom:
- **Hero** — headline + Featured Snipe of the Week card (pulled from the most recent article)
- **Stats Bar** — four live counters: projects tracked, avg vaporware score, dead GitHub repos, snipe of the week
- **Recent Crosshairs** — the three latest published teardowns, each with a vaporware score bar color-coded green/amber/red
- **Buzzword Radar** — proportional bars showing the top buzzwords detected across whitepapers this week

### `/radar` — Project Radar
The full intelligence dashboard:
- Summary stat cards (projects monitored, confirmed vaporware, actually shipping)
- Project database table — every tracked project with claimed tech, GitHub status badge (`ACTIVE` / `STALE` / `DEAD`), inline score bar, and verdict badge
- **Funding vs. Code chart** — grouped bar chart comparing $M raised against kLoC shipped; the gap tells the story
- **Vaporware Score Distribution** — horizontal bar chart of all projects sorted by score, bars colored by threshold

### `/crosshairs` — Article Index
Grid of all published teardowns. Each card shows the verdict badge, date, title, vaporware score bar, and one-liner excerpt. Sorted newest-first.

### `/crosshairs/[slug]` — Teardown Detail
Full article in a two-column layout:
- **Main** — article title, author, date, verdict badge, large score bar, section-by-section body, Final Verdict block
- **Sidebar** — Tech Stack Reality Check (what they claim vs. what it actually is), Quick Stats panel

All pages degrade gracefully when the backend API is unreachable — empty states instead of error crashes.

---

## Local Development

### Prerequisites

- Node.js 20+
- The backend API running locally — see [web4-sniper-api](../web4-sniper-api/README.md)

### 1. Clone and install

```bash
git clone <repo-url>
cd web4-sniper
npm install
```

### 2. Configure environment

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

If `NEXT_PUBLIC_API_URL` is not set, the app defaults to `http://localhost:8080` and logs a warning on any failed fetch.

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Hot reload is enabled. The dev server proxies API calls to whatever `NEXT_PUBLIC_API_URL` points at.

### Other commands

```bash
npm run build    # production build — also validates TypeScript
npm run lint     # ESLint
npm start        # serve the production build locally
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:8080` | Base URL of the web4-sniper-api backend. Baked into the client bundle at build time — set this before building for production. |

`NEXT_PUBLIC_` prefix means this value is inlined at build time and shipped to the browser. Set it correctly before running `npm run build` or building the Docker image.

---

## Deployment

### Railway

The repo includes `railway.toml` configured for a Dockerfile build.

1. Add a new service in your Railway project and point it at this directory
2. Set the build argument before deploying:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.railway.app
   ```
3. Railway builds from `Dockerfile` and serves on port 3000

The Docker image uses a two-stage build — Node.js builder compiles the Next.js app, the runner stage copies only the `standalone` output and static assets.

### Vercel

This app also deploys on Vercel with zero config:

```bash
npx vercel --prod
```

Set `NEXT_PUBLIC_API_URL` as an environment variable in the Vercel dashboard before deploying. Vercel's Edge Network handles ISR revalidation natively — the 5-minute cache window in `lib/api.ts` maps directly to its revalidation behavior.

---

## Backend Dependency

This frontend is a thin client. No database, no auth, no server-side business logic — all data comes from **[web4-sniper-api](../web4-sniper-api/README.md)**, the Go backend.

If the API is down, every page falls back to empty arrays and zero stats. No crashes, no 500s — just a very quiet site.

Start the backend before the frontend:

```bash
# In web4-sniper-api/
docker-compose up -d

# Then in web4-sniper/
npm run dev
```

---

## Project Structure

```
web4-sniper/
│
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout: NavBar, footer, scanline overlay
│   ├── globals.css                   # Tailwind v4 design system — all color tokens,
│   │                                 #   @theme, @utility, and component CSS classes
│   ├── page.tsx                      # / — Homepage (hero, stats, articles, buzzwords)
│   ├── loading.tsx                   # Root loading state — "SCANNING..." cursor blink
│   ├── not-found.tsx                 # 404 — "Target not found. It may have rugged."
│   │
│   ├── radar/
│   │   ├── page.tsx                  # /radar — stats + project table + charts
│   │   ├── RadarCharts.tsx           # "use client" — Recharts components (accept data props)
│   │   └── loading.tsx               # Radar loading state
│   │
│   └── crosshairs/
│       ├── page.tsx                  # /crosshairs — article index grid
│       └── [slug]/
│           └── page.tsx              # /crosshairs/[slug] — teardown detail, two-column layout
│
├── components/
│   └── NavBar.tsx                    # "use client" — active route detection, mobile hamburger
│
├── lib/
│   ├── api.ts                        # All API fetch functions + TypeScript types
│   │                                 #   (Project, Article, Stats, Buzzword)
│   └── articles.ts                   # Legacy mock data — kept for reference
│
├── public/                           # Static assets
│
├── .env.local                        # Local env (gitignored) — set NEXT_PUBLIC_API_URL here
├── .dockerignore
├── Dockerfile                        # Two-stage: node:20-alpine builder → slim runner
├── next.config.ts                    # output: "standalone"
├── railway.toml                      # Railway deployment config
├── tsconfig.json
└── package.json
```

### Key design decisions

**Tailwind v4, no config file.** All design tokens (colors, fonts, shadows) are registered via `@theme inline` in `globals.css`. Custom utilities (`glow-green`, `glow-red`) are defined with `@utility`. The terminal-green aesthetic — scanlines, neon glows, monospace type — lives entirely in CSS.

**Server Components by default.** Every page is a React Server Component that `await`s API data directly. The only `"use client"` components are `NavBar` (needs `usePathname`) and `RadarCharts` (Recharts requires a DOM). Data fetched with `{ next: { revalidate: 300 } }` — 5-minute cache, pages stay fresh without going full SSR.

**Graceful degradation.** Every `apiFetch()` call in `lib/api.ts` wraps in try/catch and returns a typed empty fallback on failure. Pages render correctly with zero data — no `undefined` panics, no uncaught promise rejections, no blank screens when the backend is sleeping.
