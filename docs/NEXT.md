# NEXT — Prism resume point

> **Last updated**: 2026-04-18 — Session 5 complete
> **Read this file first** when returning to the project.

---

## Status: ALL 10 SPRINTS COMPLETE ✅ | Live at https://v0-product-sentinel.vercel.app

### DB State (2026-04-18 evening)
- **14,114 products** (backfill still running)
- **73 press mentions** — hourly cron accumulating, 8 RSS sources
- **6,275 signal scores** — daily 3am cron
- **0 relationships / 0 alternatives** — enrichment script ready
- **Migrations applied**: 0001–0007 all applied

---

## What Was Built This Session (Sprints 2–10)

| Sprint | What | Route |
|--------|------|-------|
| S2 | Signal history chart, press mentions, related products | /products/[slug] |
| S3 | Bloomberg analytics dashboard, SQL views | /markets |
| S4 | Evolution timeline wired to real DB | /evolution |
| S5 | Obsidian-style force graph, 500 nodes, hover/click | /explore |
| S6 | News feed wired to press_mentions | /insights |
| S7 | Side-by-side product comparison | /compare |
| S8 | Relationships display, deep graveyard, enrichment script | /graveyard |
| S9 | Supabase auth, login/signup/profile, watchlist | /login, /profile |
| S10 | CSV/JSON export, rate limiting, API docs | /api/export, /api/docs |

---

## Known Issues / Next Work

### 1. Analytics sparse
- Only 6,275 of 14,114 products have signal scores
- Run: pnpm signals (to score new backfill products)

### 2. News feed sparse (73 articles)
- Hourly cron accumulates naturally
- Manual bulk fill: pnpm tsx --env-file=.env.local scripts/ingest-news.ts

### 3. 0 product relationships/alternatives
- Run when ready: pnpm enrich:relationships (~$4 for 14K products via Claude Haiku)

### 4. Backfill still running
- Monitor: pnpm backfill:watch
- Single process: PIDs 3492/16548/5340 (running since 10:27 AM)
- Target: 25K+ products (2016+ coverage)

---

## Critical: auth import split
- lib/auth.ts = SERVER ONLY (has server-only marker, imports next/headers)
- lib/auth-client.ts = BROWSER ONLY (createBrowserSupabaseClient)
- Client components MUST import from auth-client NOT auth

## press_mentions schema (actual columns)
- headline (not title), mention_date (not published_at), publication (source name)
- lib/db/news.ts is now correct — do not revert to old column names

---

## Vercel
- Live: https://v0-product-sentinel.vercel.app
- Deploy: vercel --prod --yes
- Last commit: e52d01c

## Supabase ref: fnlmqkfmjfzzkkqcmahe
