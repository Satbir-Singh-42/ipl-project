# 🏏 IPL Auction 2025 — System Structure Document

## 📸 What I Can See From Your Sheets

Based on your screenshots, here is the **exact current data and structure**:

### Sheet 1: Players Catalogue
| Column | Value Example |
|--------|---------------|
| Sr No. | 1, 2, 3... |
| Player Name | Jasprit Bumrah, Shubman Gill... |
| Age | 31, 26, 26... |
| Country | India, Afghanistan, Australia... |
| T20 Matches | 250, 170, 120... |
| Runs | NA, 5305, NA... |
| Batting SR | NA, 140.3, NA... |
| Wickets | 322, NA, 160... |
| Economy | 7.4, NA, 7.5... |
| Evaluation Points | 89, 86, 87... |
| Base Price | ₹400,000 (all same) |
| Role | Bowler / Batsman / All Rounder / Wicket Keeper |
| Images | URL to ipl20.com headshots |

### Sheet 2: Auctioneer Sheet ← **THE KEY PROBLEM SHEET**
| Column | Value Example |
|--------|---------------|
| # | 1, 2, 3... |
| Player Name | Jasprit Bumrah... |
| Role | Bowler, Batsman... |
| Nation | India, Afghanistan... |
| Age | 31, 26... |
| Base Price (₹) | ₹400,000 |
| **Final Bid Price** | ← **MANUALLY TYPED during auction** |
| **Bought By (Team Name)** | ← **MANUALLY SELECTED dropdown during auction** |
| Points | 89, 86, 87... |
| **Status** | ❌ Unsold ← **MANUALLY UPDATED** |

### Sheet 3: Team View
- Dropdown to filter by team (Mumbai Indians shown)
- Dropdown for Role filter
- Dropdown for Team Squad filter
- Shows: Player Name, Nation, Age, Base Price, Final Bid Price, Points, Status, Role

### Sheet 4: Leaderboard
| Column | Current Value |
|--------|---------------|
| Rank | 1–12 (auto) |
| Team Name | 12 teams |
| Total Spent | ₹0 (auction not started) |
| Remaining Budget | ₹10,000,000 (₹1 Crore each) |
| Total Player | 0 |
| Total Team Points | 0 |

### Sheet 5: Teams & Budget ← **MOST IMPORTANT**
| Column | Value |
|--------|-------|
| Team Name | 12 teams |
| Starting Budget | ₹10,000,000 (₹1 Crore) |
| Total Spent | ₹0 (formula: auto-calculates) |
| Remaining Budget | ₹10,000,000 (formula: auto-calculates) |
| Total Player | 0 (formula) |
| Foreign Players | 0 (formula) |
| Total Team Points | 0 (formula) |
| Playing XI Points | "Not yet stated" |

### Your 12 Teams
1. Sunrisers Hyderabad
2. Chennai Super Kings
3. Rajasthan Royals
4. Delhi Capitals
5. Punjab Kings
6. Indore Titans
7. Lucknow Giants
8. Royal Challengers Bengaluru
9. Goa Gladiators
10. Gujarat Titans
11. Kolkata Night Riders
12. Mumbai Indians

---

## 🔴 The Exact Problem (Now Crystal Clear)

```
DURING LIVE AUCTION TODAY:
─────────────────────────────────────────────────

Auctioneer calls "Virat Kohli, base ₹4L, bidding starts!"
       │
       ▼
Bid goes up → ₹15,00,000 → Team: Royal Challengers Bengaluru
       │
       ▼
  AUCTIONEER must MANUALLY:
  1. Open Google Sheet (different tab)
  2. Find Virat Kohli row
  3. Type ₹15,00,000 in "Final Bid Price" cell
  4. Select "Royal Challengers Bengaluru" from dropdown
  5. Change Status from ❌Unsold to ✅Sold
  6. Switch back to auction screen
       │
       ▼
  Website picks up change every 5 seconds (CSV refresh)
       │
       ▼
  DELAY: Up to 5-10 seconds for viewers to see the update

── THIS IS SLOW, ERROR-PRONE, AND MANUAL ──
```

```
WHAT WE WANT:
─────────────────────────────────────────────────

Auctioneer calls "Virat Kohli, base ₹4L, bidding starts!"
       │
       ▼
Bid goes up → Auctioneer taps [+₹1L] button on website
       │
       ▼
Final bid: ₹15,00,000 → Auctioneer taps [SOLD]
       │
       ▼
Popup: "Select buying team" → Auctioneer taps [RCB]
       │
       ▼
Database saves INSTANTLY → All 12 team managers see it NOW
       │
       ▼
RCB budget auto-deducts → Leaderboard updates → Done.

── FAST, CLEAN, AUTOMATIC ──
```

