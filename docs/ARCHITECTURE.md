# Launch Sentinel — Architecture

> Last updated: 2026-04-26

---

## Data Flow

```
External Sources
      │
      ├── Product Hunt API  ─────────────────┐
      ├── Hacker News API   ─────────────────┤
      ├── Reddit API        ─────────────────┤──▶ Ingestion Scripts ──▶ Supabase (PostgreSQL)
      ├── GitHub API        ─────────────────┤         │
      └── News/RSS feeds    ─────────────────┘         │
                                                        ▼
                                               Enrichment Scripts
                                               (Claude Haiku via Anthropic SDK)
                                                        │
                                                        ▼
                                               Supabase (enriched data)
                                                        │
                                                        ▼
                                               Next.js API Routes / Server Components
                                                        │
                                                        ▼
                                               React UI (22 pages)
```

GitHub Actions crons trigger ingestion and enrichment scripts on schedule. Scripts run via `tsx` against `.env.local` (dev) or GitHub Actions secrets (prod). All writes go through the Supabase service role key. The Next.js app reads via the anon key (respecting RLS — note: RLS not yet enforced).

---

## Tech Stack Versions

| Tech | Version |
|------|---------|
| Next.js | 16 |
| React | 19 |
| TypeScript | 5.x |
| Tailwind CSS | 4 |
| shadcn/ui | Latest |
| Supabase JS | 2.x |
| Anthropic SDK | Latest |
| Node.js | 20.x |

---

## Database Schema (Supabase — fnlmqkfmjfzzkkqcmahe)

### Core Tables

| Table | Rows (approx) | Purpose |
|-------|--------------|---------|
| `products` | 23,420 | Primary product records. Fields: id, name, slug, tagline, description, url, logo_url, launch_date, product_hunt_id, github_url, is_dead, dead_at, dead_reason |
| `companies` | — | Company entities linked to products |
| `categories` | 18 | Top-level product categories (AI, DevTools, Analytics, etc.) |
| `product_categories` | — | Many-to-many join: products ↔ categories |
| `functions` | — | Functional product tags (CRM, Email, CI/CD, etc.) |
| `product_functions` | — | Many-to-many join: products ↔ functions |
| `tags` | — | User/system-generated free-form tags |
| `product_tags` | **0 (CRITICAL GAP)** | Many-to-many join: products ↔ tags. Empty — blocks /functions, faceted filtering, attribute charts |

### Signal & Analytics Tables

| Table | Rows (approx) | Purpose |
|-------|--------------|---------|
| `product_signal_scores` | 337,137 | Time-series signal scores per product. Fields: product_id, score, computed_at, signal breakdown (press, github, search) |
| `github_snapshots` | — | Daily star count snapshots for GitHub repos |
| `press_mentions` | 73+ | News articles and press coverage. Fields: product_id, headline, publication, mention_date, url, sentiment |

**Views**:
- `attribute_cohort_share` — cohort distribution for /markets analytics
- Additional analytics views for Bloomberg dashboard (SQL aggregations)

### User Tables

| Table | Purpose |
|-------|---------|
| `users` | Supabase Auth users (mirrors auth.users) |
| `user_watchlist` | Saved products per user |
| `user_collections` | Curated lists (user-created) |
| `collection_products` | Join: collections ↔ products |
| `user_comments` | Community comments on products |
| `user_upvotes` | Product upvotes |

### Relationship Tables (Empty — Scripts Ready)

| Table | Rows | Status |
|-------|------|--------|
| `relationships` | 0 | `enrich-relationships.ts` written, not yet run. ~$4 to populate 23K products via Claude Haiku |

---

## Scripts (scripts/)

| Script | Trigger | Purpose |
|--------|---------|---------|
| `ingest-product-hunt.ts` | Daily cron | Ingest new PH launches |
| `ingest-hn.ts` | Every 6h cron | Ingest HN Show HN posts |
| `ingest-reddit.ts` | Every 12h cron | Ingest Reddit r/startups, r/SaaS posts |
| `ingest-github-trending.ts` | Daily cron | Ingest GitHub trending repos |
| `ingest-news.ts` | Hourly cron | Ingest news via RSS + Firecrawl |
| `backfill-product-hunt.ts` | Manual | Historical PH backfill (2016–present) |
| `enrich-attributes.ts` | Weekly cron | Claude Haiku enrichment of product attributes |
| `enrich-relationships.ts` | Manual | Map product relationships/alternatives |
| `compute-signal-scores.ts` | Daily cron | Score all products using signal formula |
| `seed-score-history.ts` | Manual | Backfill score history for existing products |
| `snapshot-github-stars.ts` | Daily cron | Record star counts to github_snapshots |
| `mark-dead-products.ts` | Weekly cron | Death model — flag dead/zombie products |
| `backfill-news-blurbs.ts` | Manual | Enrich press_mentions with AI-generated blurbs |
| `shared/ingest-core.ts` | — | Shared dedup, quality gate, upsert logic |
| `run-backfill.sh` | Manual | Shell wrapper to run backfill with progress |
| `watch-backfill.sh` | Manual | Monitor backfill process |

