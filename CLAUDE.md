# Launch Sentinel (v0-product-sentinel)

## Project

**Name**: Launch Sentinel
**Domain**: launchsentinel.com (live ✓)
**Purpose**: "Bloomberg meets Product Hunt" — tech product intelligence platform with signal scoring, press tracking, death modeling, and deep product analytics.
**Status**: 10/10 sprints complete. 23,420 products. 10 GitHub Actions crons live.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Backend | Supabase (PostgreSQL), Auth |
| AI | Anthropic SDK (Claude Haiku — enrichment) |
| Scripts | tsx (TypeScript execution) |
| CI/CD | GitHub Actions (10 crons) |
| Hosting | Vercel |

---

## Git / Repo

- **Repo**: alimabsoute/v0-product-sentinel
- **Git root**: `C:\Users\alima\v0-product-sentinel\`
- **Vercel project**: v0-product-sentinel
- **Current branch**: main

---

## Supabase

- **Project ID**: `fnlmqkfmjfzzkkqcmahe` (dashboard name: LaunchSentinel)
- **Dashboard**: https://supabase.com/dashboard/project/fnlmqkfmjfzzkkqcmahe

---

## Dev Commands

```bash
# Start dev server
npm run dev                              # localhost:3000

# Data ingestion
npm run ingest:ph                        # Product Hunt ingestion
npm run ingest:hn                        # Hacker News ingestion
npm run backfill:ph                      # Historical PH backfill (1000+ pages)

# Enrichment & scoring
npm run signals                          # Compute signal scores (all products)
npm run enrich                           # Attribute enrichment (Claude Haiku)

# Death model
npm run mark:dead:dry                    # Dry run — preview flagged products
npm run mark:dead                        # Live run — mark dead products in DB

# Supabase local
npx supabase start
npx supabase stop
npx supabase status
npx supabase db reset                    # Reset to migrations
npx supabase gen types typescript --local > types/database.types.ts

# Deploy
vercel --prod --yes                      # Deploy to Vercel
```

---

## Pages (22 total)

| Route | Page | Status |
|-------|------|--------|
| `/` | Homepage | Live |
| `/products` | Product browser | Live — pagination + search wired (Sprint 1) |
| `/products/[slug]` | Product detail | Live — signal chart, press mentions, related |
| `/categories` | Category index | Live |
| `/categories/[slug]` | Category detail | Live |
| `/markets` | Bloomberg analytics dashboard | Live — SQL views wired |
| `/evolution` | Timeline | Live — real DB wired |
| `/explore` | Force graph (500 nodes) | Live — Obsidian-style |
| `/insights` | News feed | Live — press_mentions wired |
| `/insights/[slug]` | Article detail | Live |
| `/trending` | Trending products | Live |
| `/functions` | Product functions | Blocked — product_tags EMPTY |
| `/compare` | Side-by-side comparison | Live |
| `/graveyard` | Dead products | Live — death model + enrichment |
| `/news` | News index | Live |
| `/lists` | Curated lists | Live |
| `/lists/[id]` | List detail | Live |
| `/new` | New products | Live |
| `/submit` | Submit a product | Live |
| `/login` | Auth — login | Live |
| `/signup` | Auth — signup | Live |
| `/profile` | User profile + watchlist | Live |

---

## GitHub Actions Crons (10 workflows)

| Workflow | Schedule | Script |
|----------|----------|--------|
| ingest-product-hunt.yml | Daily 06:00 UTC | ingest-product-hunt.ts |
| ingest-hn.yml | Every 6h | ingest-hn.ts |
| ingest-reddit.yml | Every 12h | ingest-reddit.ts |
| ingest-github-trending.yml | Daily 07:00 UTC | ingest-github-trending.ts |
| ingest-news.yml | Hourly | ingest-news.ts |
| compute-signal-scores.yml | Daily 05:00 UTC | compute-signal-scores.ts |
| enrich-attributes.yml | Weekly Sun 02:00 UTC | enrich-attributes.ts |
| seed-score-history.yml | Manual trigger | seed-score-history.ts |
| snapshot-github-stars.yml | Daily 04:00 UTC | snapshot-github-stars.ts |
| mark-dead-products.yml | Weekly Sun 03:00 UTC | mark-dead-products.ts |

---

## Database (Supabase — fnlmqkfmjfzzkkqcmahe)

| Table | Rows | Purpose |
|-------|------|---------|
| products | 23,420 | Core product records |
| companies | — | Company records (linked to products) |
| categories | 18 | Product categories |
| product_categories | — | Join table |
| functions | — | Functional tags (AI, analytics, etc.) |
| product_functions | — | Join table |
| tags | — | User-generated tags |
| **product_tags** | **0 (EMPTY)** | **CRITICAL GAP — blocks 10+ features** |
| press_mentions | 73+ | News/press coverage (accumulates hourly) |
| product_signal_scores | 337,137 | Signal scoring history |
| users | — | Supabase auth users |
| user_watchlist | — | Saved products per user |
| user_collections | — | Curated lists |
| collection_products | — | Join table |
| **relationships** | **0 (EMPTY)** | Product relationships (script ready, not run) |
| github_snapshots | — | Star history snapshots |
| user_comments | — | Community comments |
| user_upvotes | — | Product upvotes |

**Views**: `attribute_cohort_share`, analytics views (wired to /markets)

---

## Critical Gaps

1. **product_tags EMPTY** — blocks /functions page, faceted sidebar, attribute charts, tag-based filtering. Enrichment script exists but has not been run against full dataset.
2. **relationships EMPTY** — `enrich-relationships.ts` is ready. Run with `npm run enrich:relationships`. Estimated cost ~$4 for 23K products via Claude Haiku.
3. **RLS not enforced** — Supabase Row Level Security policies are not yet active. Security gap before public launch on launchsentinel.com.

---

## Auth Architecture (Critical)

- `lib/auth.ts` — SERVER ONLY (has `server-only` marker, imports `next/headers`). Never import in client components.
- `lib/auth-client.ts` — BROWSER ONLY (`createBrowserSupabaseClient`). Import this in client components.

---

## press_mentions Schema (Actual Column Names)

- `headline` (not `title`)
- `mention_date` (not `published_at`)
- `publication` (source name)
- `lib/db/news.ts` is correct — do not revert.

---

## Scripts (17 in scripts/)

```
ingest-product-hunt.ts      ingest-hn.ts
ingest-reddit.ts            ingest-github-trending.ts
ingest-news.ts              backfill-product-hunt.ts
enrich-attributes.ts        enrich-relationships.ts
compute-signal-scores.ts    seed-score-history.ts
snapshot-github-stars.ts    mark-dead-products.ts
backfill-news-blurbs.ts     shared/ingest-core.ts
run-backfill.sh             watch-backfill.sh
```

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
PRODUCT_HUNT_DEVELOPER_TOKEN=
GITHUB_TOKEN=
FIRECRAWL_API_KEY=
```

All must be set in `.env.local` (dev) and Vercel + GitHub Actions secrets (prod).

---

## Session Commands

| Say | Does |
|-----|------|
| `wrap-flow` | Commit + push + Obsidian update + new terminal handoff |
| `wrap` | Commit + Obsidian update + handoff card only |

---

## Known Issues

- Signal scores exist for only ~14K of 23,420 products — run `npm run signals` to catch up
- product_tags and relationships tables empty — highest-priority data gaps
- RLS disabled — cannot launch publicly without enforcing row-level security
- mark-dead-products weekly cron is live; verify results in Actions tab after first run