---

## 👥 Who Uses This System — 3 Roles

---

### 👑 Role 1: Super Admin (You)
**When**: Before event to set up, after to review  
**Access**: Full admin panel — everything  

| What They Can Do | How |
|------------------|-----|
| Add / edit / delete players | Admin panel form |
| Add / edit teams & budgets | Admin panel form |
| Import players from Google Sheet | Paste sheet URL → 1-click import |
| Set auction rules (bid increment, max players) | Admin panel settings |
| Reset entire auction | Big red button |
| View full auction log | Table with timestamps |
| Export final results | CSV download |
| Create auctioneer login | Set username + password |

---

### 🎙️ Role 2: Auctioneer (1 person during the event)
**When**: During the live auction only  
**Access**: Only the auction screen — nothing else  

> This person replaces the manual Google Sheet editing.

| What They Can Do | What Happens |
|------------------|-------------|
| Pick next player from list | Player card shows on screen |
| Tap [+₹1L] to raise bid | Current bid updates live on all screens |
| Tap [SOLD] | Popup: pick the team → Saves to DB instantly |
| Tap [UNSOLD] | Player marked unsold → Saves to DB instantly |
| Tap [UNDO] | Reverts last action |
| Swipe/arrow to navigate | Move to next/previous player |

---

### 👥 Role 3: Public Viewers (Team Managers + Spectators)
**When**: During and after the event  
**Access**: Read-only, no login needed  

| Page | What They See |
|------|---------------|
| 🏠 Home | 12 team cards, live budget, player count, rank |
| 📋 Sold Players | All purchased players, who bought them, for how much |
| 🔴 Unsold Players | Remaining available players |
| 🏆 Leaderboard | 12 teams ranked by points & budget |
| 👤 Team Dashboard | Click team → see their squad |
| 📝 Playing XI | Each team picks their best 11 |
| 📖 Guidelines | Rules |

---

## 📐 All Screens in the System

```
╔══════════════════════════╗  ╔══════════════════════╗  ╔═══════════════════════════╗
║   PUBLIC (no login)      ║  ║  AUCTIONEER LOGIN    ║  ║     ADMIN LOGIN           ║
╠══════════════════════════╣  ╠══════════════════════╣  ╠═══════════════════════════╣
║ /          → Home        ║  ║ /auction             ║  ║ /admin         → Dashboard║
║ /team      → All Teams   ║  ║  ├─ Player card       ║  ║ /admin/players → Add/Edit ║
║ /team/:id  → Team page   ║  ║  ├─ Current bid       ║  ║ /admin/teams   → Budgets  ║
║ /team/:id/xi → Playing XI║  ║  ├─ [+₹1L] button    ║  ║ /admin/import  → From Sheet║
║ /leaderboard             ║  ║  ├─ [SOLD] button     ║  ║ /admin/config  → Rules    ║
║ /guidelines              ║  ║  ├─ [UNSOLD] button   ║  ║ /admin/results → Export   ║
║ /login     → Login page  ║  ║  └─ [UNDO] button     ║  ║ /admin/log     → Audit Log║
╚══════════════════════════╝  ╚══════════════════════╝  ╚═══════════════════════════╝
```

---

## 🗄️ Database Schema (Matches Your Sheets Exactly)

