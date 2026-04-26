# Launch Sentinel

**Tech Product Intelligence Platform**

Track every product launch, death, and trajectory across the tech ecosystem. 23,420 products. 337K+ signal scores. 10 live data pipelines.

---

## What It Does

Launch Sentinel aggregates product data from Product Hunt, Hacker News, Reddit, GitHub, and the tech press — then runs signal scoring, relationship mapping, and death modeling to surface which products are rising, stalling, or dying.

Built for researchers, founders, and analysts who need real signal, not noise.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | Supabase (PostgreSQL), Auth |
| AI | Anthropic SDK (Claude Haiku — enrichment) |
| Scripts | tsx |
| CI/CD | GitHub Actions (10 crons) |
| Hosting | Vercel |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/alimabsoute/v0-product-sentinel.git
cd v0-product-sentinel
npm install
```

### 2. Set environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://fnlmqkfmjfzzkkqcmahe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key
PRODUCT_HUNT_DEVELOPER_TOKEN=your_ph_token
GITHUB_TOKEN=your_github_token
FIRECRAWL_API_KEY=your_firecrawl_key
```

The same variables must be configured in Vercel (production) and GitHub Actions secrets (crons).

### 3. Run dev server

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

### Dev

```bash
npm run dev                    # Start dev server (localhost:3000)
```

### Data Ingestion

```bash
npm run ingest:ph              # Product Hunt (daily)
npm run ingest:hn              # Hacker News (every 6h)
npm run backfill:ph            # Historical PH backfill (25K+ products)
```

### Enrichment & Scoring

```bash
npm run signals                # Compute signal scores for all products
npm run enrich                 # Attribute enrichment via Claude Haiku
```

### Death Model

```bash
npm run mark:dead:dry          # Preview which products would be flagged dead
npm run mark:dead              # Live run — update DB
```

### Supabase

```bash
npx supabase start             # Start local Supabase
npx supabase stop
npx supabase status
npx supabase db reset          # Reset to migrations
npx supabase gen types typescript --local > types/database.types.ts
```

### Deploy

```bash
vercel --prod --yes            # Deploy to Vercel
```

---

## Pages (22)

```
/                   Homepage
/products           Product browser (paginated + search)
/products/[slug]    Product detail — signal chart, press, related
/categories         Category index
/categories/[slug]  Category detail
/markets            Bloomberg-style analytics dashboard
/evolution          Product timeline
/explore            Force graph (500 nodes, Obsidian-style)
/insights           News feed
/insights/[slug]    Article detail
/trending           Trending products
/functions          Product functions (blocked — product_tags empty)
/compare            Side-by-side comparison
/graveyard          Dead products (death model)
/news               News index
/lists              Curated lists
/lists/[id]         List detail
/new                New products
/submit             Submit a product
/login              Login
/signup             Signup
/profile            User profile + watchlist
```

---

## Database

Supabase project ID: `fnlmqkfmjfzzkkqcmahe` (dashboard name: LaunchSentinel)

Key tables:

| Table | Rows |
|-------|------|
| products | 23,420 |
| product_signal_scores | 337,137 |
| press_mentions | 73+ |
| categories | 18 |
| product_tags | 0 (critical gap) |
| relationships | 0 (script ready) |

See `docs/ARCHITECTURE.md` for the full schema overview.

---

## GitHub Actions Crons (10 workflows)

| Workflow | Schedule |
|----------|----------|
| ingest-product-hunt.yml | Daily 06:00 UTC |
| ingest-hn.yml | Every 6h |
| ingest-reddit.yml | Every 12h |
| ingest-github-trending.yml | Daily 07:00 UTC |
| ingest-news.yml | Hourly |
| compute-signal-scores.yml | Daily 05:00 UTC |
| enrich-attributes.yml | Weekly Sun 02:00 UTC |
| seed-score-history.yml | Manual trigger |
| snapshot-github-stars.yml | Daily 04:00 UTC |
| mark-dead-products.yml | Weekly Sun 03:00 UTC |

---

## Status

- 10/10 sprints complete
- Live at: https://v0-product-sentinel.vercel.app (moving to launchsentinel.com)
- Supabase: https://supabase.com/dashboard/project/fnlmqkfmjfzzkkqcmahe
