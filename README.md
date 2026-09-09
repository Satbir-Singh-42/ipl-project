# IPL Player Auction Dashboard

A production-grade, multi-tenant web application for running and managing a private Indian Premier League player auction. It combines a live bidding screen, real-time team/player dashboards, an admin panel, and tournament-room management — all backed by **Supabase** for data persistence and realtime sync.

Built by ISTE for the IPL 2025 Mega Auction.

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Multi-Tournament Rooms](#multi-tournament-rooms)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Routes](#routes)
- [Auction Experience](#auction-experience)
- [Admin Panel](#admin-panel)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Overview

The IPL 2025 Player Auction Dashboard lets an auctioneer, organizers, and viewers manage and watch a franchise auction in real time. Administrators can create tournament "rooms", register teams, import players, run the auction, and track budgets — while the public dashboard shows live team cards, sold/unsold player pools, a leaderboard, and Playing XI selection.

Every tournament room is fully isolated (multi-tenancy), so a single deployment can host multiple independent auctions.

---

## Core Features

### Public Dashboard
- **Team Overview** — Team cards showing remaining funds, squad size, and overseas player counts, ranked by performance.
- **Auction Players** — Searchable, sortable table of all players currently in the auction pool.
- **Sold Players** — Filterable list of purchased players with team assignment, final price, and points.
- **Leaderboard** — Live team rankings sorted by points, remaining budget, and name.
- **Guidelines** — Configurable tournament rules and squad requirements rendered from the DB.
- **Team Dashboards** — Per-team detail pages with rosters and Playing XI.
- **Playing XI Selection** — Interactive, validated selection with CSV export and a visual cricket-field formation.

### Auction Management (`/auction`)
- **Live Player Cards** — Browse players with stats, images, base price, and live bid tracker.
- **Bidding** — Increment bids via buttons; on mobile (≤768px) tap-to-increment is enabled.
- **Sold / Unsold** — One-click actions with confetti on sale and an "UNSOLD" stamp on skips.
- **Keyboard Shortcuts** — `R` undo, `S` sold, `U` unsold, `←/→` navigate, `Escape` close, `Space/Enter` increment bid.
- **Touch Gestures** — Swipe left/right to move between players on mobile.
- **Undo** — Revert the last action safely (logged in the DB for audit).

### Admin Panel (`/admin`)
- **Tournaments / Rooms** — Create, clone, lock, and manage tournament rooms with password protection.
- **Players** — CRUD, bulk CSV import, image upload, and role normalization.
- **Teams** — CRUD with branding (logo, colors, gradient) and budget.
- **Pools / Sets** — Organize players into auction sets, auto-group by role, reorder, and manage unsold pools.
- **Leaderboard & Export** — View standings and export CSV reports.

### Accounts, Sign-Up & Room Hosting
- **Create an account** (`/signup`) — Public sign-up with username, email, and password (Supabase Auth-backed, plus a `users_meta` profile row with the `organizer` role).
- **Sign in** (`/login`) — Email/password, master admin (`admin`), or room admin credentials (`room code` + admin password).
- **Gated room creation** — Visiting `/create` requires a signed-in account. Guests see a sign-up/login gate before the room form.
- **Ownership** — Rooms are stamped with the creator's `auth_id` in `tournaments.created_by` (server-set from the session, not client-supplied). RLS enforces that only the creator or an `admin` can update/delete their rooms; anonymous users can't create at all.
- **Access model** — Anonymous visitors can view public rooms and join private rooms with the room password. The room's **creator can run its auction** (`/room/:code/auction`) and manage its credentials (public/private, room password, admin password); full CRUD admin pages stay admin-only.

### Realtime & Persistence
- **Supabase Realtime** — Tables are subscribed so dashboards and the auction stay in sync across devices.
- **Row-Level Security** — Public read, authenticated writes, enforced at the database.
- **TanStack Query** — Caching and background refetching with configurable intervals.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React 18 + Vite                         │
│         Wouter routing · Framer Motion · Tailwind CSS           │
└───────────────┬─────────────────────────────────────────────────┘
                │  @supabase/supabase-js
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase (PostgreSQL)                   │
│  tournaments · players · teams · pools · auction_log            │
│  auction_settings · playing_xi · users_meta                    │
│  Realtime replication · Row-Level Security · Storage buckets    │
└─────────────────────────────────────────────────────────────────┘
```

- **Frontend only** — no custom backend server. All persistence and realtime run through Supabase.
- **Service layer** — `client/src/services/supabaseService.ts` centralizes all database access and converts raw rows into typed domain models.
- **Realtime tables** — `tournaments`, `players`, `teams`, `pools`, and `auction_settings` are added to the `supabase_realtime` publication so the UI updates live.

---

## Multi-Tournament Rooms

Each tournament is an isolated room with its own data and a shareable URL.

- **Room URL patterns**
  - `/room/:roomCode` — public dashboard
  - `/room/:roomCode/auction` — admin auction (password protected)
  - `/t/:roomCode` — shortcut alias
- Rooms can be **public**, **private (password protected)**, or **locked** by the admin.
- Data is scoped everywhere by `tournament_id`, and the active room is tracked in URL + context + local storage.
- The landing page (`/`) is a marketing/advertising page with a hero, features, and CTAs:
  - **Create a room** → `/create` (dedicated room-creation module)
  - **Explore live rooms** → `/tournaments` (dedicated room-listing page with stats, privacy badges, and enter/auction actions)
- A **Privacy Policy** (`/privacy-policy`) and **Terms & Conditions** (`/terms`) page are linked from every page footer.

---

## Getting Started

### Prerequisites

- **Node.js 18+** (Node 20 + recommended)
- **npm**
- A Supabase project (free tier is sufficient)

### 1. Clone & Install

```bash
git clone <repository-url>
cd IPL_Auction_2025
npm install
```

### 2. Configure Supabase

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

> Get these from the Supabase dashboard: **Project Settings → API**.

### 3. Apply the Database Schema

Open the **SQL Editor** in your Supabase project, paste the contents of
[`supabase-schema.sql`](./supabase-schema.sql), and run it. This creates all tables,
indexes, triggers, RLS policies, realtime subscriptions, storage buckets, and seeds the
default IPL 2025 tournament with 12 teams.

### 4. Run the App

```bash
npm run dev
```

Open `http://localhost:5173` (Vite default). Navigate to `/room/IPL2025` to enter the
default seeded tournament, or use the landing page.

> The default room runs under room code `IPL2025` (admin password `admin123`). Change
> these for production.

---

## Environment Variables

| Variable                  | Required | Description                                          |
| ------------------------- | -------- | ---------------------------------------------------- |
| `VITE_SUPABASE_URL`       | ✅       | Your Supabase project URL                            |
| `VITE_SUPABASE_ANON_KEY`  | ✅       | Your Supabase public (anon) API key                  |

Vite exposes only variables prefixed with `VITE_` to the client (`import.meta.env.VITE_*`).
If credentials are missing, the app logs a warning and continues in a degraded state rather
than crashing.

---

## Database Schema

The full schema lives in [`supabase-schema.sql`](./supabase-schema.sql). Summary:

| Table              | Purpose                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `tournaments`      | Multi-tenant rooms: name, slug, room code, passwords, settings, `created_by` (owner auth id) |
| `pools`            | Auction sets/rounds per tournament                                 |
| `players`          | Player catalogue with stats, role, base price, status, sold info   |
| `teams`            | Franchises with branding (logo, colors) and starting budget        |
| `auction_log`      | Immutable audit trail of every sold/unsold/undo action             |
| `auction_settings` | Squad rules, multipliers, budgets, bid increments (one per room)   |
| `playing_xi`       | Saved Playing XI selections per team                               |
| `users_meta`       | Profiles for `admin` and `organizer` accounts (Supabase Auth id, username, role) |

**Status model:** a player's lifecycle is `pending → sold` or `pending → unsold`, with
`undo` returning them to `pending`.

---

## Project Structure

```
IPL_Auction_2025/
├── client/                          # React frontend (Vite)
│   ├── index.html                   # HTML entry + meta tags
│   ├── public/                      # Static assets
│   │   └── images/                  # Team logos, auction backgrounds
│   └── src/
│       ├── App.tsx                  # Routing (Wouter) + providers
│       ├── main.tsx                 # React entry point
│       ├── index.css                # Global styles & Tailwind
│       ├── components/              # Reusable UI
│       │   ├── ui/                  # shadcn/ui primitives
│       │   ├── PlayerTable.tsx      # Sortable/filterable player tables
│       │   ├── LeaderboardView.tsx  # Live standings
│       │   ├── GuidelinesView.tsx   # Rules renderer
│       │   ├── RoomAccessGuard.tsx  # Room password guard
│       │   └── ProtectedRoute.tsx   # Admin route guard
│       ├── config/teamBranding.ts   # Team logos & colors
│       ├── contexts/                # Auth, Tournament (active room)
│       ├── hooks/                   # useIPLData, useAuctionRules, use-toast
│       ├── lib/                     # supabase client, queryClient, utils
│       ├── pages/                   # Page components
│       │   ├── LandingPage.tsx      # Marketing landing (hero, features, CTAs)
│       │   ├── TournamentsPage.tsx  # Room listing / lobby (`/tournaments`)
│       │   ├── CreateRoomPage.tsx   # Auth-gated room creation (`/create`)
│       │   ├── LegalPage.tsx        # Privacy policy & terms pages
│       │   ├── LoginPage.tsx        # Sign in
│       │   ├── SignUpPage.tsx       # Create an account
│       │   ├── AuctionPage.tsx      # Live auction management
│       │   ├── ElementLight.tsx     # Main public dashboard
│       │   ├── TeamDashboard.tsx    # Per-team detail
│       │   ├── TeamsListing.tsx     # All teams grid
│       │   ├── PlayingXI.tsx        # Playing XI selection
│       │   ├── sections/            # Tab content (overview, sold, etc.)
│       │   └── admin/               # Admin CRUD pages
│       └── services/
│           ├── supabaseService.ts   # All DB access + mapping
│           └── auctionRules.ts      # Rules read/write + realtime
├── shared/
│   └── config.ts                    # Central app/auction configuration
├── supabase-schema.sql              # Database schema, RLS, seeds
├── .env.example                     # Env var template
├── vercel.json                      # SPA rewrite config
├── package.json                     # Scripts & dependencies
├── tailwind.config.ts               # Tailwind theme
├── tsconfig.json                    # TypeScript config
└── vite.config.ts                   # Build config
```

---

## Routes

| Path                          | Access    | Description                            |
| ----------------------------- | --------- | -------------------------------------- |
| `/` · `/landing` · `/portal`  | Public    | Landing / room listing                 |
| `/room/:roomCode`             | Public*   | Room public dashboard                  |
| `/room/:roomCode/auction`     | Admin     | Room auction screen                    |
| `/room/:roomCode/leaderboard` | Public    | Room leaderboard                       |
| `/t/:roomCode`                | Public    | Room alias                             |
| `/dashboard` · `/overview`    | Public    | Active-room dashboard                  |
| `/leaderboard`                | Public    | Leaderboard view                       |
| `/team`                       | Public    | All teams grid                         |
| `/team/:teamId`               | Public    | Team dashboard                         |
| `/team/:teamId/playing-xi`    | Public    | Playing XI selection                   |
| `/auction`                    | Admin     | Auction management                     |
| `/admin`                      | Admin     | Admin dashboard                        |
| `/admin/tournaments` · `rooms`| Admin     | Room management                        |
| `/admin/players`              | Admin     | Player CRUD + import                   |
| `/admin/teams`                | Admin     | Team CRUD                              |
| `/admin/pools`                | Admin     | Sets / pools management                |
| `/admin/leaderboard`          | Admin     | Standings                              |
| `/admin/export`               | Admin     | CSV export                             |
| `/login`                      | Public    | Admin sign-in                          |
| `/signup`                     | Public    | Create an account (room hosting)       |
| `/create` · `/create-room`    | Auth      | Create a new tournament room           |

\* Private rooms require a password via `RoomAccessGuard`.

---

## Auction Experience

The auction screen is the heart of the app, designed for one operator running it live:

1. **Navigate** players with buttons, keyboard (`←`/`→`), or swipe gestures.
2. **Bid** by incrementing the current price.
3. **Sell** (`S`) → marks player sold to the selected team, logs to `auction_log`, confirms with confetti.
4. **Skip** (`U`) → marks player unsold with an animated stamp.
5. **Undo** (`R`) → reverses the last action and removes the audit entry.
6. Data syncs to Supabase in real time so viewers see the outcome instantly.

All actions are recorded in `auction_log` for audit and replay.

---

## Admin Panel

The admin area (`/admin`) is protected and requires an `admin` role from `users_meta`
(or the custom admin session). Key workflows:

- **Set up a room** — create a tournament, set passwords, clone a template structure.
- **Register teams** — add franchises with logos and budgets.
- **Import players** — bulk CSV import with automatic role normalization, or add manually.
- **Organize pools** — auto-group by role or arrange players into rounds/sets.
- **Run the auction** — launch the auction screen for the room.
- **Export** — download player, sold-player, and team-summary CSVs.

---

## Configuration

Centralized in [`shared/config.ts`](./shared/config.ts):

- `AUCTION_CONFIG` — squad limits, overseas cap, playoff threshold, bid increment, base price.
- `PLAYING_XI_CONFIG` — XI size, role minimums/maximums, overseas limit, captain multipliers.

Many of these values can also be overridden per tournament in the database
(`auction_settings`), which takes precedence at runtime via `useAuctionRules`.

### Adding / Changing Team Branding

1. Place the logo in `client/public/images/teams/` (`.jpg`, `.png`, `.webp`, `.jpeg`; 1:1 recommended).
2. Add/update the entry in `client/src/config/teamBranding.ts`:

```typescript
"Team Name": {
  logo: "/images/teams/team-name.png",
  borderColor: "border-[#HEXCOLOR]",
  bgGradient: "bg-[linear-gradient(135deg,rgba(...))]",
},
```

Team branding stored in the `teams` table overrides these defaults automatically.

---

## Development

### Scripts

```bash
npm run dev       # Start Vite dev server with HMR
npm run check     # Run TypeScript type checking (tsc)
npm run build     # Build production bundle to dist/
npm run preview   # Serve the production build locally
```

### Code Style

- **TypeScript** in strict mode; domain models are defined and reused from the service layer.
- **React** functional components + hooks; small, focused components.
- **Styling** — Tailwind CSS with shadcn/ui primitives; use `cn()` for conditional classes; mobile-first.
- **Data** — all persistence via `supabaseService`; server state via TanStack Query; realtime via Supabase subscriptions.
- **Layout** — feature-based pages under `client/src/pages/`, reusable UI in `components/`, config in `shared/`.

---

## Deployment

This is a static frontend; any static host works. The repo ships a `vercel.json` SPA
rewrite for clean client-side routing.

### Vercel (recommended)

```bash
npm i -g vercel
vercel
```

Push to `main` for production; PRs get preview deployments.

### Netlify

- **Build command:** `npm run build`
- **Publish directory:** `dist`

### Generic static hosting

Build once and serve `dist/`, ensuring all unknown routes rewrite to `index.html` so
Wouter routing works (see `vercel.json`).

> Don't forget to set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your hosting
> provider's environment before building.

---

## Troubleshooting

| Symptom                                        | Fix                                                             |
| ---------------------------------------------- | --------------------------------------------------------------- |
| Data doesn't load                              | Confirm Supabase credentials/env are set and the schema is applied |
| Room can't be entered                          | Check room passwords; running seeded room uses `admin123`        |
| Live updates not appearing                     | Ensure tables are in the realtime publication (see schema)       |
| Uploads fail                                   | Verify storage buckets (`player-images`, `team-logos`) exist     |
| Routes 404 after deploy                        | Configure SPA rewrite to `index.html`                            |
| Illegal `available` status error               | Use `pending` — `available` is not a valid DB status             |

---

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Make changes following the code style above; run `npm run check`.
4. Commit with a clear message and open a pull request.

---

## License

This project is licensed under the MIT License.

## Acknowledgments

- **ISTE** — branding, logo, and the vision behind the dashboard.
- **IPL** — the incredible cricket league this tool supports.
- The open-source community — React, Vite, Tailwind CSS, shadcn/ui, Framer Motion, TanStack Query, and the Supabase team.