```
┌─────────────────────────────────────────────────────────────┐
│                        players                              │
├────────────────┬────────────────────────────────────────────┤
│ id             │ Auto-generated                             │
│ sr_no          │ 1, 2, 3... (from your sheet)              │
│ name           │ "Jasprit Bumrah"                          │
│ age            │ 31                                         │
│ country        │ "India"                                   │
│ t20_matches    │ 250                                        │
│ runs           │ null (NA in sheet)                        │
│ batting_sr     │ null                                       │
│ wickets        │ 322                                        │
│ economy        │ 7.4                                        │
│ eval_points    │ 89  ← "Evaluation Points"                 │
│ base_price     │ 400000 ← ₹4 Lakh                         │
│ role           │ "Bowler"                                  │
│ image_url      │ "https://documents.ipl20.com/..."         │
│ status         │ "pending" | "sold" | "unsold"             │
│ sold_price     │ 1500000 (₹15L if sold)                    │
│ sold_to_team   │ "Royal Challengers Bengaluru"             │
│ sold_at        │ timestamp                                  │
└────────────────┴────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         teams                               │
├────────────────┬────────────────────────────────────────────┤
│ id             │ Auto-generated                             │
│ name           │ "Sunrisers Hyderabad"                     │
│ logo_url       │ "/images/teams/srh.webp"                  │
│ border_color   │ "#F26522"                                 │
│ bg_gradient    │ CSS gradient string                        │
│ starting_budget│ 10000000 (₹1 Crore)                      │
│ remaining_budget│ 10000000 (auto-calculates)               │
│ total_players  │ 0 (auto-calculates)                       │
│ foreign_players│ 0 (auto-calculates)                       │
│ total_points   │ 0 (auto-calculates)                       │
│ playing_xi_pts │ 0                                          │
└────────────────┴────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      auction_log                            │
├────────────────┬────────────────────────────────────────────┤
│ id             │ Auto-generated                             │
│ player_id      │ → players.id                              │
│ player_name    │ "Virat Kohli" (denormalized for speed)    │
│ team_id        │ → teams.id (null if unsold)               │
│ team_name      │ "RCB" (denormalized)                      │
│ action         │ "sold" | "unsold" | "undo"               │
│ final_price    │ 1500000                                    │
│ auctioneer_id  │ → users.id                                │
│ created_at     │ timestamp                                  │
└────────────────┴────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         users                               │
├────────────────┬────────────────────────────────────────────┤
│ id             │ Auto-generated                             │
│ email          │ "admin@auction.com"                       │
│ role           │ "admin" | "auctioneer"                   │
│ name           │ "Satbir Singh"                            │
└────────────────┴────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       playing_xi                            │
├────────────────┬────────────────────────────────────────────┤
│ id             │ Auto-generated                             │
│ team_id        │ → teams.id                                │
│ player_id      │ → players.id                              │
│ selected_at    │ timestamp                                  │
└────────────────┴────────────────────────────────────────────┘
```

---

## 🔧 Technology Stack

| Layer | Tool | Cost |
|-------|------|------|
| Database + Auth | **Supabase** | Free (500MB, plenty) |
| Real-time updates | Supabase Realtime | Free |
| Frontend | React + TypeScript (keep as-is) | Free |
| Hosting | Vercel (keep as-is) | Free |
| **Total cost** | | **₹0** |

---

## 🗺️ Migration Plan — Keep Your Sheet as Import Tool

```
Step 1 ─ Setup (1 day)
  Create Supabase project → Create tables → Add admin login

Step 2 ─ Import Your Players (5 minutes before event)
  Admin Panel → "Import from Google Sheet"
  Paste: https://docs.google.com/spreadsheets/d/1fyX373d3b...
  Click Import → All players load into DB ✅

Step 3 ─ Setup Teams (5 minutes)
  Admin Panel → Teams → All 12 teams already there
  Set budgets → ₹1 Crore each ✅

Step 4 ─ Run Auction (event day)
  Auctioneer logs into /auction
  Marks sold/unsold → DB saves instantly
  All 12 team managers watch live on their phones ✅

Step 5 ─ After Auction
  Admin Panel → Export Results → CSV file ✅
  (Can paste back into Google Sheet if needed)
```

---

## ✅ What Stays the Same vs 🆕 What's New

### ✅ Stays Exactly the Same
- Home page looks identical
- Auction page UI looks identical  
- Team cards, leaderboard, Playing XI — same
- All animations (confetti, UNSOLD stamp)
- Mobile swipe gestures
- Vercel deployment URL

### 🔄 Changes (invisible to viewers)
- Data source: Google Sheet CSV → Supabase DB
- Auction results: localStorage → DB (permanent, cross-device)
- Updates: 5-second polling → instant real-time

### ✨ New Things
- `/login` — admin & auctioneer login
- `/admin` — full management panel
  - Add/edit players without touching the Sheet
  - Set team budgets and colors
  - Import from Google Sheet
  - Export results
- Auction page now **writes** to DB on every sold/unsold click
- Playing XI saves to DB (visible to all)

---

## ❓ 3 Questions I Still Need From You

> [!IMPORTANT]
> **Question 1**: Will YOU be the auctioneer (running the laptop during the event), or will a DIFFERENT person be the auctioneer?
> - Same person → I'll make admin + auctioneer one combined role
> - Different people → Two separate logins with different access levels

> [!IMPORTANT]  
> **Question 2**: Should each of the 12 team managers have their own login to see only THEIR team's data?
> - Yes → I add a 3rd "team" role (12 team logins)
> - No → Everyone sees public view, no team login needed

> [!IMPORTANT]
> **Question 3**: After the auction, do you want to keep using Google Sheets for anything — or fully move to the admin panel?
> - Fully move to admin panel → Simplest, cleanest
> - Keep Sheet as backup → I'll add a "sync to sheet" feature after auction