---

## GitHub Actions Crons (10 workflows)

| Workflow File | Schedule (UTC) | Runs |
|--------------|---------------|------|
| `ingest-product-hunt.yml` | Daily 06:00 | `ingest-product-hunt.ts` |
| `ingest-hn.yml` | Every 6h | `ingest-hn.ts` |
| `ingest-reddit.yml` | Every 12h | `ingest-reddit.ts` |
| `ingest-github-trending.yml` | Daily 07:00 | `ingest-github-trending.ts` |
| `ingest-news.yml` | Hourly | `ingest-news.ts` |
| `compute-signal-scores.yml` | Daily 05:00 | `compute-signal-scores.ts` |
| `enrich-attributes.yml` | Weekly Sun 02:00 | `enrich-attributes.ts` |
| `seed-score-history.yml` | Manual trigger | `seed-score-history.ts` |
| `snapshot-github-stars.yml` | Daily 04:00 | `snapshot-github-stars.ts` |
| `mark-dead-products.yml` | Weekly Sun 03:00 | `mark-dead-products.ts` |

All workflows use `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and source-specific tokens (PH, GitHub, etc.) from GitHub Actions secrets.

---

## Key Design Decisions

### Dedup Cascade
All ingestion scripts run through `shared/ingest-core.ts` which applies:
1. URL normalization (strip UTM params, trailing slashes)
2. Name fuzzy match against existing products
3. Product Hunt ID match (authoritative dedup key where available)
4. On conflict: upsert (update existing, do not create duplicate)

### Quality Gate
Before inserting a product, `ingest-core.ts` enforces minimum quality:
- Must have: name, URL, launch date
- Must pass: URL reachability check (via Firecrawl or HEAD request)
- Low-quality sources (spam, off-topic) filtered by keyword blocklist

### Signal Scoring Formula
`compute-signal-scores.ts` produces a composite score (0–100) per product:

| Signal | Weight | Source |
|--------|--------|--------|
| Press velocity | 35% | press_mentions count / recency |
| GitHub momentum | 30% | star delta (github_snapshots) |
| Community activity | 20% | HN/Reddit engagement |
| Product Hunt traction | 15% | PH vote count + comments |

Scores stored as time-series in `product_signal_scores` (337K+ rows).

### Death Model
`mark-dead-products.ts` (weekly) flags products as dead when 3+ of these signals fire:
- No press mentions in 180 days
- GitHub stars flat or declining for 90 days
- Product Hunt votes stalled (< 5 in last year)
- Domain unreachable (via Firecrawl check)
- Founder LinkedIn shows company as "closed" or new employer

Flagged products: `is_dead = true`, `dead_at = timestamp`, `dead_reason = json`.

### Auth Architecture
- `lib/auth.ts` — server-only, imports `next/headers`. For Server Components and Route Handlers.
- `lib/auth-client.ts` — browser-only, `createBrowserSupabaseClient`. For Client Components.
- Never mix. Violating this causes build errors and hydration mismatches.

---

## Environment Variables

| Variable | Used By |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | App + scripts |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | App (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Scripts + crons (write access) |
| `ANTHROPIC_API_KEY` | enrich-attributes.ts, enrich-relationships.ts |
| `PRODUCT_HUNT_DEVELOPER_TOKEN` | ingest-product-hunt.ts, backfill |
| `GITHUB_TOKEN` | ingest-github-trending.ts, snapshot |
| `FIRECRAWL_API_KEY` | ingest-news.ts, quality gate URL checks |

---

## Known Gaps (as of 2026-04-26)

| Gap | Impact | Fix |
|----|--------|-----|
| `product_tags` = 0 rows | /functions broken, faceted sidebar empty, attribute charts blank | Run `npm run enrich` on full dataset |
| `relationships` = 0 rows | No related products, no alternatives mapping | Run `npm run enrich:relationships` (~$4) |
| RLS not enforced | Security gap — all rows readable by anon key | Write + enable RLS policies before public launch |
| Signal scores incomplete | ~14K of 23K products scored | Run `npm run signals` to catch up |
