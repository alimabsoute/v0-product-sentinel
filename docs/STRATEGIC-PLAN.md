# Prism — Strategy & Execution Plan

> **Codename**: `prism` (project-wide). Final product name TBD; everything grep-replaceable.
> **Sub-brand**: `dossier` = the full intelligence file on a single product (replaces "product detail page"). Surfaces as `/dossier/{slug}`, "Open dossier" CTAs, countable unit for monetization (free tier: 10 dossiers/mo, pro: unlimited, API: paid).

## Context

Ali has a fully-designed v0 frontend (`C:\Users\alima\v0-product-sentinel\`) — Next.js 16 App Router + shadcn/ui + 1,197 lines of mock data — and a comprehensive master context doc defining a "Bloomberg meets Product Hunt" platform: historical product tracking, signal scoring, graveyard, funding correlation, knowledge graph. **Zero backend exists yet.** The task: turn the v0 scaffold into a real product (codenamed **prism**) by wiring up Supabase + an ingestion pipeline, starting with Phase 1 (seed modern DB from Product Hunt).

Critical design question: how to get **official branding/logos** for every product during ingestion.

## EXECUTION PLAN — Working Backward, Lean Mode, Multi-Source

**Starting point**: existing v0-product-sentinel git repo (Next.js 16 + React 19 + shadcn/ui + mock data), renamed to `prism`.
**Ali's paid budget**: Firecrawl only (~$16/mo Hobby tier). Everything else must be free or deferred.
**Target**: Live site at a Vercel subdomain within Week 1, with 50+ real products + logos + automated daily ingestion bringing 5–20 new products/day + automated news feed. Working-backward from "ship ASAP, backfill depth later."

### Multi-source ingestion strategy

Product Hunt alone is too narrow. Parallel ingestion from 5 free sources in Week 1, 3 more in Week 2. Firecrawl used only for sites without APIs.

**Week 1 sources (all free APIs, no Firecrawl needed):**

| Source | Method | Yield/day | Cost | Notes |
|--------|--------|-----------|------|-------|
| **Product Hunt GraphQL API** | Official API, dev token | 100–200 candidates | Free | Primary source. Rich data + official logos. |
| **Hacker News "Show HN"** | Algolia API (`hn.algolia.com/api/v1/search?tags=show_hn`) | 5–15 candidates | Free | Early dev-tool launches before they hit PH |
| **GitHub Trending** | Scrape `github.com/trending` (HTML) or use GH API for high-star-velocity repos | 10–20 candidates | Free | Open-source products |
| **Reddit r/SideProject + r/InternetIsBeautiful** | Reddit API | 10–20 candidates | Free | Indie launches |

**Week 2 additional sources (Firecrawl for ones without APIs):**

| Source | Method | Cost | Notes |
|--------|--------|------|-------|
| **Indie Hackers products** | Firecrawl scrape | ~$0.01/scrape | Revenue data bonus |
| **BetaList** | Firecrawl scrape | ~$0.01/scrape | Pre-launch products |
| **TAAFT (theresanaiforthat)** | Firecrawl scrape | ~$0.01/scrape | AI tools + task tags |
| **AlternativeTo** | Firecrawl scrape | ~$0.01/scrape | Alternatives graph data |

**Daily raw yield**: 125–255 candidates from Week 1 sources alone. After dedup against existing DB + quality gate → **target 5–20 unique new products/day**.

### Dedup strategy (CRITICAL — without this, garbage DB)

Same product launches on multiple platforms same day. Dedup by cascade:

1. **Exact match**: `slug` uniqueness in `products` table — instant reject
2. **Domain match**: extract root domain from any URL, compare to `products.website_domain`
3. **Name fuzzy match**: `pg_trgm` similarity > 0.8 on normalized name (lowercase, strip spaces/punctuation)
4. **Twitter handle match**: `products.twitter_handle` unique index
5. **GitHub repo match**: `products.github_repo` unique index
6. **Embedding similarity** (fallback): pgvector embedding of `name + tagline + description`, cosine > 0.9 = same product

Add schema columns: `website_domain`, `twitter_handle`, `github_repo` (all unique nullable), `name_embedding` (pgvector).

### Quality gate (drop garbage before enriching)

Claude Haiku (cheap) runs a cheap "is this a real product?" classifier as the first step. Reject if:
- Not a product (article, tweet, meta-discussion)
- Joke/satire product with no real URL
- Duplicate of existing product (after dedup pass)
- Marked as `confidence_score < 3`

Only products passing the gate get expensive Sonnet extraction + Firecrawl enrichment.

### Automated pipeline architecture — $0 infrastructure

Hybrid using free tiers:

| Job | Runner | Frequency | Why this runner |
|-----|--------|-----------|-----------------|
| **PH ingestion** | GitHub Actions | `0 6 * * *` daily | Free, 6h timeout, full Node env |
| **HN ingestion** | GitHub Actions | `0 */6 * * *` 4x/day | Same |
| **GitHub Trending** | GitHub Actions | `0 7 * * *` daily | Same |
| **Reddit ingestion** | GitHub Actions | `0 */4 * * *` 6x/day | Same |
| **News RSS analysis** | GitHub Actions | `0 * * * *` hourly | Volume too high for Vercel Cron free |
| **Logo backfill** | GitHub Actions | `0 3 * * *` daily | Needs multiple API calls per product |
| **Dedup sweep** | Supabase pg_cron | `0 4 * * *` daily | Runs inside DB, free |
| **Materialized view refresh** | Supabase pg_cron | `0 5 * * *` daily | Refresh market_size_snapshots |
| **Signal score compute** | GitHub Actions | `0 3 * * *` daily | Heavy aggregation, needs compute |
| **Webhook receivers** | Vercel API routes | On-demand | Real-time PH webhooks if available |

**Total infra cost: $0.** Vercel Hobby covers hosting, GitHub Actions covers cron (effectively unlimited for public repos, 2000 min/mo for private), Supabase Free covers DB + pg_cron.

**Critical gotcha**: GitHub Actions for private repos has 2000 free minutes/mo. Each ingestion job takes ~2-5 min → 10 jobs/day × 5 min × 30 days = 1500 min/mo, fits within budget. **Keep the prism repo public initially** (no secrets in code, all secrets in Actions secrets) to get unlimited Actions minutes. Make private once monetization starts.

### News feed automation — optimized for cost

Naive approach: 8 sources × 50 articles/day × Claude Sonnet = ~$125/mo. Too expensive.

**Optimized approach:**

1. **RSS parser pulls all 8 sources** hourly via GitHub Actions — free
2. **Pre-filter by keyword match** against `products.name` set — skip 80% of articles instantly
3. **Claude Haiku** (not Sonnet) classifies remaining ~50 articles/day:
   - `event_type`: launch | funding | acquisition | shutdown | update | other
   - `sentiment`: -1 | 0 | 1
   - `product_mentions`: array of detected product names
   - `importance_score`: 1–5
4. **Funding articles** only get escalated to Sonnet for detailed funding round extraction — ~5/day × $0.02 = $0.10/day = $3/mo

Cost math:
- Haiku: 50 articles/day × 30 days = 1500 calls/mo
- Per call: ~1500 input + 200 output tokens
- Haiku 4.5 pricing: ~$1/M input, ~$5/M output
- Per call: 1500 × $1/1M + 200 × $5/1M = $0.0015 + $0.001 = $0.0025
- Total: 1500 × $0.0025 = **$3.75/mo** for news classification
- Plus $3/mo for funding escalation to Sonnet
- **News feed total: ~$7/mo**

### Per-product ingestion cost

Enrichment pipeline per new product that passes quality gate:

| Step | Tool | Cost |
|------|------|------|
| 1. Fetch source data | PH API / HN / GitHub / Reddit | Free |
| 2. Quality gate classification | Claude Haiku | $0.003 |
| 3. Structured extraction (full attribute bundle) | Claude Sonnet 4.6 | $0.016 |
| 4. Logo cascade (PH → Brandfetch → Clearbit → Firecrawl → favicon) | mostly free, ~10% hit Firecrawl | $0.002 avg |
| 5. GitHub repo lookup (if applicable) | GitHub API | Free |
| 6. Crunchbase public page scrape (company + funding) | Firecrawl | $0.015 |
| 7. Claude extraction of funding data from Crunchbase markdown | Claude Sonnet | $0.010 |
| 8. Upsert to Supabase | Supabase client | Free |
| **Per product total** | | **~$0.046** |

At 15 products/day × 30 days = 450 products/mo × $0.046 = **~$21/mo ongoing ingestion cost**.

### Total realistic monthly burn (with full automation)

| Line item | Cost | Notes |
|-----------|------|-------|
| Vercel Hobby | $0 | 2 cron jobs + unlimited bandwidth fit |
| Supabase Free | $0 | 500MB DB fits 10k+ products; pg_cron included |
| GitHub Actions (public repo) | $0 | Unlimited minutes for public repos |
| Firecrawl Hobby | $16 | 3k credits/mo covers ~1500 product enrichments + logo fallbacks + Crunchbase scrapes + Week 2 source scrapes |
| Claude API (Haiku + Sonnet mix) | ~$30 | $21 ingestion + $7 news + $2 quality gate + buffer |
| Domain | $1 | |
| **TOTAL MONTHLY** | **~$47/mo** | Full automation: 15 products/day + hourly news + signal scores + dedup + logos |

**Stretch goal — ultra-lean $30/mo**: batch Claude calls 10-per-request (10x fewer round-trips), cache aggressively, use Haiku for more steps, pre-filter news more aggressively. Achievable.

### Week-by-week execution plan

**Week 1 — Ship something live**

Day 1: Foundation
- Rename repo v0-product-sentinel → prism (GitHub + local + Vercel project)
- Create Supabase project `prism` (free tier)
- Create `lib/branding.ts` with `PRODUCT_NAME = "Prism"`, `DOMAIN`, `TAGLINE`
- Install deps: `@supabase/supabase-js`, `@supabase/ssr`, `@anthropic-ai/sdk`, `rss-parser`, `@octokit/rest`, `firecrawl`
- Create `.env.local` with all API keys

Day 2: Schema + vocabulary
- Write `supabase/migrations/0001_initial_schema.sql` — 8 tables (companies, products, tags, product_tags, press_mentions, funding_rounds, functions, popularity_signals)
- Apply migration via Supabase CLI
- AI-draft vocabulary seed (functions tree + tag groups) + 1hr human review
- Write `supabase/seed/functions.sql` + `supabase/seed/tags.sql`
- Generate TypeScript types: `npx supabase gen types typescript`

Day 3: Visual UI map
- Create `prism/docs/ui-map.excalidraw` using Excalidraw MCP tools
- Build sitemap + 10 critical page wireframes × 3 breakpoints (desktop/tablet/mobile) + 4 user flows + component library
- Commit: `docs(ui): initial UI wireframe map`

Day 4: Logo pipeline + single-source ingestion
- Build `lib/logos/fetch-logo.ts` with 5-tier cascade
- Build `scripts/ingest/product-hunt.ts` — fetch + dedup + quality gate + Sonnet extraction + logo + upsert
- Run once manually, seed 50 products
- Verify logos in Supabase Storage

Day 5: UI cut-over
- Rename `app/products/[slug]` → `app/dossier/[slug]`
- Build `lib/queries/feed.ts` + `lib/queries/dossier.ts`
- Convert `app/page.tsx`, `app/products/page.tsx`, `app/dossier/[slug]/page.tsx` to server components with Supabase queries
- Delete `lib/mock-data.ts`
- Deploy to Vercel subdomain (e.g. prism-preview.vercel.app)
- Verify live: real products, real logos, real data

Day 6: Automation wiring
- Write `.github/workflows/ingest-product-hunt.yml` — daily cron
- Write `.github/workflows/ingest-hackernews.yml` — 4x/day cron
- Write `.github/workflows/ingest-github-trending.yml` — daily cron
- Write `.github/workflows/ingest-reddit.yml` — 6x/day cron
- Add repo secrets: `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY`, `PRODUCT_HUNT_DEVELOPER_TOKEN`, `GITHUB_TOKEN`, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`
- Commit + push → Actions run on schedule

Day 7: News feed automation
- Build `scripts/ingest/news-feed.ts` with RSS parser + keyword pre-filter + Haiku classifier + Sonnet funding extractor
- Write `.github/workflows/ingest-news.yml` — hourly cron
- Verify press_mentions accumulating

**End of Week 1**: Live at subdomain, 50+ real products, automated daily ingestion of 5-20 new products from 4 sources, hourly news feed automation. **Working backward goal achieved.**

**Week 2 — Expand + polish**
- Add Week 2 sources (Indie Hackers, BetaList, TAAFT, AlternativeTo via Firecrawl)
- Build faceted filter sidebar on `/products` (wire attribute taxonomy)
- Build `/dossier/[slug]` rich layout (all widgets from wireframe)
- Build `/trending` page (breakout feed)
- Wire up signal score computation job (daily)

**Week 3 — Markets layer**
- Add `market_size_snapshots`, `acquisitions`, `valuation_snapshots` tables
- Build aggregation job `scripts/jobs/compute-market-sizes.ts`
- Build `/markets` page with heatmap + lifecycle curves + funding leaderboard + survival curves + acquisition tracker
- Build `/functions/[slug]` pages with market rollups

**Week 4 — Beyond-mentions signals**
- Wikipedia pageviews ingestion
- GitHub star velocity + contributor count
- npm/PyPI/Docker Hub downloads (for dev tools)
- Wayback Machine snapshot count
- Tranco ranking cross-reference
- Update signal score formula to include composite popularity index

**Week 5+** — Graveyard, compare view, insights/graph, historical data Phase 2 (1960s→90s manual curation)

---

## Decisions locked in this session

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Project codename | **`prism`** | Breaks products into facets; grep-replaceable when final name lands |
| Dossier sub-brand | **yes** | `/dossier/[slug]` route, "Open dossier" CTA, becomes the monetizable unit |
| Vocabulary seeding | **AI draft + 1hr human review** | Merged from PH topics + TAAFT tasks + common SaaS taxonomies → `supabase/seed/functions.sql` + `tags.sql` |
| Logo source cascade | **PH GraphQL → Brandfetch → Clearbit → Firecrawl og:image → Google favicon** | Full 5-tier cascade. Firecrawl included from day 1 (Ali wants it early to kickstart ingestion). Expected ~95% coverage. |
| Execution philosophy | **Working backward from today** | Ship a Product Hunt-style modern feed + basic analytics FIRST. Then backfill historical depth. Don't let Phase 2 (1960s archive) block Phase 1 shipping. |
| Phase 0 execution scope | **Full Phase 0 end-to-end** | Repo rename, Supabase project, schema migration, types, deps, branding.ts, supabase clients, product-card type reconciliation. Stop before Phase 1 ingestion. |

## Naming conventions (locked for this plan)

| Thing | Name | Notes |
|-------|------|-------|
| Project / repo / Supabase project | `prism` | Rename `v0-product-sentinel` → `prism` |
| Full product intelligence file | `dossier` | Route `/dossier/[slug]`, button "Open dossier" |
| Listing/feed page | `/products` | Browse + filter; cards link to dossiers |
| Comparison view | `/compare?a=x&b=y` | Radar chart of dossier attributes |
| Task-discovery SEO pages | `/tools-to/{task}` | TAAFT-style |
| Function leaf pages | `/functions/{slug}` | All products with this `primary_function` |
| Branding source of truth | `lib/branding.ts` | Single file containing product name, tagline, domain — 1-file rename when final name lands |

---

## What's Already Built (v0 scaffold)

- **Pages**: home, products, products/[slug], categories/[slug], insights, insights/[slug], explore (graph viz), evolution (timeline), graveyard, login, signup, profile
- **Components**: 56 shadcn/ui components, product-card (4 variants), market-pulse (recharts), news-feed, search-command, site-header/footer
- **Stack**: Next.js 16.2 / React 19.2 / Tailwind 4 / TypeScript strict / recharts / lucide-react
- **Data layer**: pure mock (`lib/mock-data.ts`) — no Supabase client, no API routes, no auth

## Key Gap: v0 types vs master schema mismatch

The v0 `Product` type uses flat fields (`category`, `characteristics.pricing`, `buzz.score`) while the master SQL schema uses `primary_function`, `era`, `business_model`, and splits buzz into `social_mentions` + `product_signal_scores` tables. **This must be reconciled before writing any ingestion code** — otherwise we'll have to rewrite the UI twice.

---

## Recommended Approach — Incremental, Data-First

Build **one vertical slice end-to-end first** (Product Hunt → Supabase → UI) before adding signal scores, funding, graveyard, news. The master doc's 15 tables are the right *target* schema, but shipping a minimal 3-table subset that the UI actually uses will surface real problems faster than building the full schema in a vacuum.

### Phase 0 — Foundation (~1 session)

**Goal**: Supabase project live, schema migrated, v0 types reconciled, repo renamed.

1. **Rename repo** — `v0-product-sentinel` → `prism` (rename existing GitHub repo + local folder). Update Vercel project name.
2. **Create Supabase project** — `prism` in Ali's Supabase org
2a. **Create `lib/branding.ts`** — single source of truth for user-facing strings (`PRODUCT_NAME = "Prism"`, `TAGLINE`, `DOMAIN`). Every page/component imports from here. Final rename = 1-file edit.
3. **Run minimal schema migration** — start with `companies`, `products`, `tags`, `product_tags`, `press_mentions`, `funding_rounds`. Defer `social_mentions`, `product_signal_scores`, `product_graveyard`, `product_changelog`, `product_alternatives`, `product_relationships`, `job_posting_snapshots`, `revenue_snapshots` until the signal/graveyard/graph features get built.
4. **Generate TypeScript types**: `npx supabase gen types typescript --linked > types/database.types.ts`
5. **Install deps in v0 repo**: `@supabase/supabase-js`, `@supabase/ssr`, `@anthropic-ai/sdk`
6. **Create lib/supabase/server.ts + lib/supabase/client.ts** — standard Next.js 15+ SSR pattern
7. **Reconcile types** — create `lib/types.ts` that re-exports DB types as the canonical `Product` shape, then update `lib/mock-data.ts` to conform (temporarily — it'll be deleted in Phase 2). Critical: components like `product-card.tsx` must work with both mock and real data during the cutover.

**Critical files to modify:**
- `C:\Users\alima\v0-product-sentinel\lib\mock-data.ts` — align field names
- `C:\Users\alima\v0-product-sentinel\components\product-card.tsx` — unify with DB types
- `C:\Users\alima\v0-product-sentinel\package.json` — add Supabase + Anthropic deps

### Phase 1 — Product Hunt ingestion + logo pipeline (~2 sessions)

**Goal**: 500+ real products with official logos in Supabase, viewable in the v0 UI.

**Important correction to master doc**: Product Hunt has an **official GraphQL API** (https://api.producthunt.com/v2/api/graphql). Use it instead of Firecrawl for PH — it returns structured product data *including the official logo URL (thumbnail.image_url)*. Firecrawl should be reserved for sites without APIs (Crunchbase public pages, vintage archives, etc.).

**Logo acquisition strategy — cascade with fallbacks:**

This is the answer to Ali's logo question. No single source is reliable; use this priority order:

| Priority | Source | Cost | Notes |
|----------|--------|------|-------|
| 1 | **Product Hunt GraphQL `thumbnail.image_url`** | free | Already official, high-res, hosted on PH CDN. Best source for PH-sourced products. |
| 2 | **Brandfetch API** (`/v2/brands/{domain}`) | free tier 500/mo | Returns official logo, colors, icon. Best quality for non-PH products. |
| 3 | **Clearbit Logo API** (`logo.clearbit.com/{domain}`) | free, no key | Simple, reliable, covers most SaaS. |
| 4 | **Firecrawl scrape of product URL** — extract `<link rel="icon">` / og:image / first logo-like `<img>` | paid per scrape | Fallback for products without Brandfetch/Clearbit coverage. |
| 5 | **Google favicon** (`www.google.com/s2/favicons?domain={domain}&sz=256`) | free | Last resort, low quality. |

**Implementation**: `lib/logos/fetch-logo.ts` — tries each source in order, stores result in **Supabase Storage** bucket `product-logos/` (don't hotlink — CDNs change and break images), and writes `logo_url` + `logo_source` + `logo_confidence` columns on `products`. Add these three columns to the schema now.

**Ingestion script location**: `scripts/ingest/product-hunt.ts` (standalone Node script, run via `pnpm tsx`). Don't put in `app/api/` yet — cron jobs come in Phase 5.

**Env vars needed** (write to `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
PRODUCT_HUNT_DEVELOPER_TOKEN=   # https://api.producthunt.com/v2/oauth/applications
BRANDFETCH_API_KEY=              # https://developers.brandfetch.com/
FIRECRAWL_API_KEY=               # fallback only
```

### Phase 2 — Cut over UI from mock to live data + dossier rename (~1 session)

**Goal**: Delete `lib/mock-data.ts`, all pages read from Supabase, product detail route renamed to `/dossier`.

1. **Rename route**: `app/products/[slug]/` → `app/dossier/[slug]/`. Update all internal links in product-card.tsx, search-command.tsx, news-feed.tsx, etc. Keep `/products` as the listing/feed route.
2. **Update CTA copy**: "View product" → "Open dossier" in `product-card.tsx` (all 4 variants)
3. Create server components that query Supabase directly (`app/page.tsx`, `app/products/page.tsx`, `app/dossier/[slug]/page.tsx`)
4. Build `lib/queries/` helper layer:
   - `lib/queries/feed.ts` — `getTrendingProducts()`, `getProductsByCategory()` (list/card data only)
   - `lib/queries/dossier.ts` — `getDossierBySlug()` (full product + company + funding + press + signals JOIN)
5. Delete `lib/mock-data.ts`
6. Deploy to Vercel, verify live on a subdomain before mapping final domain

### Phase 3 — RSS news feed (~1 session)

**Goal**: `press_mentions` populated daily, homepage news-feed component shows real headlines.

- Use `rss-parser` (no Firecrawl needed for RSS)
- `scripts/ingest/news-feed.ts` — loops the 8 NEWS_SOURCES from master doc
- Claude Opus `analyzeArticle()` — extracts event_type, sentiment, product matches, funding_round (if funding event)
- Write to `press_mentions`, link to product by fuzzy-match on product name (use Supabase full-text search)

### Phase 4 — Social signals (Reddit + HN + GitHub) (~2 sessions)

**Goal**: `social_mentions` table populated, daily snapshots.

Add the deferred `social_mentions` table now. Build three ingesters:
- `scripts/ingest/reddit.ts` — Reddit API, search product name in r/programming, r/SideProject, r/ArtificialInteligence
- `scripts/ingest/hackernews.ts` — Algolia HN Search API (`hn.algolia.com/api/v1/search?query=X`)
- `scripts/ingest/github.ts` — GitHub API, stars/forks for open-source products (match via `product.github_repo` field — add column)

### Phase 5 — Signal score computation + Vercel Cron (~1 session)

**Goal**: Nightly job computes `product_signal_scores` row per product, flags breakouts.

- Add `product_signal_scores` table now
- `scripts/jobs/compute-signal-scores.ts` — implements master doc's weighted formula
- `is_breakout = velocity > 2 * stddev(90-day rolling avg)`
- Wire up Vercel Cron (`vercel.json`):
  - `0 6 * * *` → `/api/cron/ingest-product-hunt`
  - `0 * * * *` → `/api/cron/ingest-news`
  - `30 */6 * * *` → `/api/cron/ingest-social`
  - `0 3 * * *` → `/api/cron/compute-signals`

### Phase 6+ — Everything else (graveyard, funding correlation, graph viz, historical data)

Defer until Phase 1-5 are live and generating insights. The master doc Phase 2 (historical arc, 1960s-70s products) is the real moat but requires Phase 1 to be solid first.

---

## My Thoughts on the Master Doc

**What's great:**
- Schema is thorough and production-grade
- Signal score formula is sound (velocity weighted highest = correct, velocity is predictive)
- The historical arc (Phase 2) is genuinely a defensible moat — nobody else has it
- Funding → mention spike correlation is a smart leading-indicator insight

**Where I'd push back:**
1. **Don't migrate the full 15-table schema on day 1.** Migrate 6 tables, ship a vertical slice, add tables as features need them. Premature schema = dead columns + orphaned tables.
2. **Product Hunt has an official GraphQL API** — don't use Firecrawl for it. Firecrawl is $$ and slower. Keep Firecrawl for Crunchbase public pages, archive.org, and vintage sources where no API exists.
3. **Logo acquisition needs its own module with fallback cascade** — single-source logos will have 30%+ missing rate. Multi-source cascade gets to ~95% coverage.
4. **Supabase Storage for logos, not hotlinking** — external CDNs break images over time; you'll see broken logos in 6 months. Download + store once.
5. **`primary_function` as free-text is a mistake** — it'll become unnormalized garbage ("note-taking", "notes", "notetaking", "note app"). Make it a FK to a `functions` enum table, seed with ~200 canonical values, let Claude pick from that list during extraction.
6. **Skip Twitter/X API ($100/mo) until Phase 5** — HN + Reddit + GitHub cover 80% of the signal for 0% of the cost. X is nice-to-have, not must-have.
7. **`confidence_score` is good but add `data_freshness`** — every signal needs a "last verified" timestamp so stale data can be flagged in the UI ("Funding data last verified 8 months ago").

---

## Answer to the Logo Question

**Yes, absolutely doable — but don't rely on Firecrawl alone.** Use the 5-tier cascade above. Expected coverage:
- Product Hunt products: ~99% (their API returns logo URL directly)
- Non-PH SaaS products: ~90% (Brandfetch + Clearbit get most of them)
- Indie/niche products: ~70% (Firecrawl og:image fallback)
- Hardware/physical products: ~60% (hardest case, need manual curation)

Store logos in Supabase Storage (`product-logos/{slug}.{ext}`), track source + confidence, and build a simple admin page later for manually fixing the ~5-10% that come through wrong.

---

---

## Attribute / Taxonomy System (requested add-on)

Category alone is too coarse. "Productivity" lumps Notion + Todoist + RescueTime + Linear together — totally different beasts. A granular attribute layer unlocks real filtering, side-by-side comparison, TAAFT-style discovery ("tools to write cold emails"), and the knowledge graph edges.

### Design: 3-Layer Classification

**Layer 1 — Hierarchical taxonomy** (single-value per product):
- `category` — top level (~15 values): AI Tools, Dev Tools, Productivity, Design, Marketing, Analytics, Finance, Communication, Security, Data, Hardware, Entertainment, Education, Health, E-commerce
- `sub_category` — mid level (~100 values): "Code Editors", "Note-Taking Apps", "CRM", "Email Marketing", "Vector Databases"...
- `primary_function` — leaf level (~400 canonical values): "markdown-note-editor", "ai-code-completion", "transactional-email-api", "block-based-wiki"

Only the leaf is a FK to a `functions` table. Categories + sub-categories derive from the function's parent chain. This avoids Notion/Obsidian getting tagged as both "Note-Taking" and "Wiki" and "Productivity" — one leaf, multiple ancestors auto-inferred.

**Layer 2 — Multi-select attributes** (many-to-many via `product_tags`):
Tags live in `tags` table with a `tag_group` column. Each group is a controlled vocabulary Claude picks from during extraction.

| Group | Example values | Used for |
|-------|----------------|----------|
| `capability` | collaborative, real-time, offline-capable, version-history, ai-assist, api-first, webhook-support, mobile-sync, e2e-encrypted | Feature filters |
| `audience` | developers, designers, marketers, solopreneurs, smb, enterprise, students, researchers, creators | Audience pages |
| `pricing_model` | free, freemium, free-trial, paid-only, open-source, perpetual, pay-per-use, open-core | Pricing filters |
| `deployment` | cloud, self-hosted, desktop-app, mobile-app, browser-extension, cli, api-only, hardware | Deployment filters |
| `integration` | slack, notion, zapier, google-workspace, github, vscode, obsidian, linear, figma, stripe | "Works with X" pages |
| `compliance` | soc2, hipaa, gdpr, ccpa, iso27001, pci-dss, fedramp | Enterprise filtering |
| `tech_stack` | react, rust, python, go, typescript, wasm, postgresql, sqlite | Dev-tool filters |
| `data_format` | markdown, json, csv, sql, images, video, audio, 3d-models, code | "Works with X format" |
| `ux_pattern` | keyboard-first, command-palette, no-code, low-code, drag-drop, visual-builder, ai-chat-ui, kanban, calendar, timeline | UX discovery |
| `business_model` | saas, marketplace, ads, freemium, open-source-funded, hardware-sales, data-licensing | Business filters |

**Layer 3 — Task-based discovery tags** (`task_search_tags TEXT[]` on products):
This is the TAAFT magic. Short action phrases extracted from product description: `["write cold emails", "summarize meeting notes", "generate sql queries", "remove image backgrounds", "transcribe video"]`. Powers:
- `/tools-to/{task}` SEO pages — massive long-tail traffic driver
- Natural language search ("I need to...")
- Cross-product comparison when two products solve the same task with different approaches

**Layer 4 — Dimensional scoring** (`functionality_scores JSONB` — already in master schema):
Futurepedia-style 1-5 scores on consistent dimensions:
```json
{
  "ease_of_use": 4,
  "feature_depth": 5,
  "value_for_money": 3,
  "customer_support": 4,
  "performance": 5,
  "documentation": 4,
  "mobile_experience": 3,
  "integrations": 5
}
```
Initially Claude-estimated during ingestion (with `score_source: "ai_estimated"` flag); later replaced by real review data from G2/Capterra scraping.

### Schema changes required

Add to `products` table (on top of master schema):
```sql
ALTER TABLE products
  ADD COLUMN sub_category TEXT,
  ADD COLUMN logo_url TEXT,
  ADD COLUMN logo_source TEXT,
  ADD COLUMN logo_confidence SMALLINT DEFAULT 3,
  ADD COLUMN github_repo TEXT,
  ADD COLUMN functionality_scores JSONB,
  ADD COLUMN task_search_tags TEXT[],
  ADD COLUMN attributes_verified_at TIMESTAMPTZ;
```

New table:
```sql
CREATE TABLE functions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,           -- canonical slug e.g. "markdown-note-editor"
  display_name TEXT NOT NULL,          -- "Markdown Note Editor"
  parent_id UUID REFERENCES functions(id),   -- tree: function → sub_category → category
  depth SMALLINT NOT NULL,             -- 0 = category, 1 = sub_category, 2 = function
  description TEXT,
  product_count INT DEFAULT 0          -- denormalized for fast lookup
);
CREATE INDEX idx_functions_parent ON functions(parent_id);
CREATE INDEX idx_functions_depth ON functions(depth);
```

Then `products.primary_function` becomes a FK: `primary_function_id UUID REFERENCES functions(id)`.

### How Claude extracts attributes during ingestion

Update the extraction prompt in `scripts/ingest/product-hunt.ts` to return a structured attribute bundle. Critical: **give Claude the controlled vocabulary in the prompt** so it picks from the list instead of inventing new values.

```typescript
const ATTRIBUTE_VOCABULARY = {
  capability: ["collaborative", "real-time", "offline-capable", ...],
  audience: ["developers", "designers", ...],
  // ... all groups
};

// In the extraction prompt:
`For each product return:
{
  "name": "...",
  "primary_function": "markdown-note-editor",  // MUST be from this list: [full list]
  "attributes": {
    "capability": ["collaborative", "ai-assist"],  // MUST be from: [full list]
    "audience": ["developers", "solopreneurs"],
    "pricing_model": ["freemium"],
    ...
  },
  "task_search_tags": ["take meeting notes", "write documentation"],
  "functionality_scores": { ... }
}`
```

Write a validation layer that drops any attribute value not in the vocabulary (log as "vocabulary miss" to review and potentially add).

### Seeding the vocabulary

Before running ingestion, seed the `functions` tree and tag vocabulary. Two options:
1. **Manual** — Ali writes the initial ~400 functions + ~15 categories + ~10 attribute groups × 15 values = ~550 canonical values. Time: ~3 hours. Quality: high.
2. **AI-bootstrapped + human-reviewed** — Claude generates a first draft from scraping Product Hunt's own category/topic list + TAAFT's taxonomy, then Ali reviews and edits. Time: ~1 hour. Quality: needs cleanup.

Recommendation: **option 2**. Save the output as `supabase/seed/functions.sql` + `supabase/seed/tags.sql` — committed to git, re-runnable.

### UI surfaces this unlocks

With this taxonomy layer the v0 UI gains:
- **Faceted filter sidebar** on `/products` page — checkboxes per attribute group (shadcn `Checkbox` + `Accordion` already available)
- **Function pages** `/functions/markdown-note-editor` — all products that do this, ranked by buzz score, category lifecycle chart
- **Task pages** `/tools-to/write-cold-emails` — TAAFT-style SEO goldmine
- **Compare view** `/compare?a=notion&b=obsidian` — side-by-side on all attributes + dimensional scores (radar chart via recharts)
- **Alternative finder** `/products/notion/alternatives` — products sharing the same primary_function, sorted by attribute overlap score

None of these require schema changes beyond what's above.

### Integration with the phased plan

Slot this into the roadmap:
- **Phase 0**: add `functions` table + attribute columns to initial migration
- **Phase 0.5 (new)**: seed vocabulary (1 hour) — MUST happen before Phase 1 ingestion or we get unnormalized garbage
- **Phase 1**: extraction prompt includes vocabulary; ingestion writes attributes alongside products
- **Phase 2**: faceted filter UI, compare view, function/task pages (this becomes the UI cut-over's killer feature, not just mock→live)
- **Phase 6+**: review velocity scraping from G2 to replace AI-estimated `functionality_scores`

---

## Critical Files to Create/Modify

**New files:**
- `prism/supabase/migrations/0001_initial_schema.sql` — 6-table minimal schema
- `prism/lib/supabase/server.ts` + `client.ts`
- `prism/lib/logos/fetch-logo.ts` — cascade logic
- `prism/lib/queries/products.ts`
- `prism/scripts/ingest/product-hunt.ts`
- `prism/types/database.types.ts` (generated)

**Files to modify:**
- `lib/mock-data.ts` → delete in Phase 2
- `components/product-card.tsx` → use DB types
- `app/page.tsx`, `app/products/page.tsx`, `app/products/[slug]/page.tsx` → convert to server components with Supabase queries
- `package.json` → add deps
- `.env.local` → add keys

---

## Full UI Map — Wireframe Level

Every page with grid-level widget placement, data source per widget, and the user question it answers. Dense enough to be implementation-ready. ASCII wireframes use 12-col grid notation; `[NEW]` = not in v0 scaffold yet.

### Page inventory (quick reference)

| Route | Status | Purpose |
|-------|--------|---------|
| `/` | v0 exists, rebuild | Feed — breaking news of products |
| `/products` | v0 exists, extend | Faceted browse + filter |
| `/dossier/[slug]` | [NEW] rename from `/products/[slug]` | Full product intelligence file |
| `/markets` | [NEW] | Bloomberg-style market analytics |
| `/functions/[slug]` | [NEW] | Leaf taxonomy page per primary_function |
| `/categories/[slug]` | v0 exists, extend | Category rollup page |
| `/sub-categories/[slug]` | [NEW] | Mid-level taxonomy rollup |
| `/attributes/[group]/[value]` | [NEW] | Attribute slice |
| `/tools-to/[task]` | [NEW] | Task-based SEO page |
| `/compare` | [NEW] | Side-by-side comparison |
| `/companies/[slug]` | [NEW] | Company profile |
| `/trending` | [NEW] | Breakout feed |
| `/insights` | v0 exists, extend | Articles/research hub |
| `/insights/[slug]` | v0 exists, extend | Article reader with graph sidebar |
| `/explore` | v0 exists, extend | Global knowledge graph |
| `/evolution` | v0 exists, extend | Era-based timeline |
| `/graveyard` | v0 exists, extend | Discontinued products |
| `/funding` | [NEW] | Funding round feed |
| `/acquisitions` | [NEW] | M&A tracker |
| `/search` | [NEW] | Unified search results |
| `/watchlist` | [NEW, Phase 4] | User's saved products + alerts |
| `/dashboard` | [NEW, Phase 4] | User dashboard |
| `/submit` | [NEW] | Product submission form |
| `/pricing` | [NEW] | Monetization |
| `/api/docs` | [NEW] | API reference |
| `/login`, `/signup`, `/profile` | v0 exists, wire up | Auth |

### Global chrome

**Header** (sticky, every page):
```
┌──────────────────────────────────────────────────────────────────────┐
│ [PRISM logo]  Feed • Products • Markets • Insights • Explore        │
│                                        ⌘K search   🔔 alerts   👤   │
└──────────────────────────────────────────────────────────────────────┘
```
Data: `lib/branding.ts` for logo+name, auth state from Supabase session, notification count from `user_alerts` table (Phase 4+).

**Footer**: about, pricing, api, changelog, rss, twitter, github, legal.

---

### `/` — Home (Feed)

*First thing shipped. Product Hunt-style present-tense launch feed with Bloomberg-style signal overlays.*

```
┌──────────────────────────────────────────────────────────────────────┐
│ HERO STRIP: "47 new products today • 312 this week • 8 breakouts"   │
│              [Submit your product →]                                  │
├───────────────────────────────────────────┬──────────────────────────┤
│  🚀 LAUNCHED TODAY                        │  📊 MARKET PULSE         │
│  ┌──────┬──────┬──────┬──────┐            │  (stacked sparklines)    │
│  │ card │ card │ card │ card │            │  AI Tools    ▲ +12%      │
│  ├──────┼──────┼──────┼──────┤            │  Dev Tools   ▲ +8%       │
│  │ card │ card │ card │ card │            │  Productivity─  0%       │
│  └──────┴──────┴──────┴──────┘            │  Design      ▼ -2%       │
│  [view all today's launches →]            │  Finance     ▼ -3%       │
│                                           │  [view markets →]        │
│  ⚡ BREAKOUT ALERTS                        ├──────────────────────────┤
│  ┌─────────────────────────────┐          │                          │
│  │ [logo] Product X            │          │  📰 FROM THE NEWS        │
│  │        velocity +340%       │          │  (vertical feed)         │
│  │        [mini sparkline]     │          │  • TechCrunch — 2h       │
│  ├─────────────────────────────┤          │    "Notion raises..."    │
│  │ [logo] Product Y  +220%     │          │  • The Verge  — 4h       │
│  │ [logo] Product Z  +180%     │          │  • HN         — 6h       │
│  └─────────────────────────────┘          │  (infinite scroll)       │
│  [view all breakouts →]                   │                          │
│                                           ├──────────────────────────┤
│  📈 TRENDING THIS WEEK                    │                          │
│  1. [logo] Product — +67 pts ▲            │  💰 FRESH FUNDING        │
│  2. [logo] Product — +54 pts ▲            │  • $50M Series B → X     │
│  3. [logo] Product — +48 pts ▲            │  • $12M Seed → Y         │
│  ... (top 10 ranked)                      │  • Acquired Z → BigCo    │
│                                           │  [funding feed →]        │
│  🏛️ CATEGORY SPOTLIGHT                     ├──────────────────────────┤
│  "Note-taking apps peaked in 2019"        │                          │
│  ┌────────────────────────────┐           │  🪦 GRAVEYARD THIS WEEK  │
│  │  [lifecycle area chart]    │           │  • Product X — 3d ago    │
│  │  product count 1990→2026   │           │  • Product Y — acquired  │
│  └────────────────────────────┘           │  [graveyard →]           │
│  [explore markets →]                      │                          │
└───────────────────────────────────────────┴──────────────────────────┘
```

**Widget table:**

| Widget | Position | Data source | Viz | User question |
|--------|----------|-------------|-----|---------------|
| Hero strip | top full | `COUNT(products) WHERE launched_date = CURRENT_DATE` + breakout count | text stats | "what's happening today?" |
| Launched Today | main col, row 1 | `products ORDER BY launched_date DESC LIMIT 8` | 4×2 card grid | "what just shipped?" |
| Market Pulse | right rail, row 1 | `market_size_snapshots` last 7d velocity per category | stacked mini-sparklines | "which sectors are moving?" |
| Breakout Alerts | main col, row 2 | `product_signal_scores WHERE is_breakout = TRUE AND score_date = today LIMIT 5` | card list w/ sparkline | "which products are going vertical?" |
| From the News | right rail, row 2 | `press_mentions ORDER BY mention_date DESC LIMIT 15` | vertical feed | "what's the press saying?" |
| Trending This Week | main col, row 3 | `product_signal_scores 7d delta` ranked | ranked list w/ delta pills | "who's winning the week?" |
| Fresh Funding | right rail, row 3 | `funding_rounds ORDER BY year,month DESC LIMIT 6` | vertical list w/ $ badges | "where's the money flowing?" |
| Category Spotlight | main col, row 4 | rotating `functions.depth = 0`, lifecycle data | area chart (recharts) | "how did this category evolve?" |
| Graveyard This Week | right rail, row 4 | `product_graveyard ORDER BY death_date DESC LIMIT 5` | small list | "who died recently?" |

---

### `/dossier/[slug]` — Full product intelligence file

*The premium unit. This is the monetizable page. Long-scroll with sticky TOC.*

```
┌──────────────────────────────────────────────────────────────────────┐
│ ┌─────┐                                                               │
│ │LOGO │  PRODUCT NAME                            [🔖 Save] [📤 Share] │
│ │ 96x │  Tagline line goes here                                      │
│ │ 96  │  [AI Tools] [Note-Taking] [Markdown-Editor]  ●active         │
│ └─────┘  🔗 website  🐙 github  🐦 twitter  📖 docs                   │
├──────────────────────────────────────────────────────────────────────┤
│  QUICK STATS STRIP                                                   │
│  ┌─────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐            │
│  │Age  │Fund  │Score │Breakout│Rev  │Empl │Lspan│Conf  │            │
│  │6yrs │$280M │87 ▲  │  YES   │$45M │247  │ -   │ 5/5  │            │
│  └─────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘            │
├──────────────┬───────────────────────────────────────────────────────┤
│ STICKY TOC   │  MAIN CONTENT                                         │
│              │                                                       │
│ • Overview   │  📝 DESCRIPTION                                       │
│ • Attributes │  Long-form product description from PH/scraped...    │
│ • Scores     │                                                       │
│ • Signals    │  📸 SCREENSHOTS                                       │
│ • Funding    │  ┌───┬───┬───┐                                        │
│ • Revenue    │  │img│img│img│  (embla carousel)                      │
│ • Press      │  └───┴───┴───┘                                        │
│ • Relations  │                                                       │
│ • Graveyard  │  🏷️  ATTRIBUTE PANEL                                  │
│ • Alts       │  Capabilities: [collaborative] [real-time] [ai-assist]│
│ • Changes    │  Audience:     [developers] [solopreneurs]            │
│ • Related    │  Pricing:      [freemium] [has-free-tier]             │
│              │  Deployment:   [cloud] [desktop-app]                  │
│              │  Integrations: [slack] [notion] [zapier]              │
│              │  Compliance:   [soc2] [gdpr]                          │
│              │  UX:           [keyboard-first] [command-palette]     │
│              │                                                       │
│              │  📊 DIMENSIONAL SCORES (radar chart)                  │
│              │  ┌──────────────────┐                                 │
│              │  │      /\          │  Ease of use      4/5           │
│              │  │     /  \         │  Feature depth    5/5           │
│              │  │    /RADR\        │  Value            3/5           │
│              │  │   /      \       │  Support          4/5           │
│              │  │  /________\      │  Performance      5/5           │
│              │  └──────────────────┘  ... (8 dims)                   │
│              │                                                       │
│              │  🔥 SIGNAL CHARTS (2×2 grid)                          │
│              │  ┌────────────────┬───────────────┐                   │
│              │  │ Mention volume │ Sentiment     │                   │
│              │  │ stacked bar    │ rolling line  │                   │
│              │  │ by platform    │ 30-day        │                   │
│              │  ├────────────────┼───────────────┤                   │
│              │  │ Velocity (WoW) │ Platform mix  │                   │
│              │  │ line chart     │ donut         │                   │
│              │  └────────────────┴───────────────┘                   │
│              │                                                       │
│              │  💰 FUNDING & VALUATION TIMELINE                      │
│              │  ┌──────────────────────────────┐                     │
│              │  │ dual-axis: rounds dots       │                     │
│              │  │ + valuation line             │                     │
│              │  │ 2019 ────● Seed $2M          │                     │
│              │  │ 2020 ─────● A $12M           │                     │
│              │  │ 2022 ──────● B $50M ┐        │                     │
│              │  │ 2024 ───────● C $150M│ val   │                     │
│              │  └──────────────────────────────┘                     │
│              │  [investor list table below]                          │
│              │                                                       │
│              │  📈 REVENUE / ARR (if data)                           │
│              │  ┌──────────────────────────────┐                     │
│              │  │ area chart — years × $       │                     │
│              │  └──────────────────────────────┘                     │
│              │                                                       │
│              │  📰 PRESS MENTIONS (chronological feed)               │
│              │  • TC  — "X raises $50M..."  [sentiment +]  2024-03   │
│              │  • Verge "X vs Y..."         [sentiment 0]  2024-01   │
│              │  • HN   — top story           [+340 pts]    2023-11   │
│              │  (paginated, filter by source)                        │
│              │                                                       │
│              │  🕸️  PRODUCT RELATIONSHIPS                             │
│              │  ┌──────────────────────────────┐                     │
│              │  │  mini force-graph            │                     │
│              │  │     ● competed_with          │                     │
│              │  │    /                         │                     │
│              │  │  (X)─── killed ───→ ● Y      │                     │
│              │  │    \                         │                     │
│              │  │     ● inspired ──→ ● Z       │                     │
│              │  └──────────────────────────────┘                     │
│              │  [open in Explore →]                                   │
│              │                                                       │
│              │  🔄 ALTERNATIVES & COMPETITORS                        │
│              │  ┌────┬────┬────┬────┐                                │
│              │  │card│card│card│card│  (attribute overlap sorted)    │
│              │  └────┴────┴────┴────┘                                │
│              │                                                       │
│              │  📜 CHANGELOG / HISTORY                               │
│              │  2024-03 acquired by BigCo [source]                   │
│              │  2023-09 pivoted from X to Y [source]                 │
│              │  2022-05 launched API        [source]                 │
│              │                                                       │
│              │  🎯 RELATED TASKS                                     │
│              │  Tools to: [write docs] [take notes] [sync across devices]│
│              │                                                       │
│              │  📖 RELATED INSIGHTS                                  │
│              │  • "The markdown wars of 2022" — Prism Research       │
│              │                                                       │
│              │  ℹ️  DATA METADATA                                     │
│              │  Source: product_hunt • Confidence 5/5                │
│              │  Last verified: 2h ago • 47 data points               │
└──────────────┴───────────────────────────────────────────────────────┘
```

**Widget table:**

| Widget | Position | Data source | Viz | User question |
|--------|----------|-------------|-----|---------------|
| Hero | top full | `products + companies` JOIN | large header | identity |
| Quick stats strip | below hero | computed from 6 tables | 8 stat tiles | at-a-glance status |
| Sticky TOC | left rail | anchors to sections | nav list | navigation |
| Description | main | `products.description` | prose | context |
| Screenshots | main | `products.screenshots[]` | embla carousel | visual |
| Attributes panel | main | `product_tags JOIN tags GROUP BY tag_group` | grouped pill rows | structured overview |
| Dimensional scores | main | `products.functionality_scores JSONB` | radar chart (recharts) | comparative strengths |
| Mention volume | main 2×2 grid | `social_mentions GROUP BY platform, month` | stacked bar | how loud is buzz |
| Sentiment trend | main 2×2 grid | `social_mentions.sentiment_avg 30d rolling` | line chart | how is it being received |
| Velocity | main 2×2 grid | `product_signal_scores.wow_velocity` | line chart | is it accelerating |
| Platform breakdown | main 2×2 grid | `social_mentions GROUP BY platform` | donut | where the buzz lives |
| Funding timeline | main | `funding_rounds ORDER BY year,month` | dual-axis dot+line | money history |
| Revenue chart | main | `revenue_snapshots` | area chart | business size |
| Press mentions | main | `press_mentions WHERE product_id` | paginated feed | press coverage |
| Relationships graph | main | `product_relationships` | mini force-graph | ecosystem position |
| Alternatives | main | products w/ same `primary_function_id` ORDER BY overlap | card grid | what else is out there |
| Changelog | main | `product_changelog` | timeline list | what changed |
| Related tasks | main | `products.task_search_tags[]` | tag chips → /tools-to/ | discovery |
| Related insights | main | `insights` matching product | article cards | editorial context |
| Metadata footer | bottom | `products.source, confidence, updated_at` | info strip | data trust |

---

### `/markets` — Bloomberg-style analytics

*This is where "investment $ in word processing apps 1990→now" lives. The Bloomberg layer.*

```
┌──────────────────────────────────────────────────────────────────────┐
│  MARKETS — Tech Product Intelligence Layer                           │
│  [Category ▾]  [Attribute ▾]  [Time Range ▾]  [Export CSV]          │
├──────────────────────────────────────────────────────────────────────┤
│  🗺️  CATEGORY HEATMAP (full width)                                    │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │        2019  2020  2021  2022  2023  2024  2025  2026        │    │
│  │ AI     ░░░░  ▓▓▓▓  ████  ████  ████  ████  ████  ████        │    │
│  │ DevT   ▓▓▓▓  ▓▓▓▓  ████  ████  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ████        │    │
│  │ Prod   ▓▓▓▓  ▓▓▓▓  ████  ████  ▓▓▓▓  ░░░░  ░░░░  ░░░░        │    │
│  │ ... (cell color = total VC $ that period, tooltip shows $)   │    │
│  └──────────────────────────────────────────────────────────────┘    │
├──────────────────────────────┬───────────────────────────────────────┤
│                              │                                       │
│  💰 FUNDING VELOCITY         │  📊 CATEGORY LIFECYCLE CURVES         │
│  LEADERBOARD (last 90d)      │  (multi-line — product count/year)    │
│  1. AI Tools      $4.2B      │  ┌────────────────────────────┐       │
│  2. Dev Tools     $1.8B      │  │ Notes ─╱╲___                │       │
│  3. Fintech       $1.5B      │  │ CRM    ──__╱──              │       │
│  4. Security      $900M      │  │ Word Proc  ╲____            │       │
│  5. Design        $400M      │  │ 1990    2000    2010    2026│       │
│  ...                         │  └────────────────────────────┘       │
│                              │                                       │
├──────────────────────────────┼───────────────────────────────────────┤
│                              │                                       │
│  📈 SURVIVAL CURVES          │  🎯 ATTRIBUTE MARKET SHARE             │
│  (by cohort year)            │  (stacked area: open-source vs       │
│  "Of products launched in X, │   proprietary revenue in dev tools)  │
│   what % still alive in Y?"  │  ┌────────────────────────────┐       │
│  ┌──────────────────────┐    │  │   ██ open-source           │       │
│  │ 2015 ──╲              │    │  │   ▓▓ proprietary           │       │
│  │ 2018 ───╲____         │    │  │ stacked area 2010→2026     │       │
│  │ 2020 ─────╲___        │    │  └────────────────────────────┘       │
│  │ 2022 ──────╲__        │    │                                      │
│  │ 0        60mo         │    │  [toggle attribute ▾]                 │
│  └──────────────────────┘    │                                       │
│                              │                                       │
├──────────────────────────────┴───────────────────────────────────────┤
│                                                                      │
│  🛒 ACQUISITION TRACKER (table)                                       │
│  ┌──────────┬─────────┬──────────┬────────┬──────┬───────┐           │
│  │ Acquired │ Acquirer│ Price    │ Type   │ Year │ Out   │           │
│  ├──────────┼─────────┼──────────┼────────┼──────┼───────┤           │
│  │ Figma    │ Adobe   │ $20B     │ full   │ 2024 │ spin  │           │
│  │ Product X│ BigCo   │ $500M    │ full   │ 2024 │ intgr │           │
│  │ ...                                                     │           │
│  └──────────────────────────────────────────────────────────┘         │
│                                                                      │
│  ⚡ BREAKOUT HISTORY                                                   │
│  (time series — how many products hit is_breakout per day)          │
│  ┌────────────────────────────────────────────────┐                  │
│  │ │   │ ││    ││   │  ││││  │  ││                 │                  │
│  │ ││  ││ ││  │││  ││  ││││ ││  │││                │                  │
│  │ ─────────────────────────────────────           │                  │
│  │ Jan   Feb   Mar   Apr   May   Jun               │                  │
│  └────────────────────────────────────────────────┘                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Widget table:**

| Widget | Position | Data source | Viz | User question |
|--------|----------|-------------|-----|---------------|
| Filter bar | top | url query params | controls | narrow the view |
| Category heatmap | full-width row 1 | `market_size_snapshots WHERE scope_type='category'` pivoted | heatmap grid | "where is the money going?" |
| Funding velocity leaderboard | L col, row 2 | `SUM(funding_rounds.amount_usd) last 90d GROUP BY category` | ranked list | "hottest sectors this quarter?" |
| Category lifecycle curves | R col, row 2 | `market_size_snapshots.active_product_count per year per category` | multi-line | "when did word processors peak?" |
| Survival curves | L col, row 3 | cohort aggregation of `products.launched_year` × `products.discontinued_year` | Kaplan-Meier style | "what % of 2018 products are still alive?" |
| Attribute market share | R col, row 3 | `market_size_snapshots WHERE scope_type='attribute'` | stacked area | "open-source vs proprietary $?" |
| Acquisition tracker | row 4 full | `acquisitions ORDER BY price_usd DESC` | paginated table | "biggest M&A?" |
| Breakout history | row 5 full | `product_signal_scores GROUP BY score_date COUNT(is_breakout)` | time-series bar | "how volatile is the market?" |

**Query to Ali's literal example**: "investment cash in word processing apps 1990→now"
```sql
SELECT period_year, total_funding_usd
FROM market_size_snapshots
WHERE scope_type = 'function'
  AND scope_value = 'word-processor'
  AND period_year BETWEEN 1990 AND 2026
ORDER BY period_year;
```
Rendered as a line chart in the Category Spotlight on home, or the "deep dive" page `/functions/word-processor/markets`.

---

### `/insights` and `/insights/[slug]` — Research hub + article reader

*v0 already has this. Extension: add the Obsidian-style graph in the right rail of the detail page.*

#### `/insights` — hub

```
┌──────────────────────────────────────────────────────────────────────┐
│  INSIGHTS — Research & Deep Dives                                    │
├──────────────────────────────────────────────────────────────────────┤
│  📌 FEATURED ARTICLE (large hero card)                               │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  [cover image]                                               │    │
│  │  "The Markdown Wars of 2022: Obsidian vs Notion vs ..."      │    │
│  │  by Prism Research • 12 min • trend-report                   │    │
│  └──────────────────────────────────────────────────────────────┘    │
├──────────────────────────────┬───────────────────────────────────────┤
│  📑 TREND REPORTS            │  🔬 TEARDOWNS                         │
│  article cards grid          │  article cards grid                   │
├──────────────────────────────┼───────────────────────────────────────┤
│  ⚖️  COMPARISONS              │  💡 DEEP DIVES                        │
│  article cards grid          │  article cards grid                   │
└──────────────────────────────┴───────────────────────────────────────┘
```

#### `/insights/[slug]` — article reader

```
┌──────────────────────────────────────────────────────────────────────┐
│  [← Insights]                                                         │
├──────────────────────────────────┬───────────────────────────────────┤
│                                  │                                   │
│  Article Title Here              │  📚 TABLE OF CONTENTS             │
│  by Author • 12 min • 2024-03    │  • Intro                           │
│                                  │  • The 2022 shift                 │
│  [cover image]                   │  • Notion's moat                  │
│                                  │  • Obsidian's comeback            │
│  Long-form content paragraph...  │                                   │
│  Long-form content paragraph...  ├───────────────────────────────────┤
│  Long-form content paragraph...  │                                   │
│                                  │  🏷️  FEATURED PRODUCTS             │
│  > pull quote                    │  • [logo] Notion     → dossier    │
│                                  │  • [logo] Obsidian   → dossier    │
│  Long-form content paragraph...  │  • [logo] Roam       → dossier    │
│                                  │                                   │
│  [product embed card]            ├───────────────────────────────────┤
│                                  │                                   │
│  Long-form content paragraph...  │  🕸️  PRODUCT RELATIONSHIP GRAPH    │
│                                  │  ┌─────────────────────────────┐   │
│  > pull quote                    │  │   Obsidian ●───────● Notion │   │
│                                  │  │          \       /          │   │
│  Long-form content paragraph...  │  │           ●     ●           │   │
│                                  │  │          Roam  Craft        │   │
│                                  │  │   (force-directed,          │   │
│                                  │  │   click → dossier)          │   │
│                                  │  │   nodes: article products   │   │
│                                  │  │   edges: competed_with,     │   │
│                                  │  │          inspired, killed   │   │
│                                  │  └─────────────────────────────┘   │
│                                  │  [open in Explore →]                │
│                                  │                                   │
│                                  ├───────────────────────────────────┤
│                                  │                                   │
│                                  │  📊 RELATED SIGNAL CHART          │
│                                  │  "Note-taking mention volume      │
│                                  │   2019→2026"                      │
│                                  │  ┌─────────────────────────────┐   │
│                                  │  │ stacked bar, monthly        │   │
│                                  │  └─────────────────────────────┘   │
│                                  │                                   │
└──────────────────────────────────┴───────────────────────────────────┘
```

**Widget table (article detail):**

| Widget | Position | Data source | Viz | User question |
|--------|----------|-------------|-----|---------------|
| Article body | main col | `insights.content` | MDX/prose | the story |
| TOC | right rail top | headings from markdown | nav | jump to section |
| Featured products | right rail mid | `insights.featuredProducts[]` | card list | who's mentioned |
| **Product relationship graph** | right rail lower | `product_relationships WHERE product_id IN (article.featured)` | mini force-graph (Sigma.js or D3) — this is the Obsidian-style viz Ali mentioned | "how do these products connect?" |
| Related signal chart | right rail bottom | aggregate `social_mentions` for featured products' `primary_function` | stacked bar | "what was the buzz context?" |

**Tech for the graph widget**: `graphology` + `sigma.js` for the mini force-graph (lighter than D3), pulls data from a scoped `product_relationships` query limited to the article's featured products + 1 hop of neighbors.

---

### `/products` — Browse / filter

*v0 has a basic version. Extension: add faceted filter sidebar driven by the attribute taxonomy.*

```
┌──────────────────────────────────────────────────────────────────────┐
│  PRODUCTS   [search box]            Sort: Buzz ▾   Grid ☰   List ≡   │
├────────────────────┬─────────────────────────────────────────────────┤
│                    │                                                 │
│  🎛️ FILTERS        │  Active filters: [AI Tools ×] [freemium ×]     │
│                    │                                                 │
│  TAXONOMY          │  ┌────┬────┬────┬────┐                          │
│  └─ Category ▾     │  │card│card│card│card│                          │
│     └ AI Tools ☑   │  ├────┼────┼────┼────┤                          │
│     └ Dev Tools ☐  │  │card│card│card│card│                          │
│     └ Productivity │  ├────┼────┼────┼────┤                          │
│                    │  │card│card│card│card│                          │
│  └─ Sub-category ▾ │  └────┴────┴────┴────┘                          │
│     └ CRM ☐        │                                                 │
│     └ Notes ☐      │  Showing 1-24 of 1,847                          │
│                    │  [← 1 2 3 ... 77 →]                             │
│  └─ Function ▾     │                                                 │
│     (leaf search)  │                                                 │
│                    │                                                 │
│  ATTRIBUTES        │                                                 │
│  ┌── Capability ▾ │                                                 │
│  │  ☑ collabortv  │                                                 │
│  │  ☐ offline     │                                                 │
│  │  ☐ ai-assist   │                                                 │
│  │                 │                                                 │
│  ├── Pricing ▾    │                                                 │
│  │  ☑ freemium    │                                                 │
│  │  ☐ free        │                                                 │
│  │  ☐ paid        │                                                 │
│  │                 │                                                 │
│  ├── Audience ▾   │                                                 │
│  ├── Deployment ▾ │                                                 │
│  ├── Integration▾ │                                                 │
│  ├── Compliance ▾ │                                                 │
│  ├── Tech stack ▾ │                                                 │
│  ├── Data format▾ │                                                 │
│  ├── UX pattern ▾ │                                                 │
│  └── Business ▾   │                                                 │
│                    │                                                 │
│  METADATA          │                                                 │
│  Status: ● active  │                                                 │
│         ○ dead     │                                                 │
│         ○ acquired │                                                 │
│                    │                                                 │
│  Launched 1990─2026│                                                 │
│   [slider]         │                                                 │
│                    │                                                 │
│  Funding $0 ─ $10B │                                                 │
│   [slider]         │                                                 │
│                    │                                                 │
│  [Clear filters]   │                                                 │
└────────────────────┴─────────────────────────────────────────────────┘
```

**Widget table:**

| Widget | Position | Data source | Viz | Purpose |
|--------|----------|-------------|-----|---------|
| Search box | top | full-text search on products | input | keyword search |
| Sort dropdown | top | url param | select | ordering |
| View toggle | top | local state | button | grid vs list |
| Taxonomy tree | sidebar top | `functions` table hierarchical | accordion checkboxes | narrow by what it is |
| Attribute facets | sidebar mid | `tags GROUP BY tag_group` | 10 accordion checkbox groups | narrow by properties |
| Status / year / funding | sidebar bottom | `products` metadata | radio + sliders | narrow by metadata |
| Active filters chips | main top | url params | removable chips | current state |
| Product grid/list | main | filtered `products` query | shadcn cards or rows | results |
| Pagination | main bottom | offset/limit | pagination | navigate |

---

### Remaining pages — compressed specs

*Full wireframes for these in a follow-up pass. Here's the widget-level summary.*

#### `/functions/[slug]` [NEW]
- Header: function name, parent category, product count, total funding in category, median lifespan
- **Market chart**: `market_size_snapshots WHERE scope_type='function' AND scope_value=slug` — line chart $ over time
- **Lifecycle chart**: new launches + deaths per year
- **Attribute heatmap**: which attributes dominate in this function
- **Top 10 by signal score**: ranked product list
- **Full product grid** below

#### `/categories/[slug]` and `/sub-categories/[slug]` — same shape as functions page, one level higher

#### `/tools-to/[task]` [NEW]
- H1: "Best tools to {task}" (SEO-optimized)
- Top 10 ranked product cards matching `task_search_tags @> ARRAY[task]`
- Quick-compare table: logo, name, pricing, key attributes, score
- "Related tasks" chip row at bottom

#### `/compare?a=x&b=y` [NEW]
- 2-col header: two dossier hero cards side by side
- **Radar chart overlay**: both products' `functionality_scores` on same radar
- **Attribute diff table**: 3 cols (A-only | both | B-only)
- **Signal chart overlay**: mention volume both products same timeline
- **Funding comparison**: dual bar chart of total raised
- **Verdict strip**: AI-generated one-liner ("A wins on features, B wins on price")

#### `/companies/[slug]` [NEW]
- Company header: logo, founded year, HQ, employees
- **All products grid**: every product by this company
- **Funding timeline**: full funding history across products
- **Valuation chart**: `valuation_snapshots` over time
- **Related companies**: invested-together, acquired-by-same, same-stage
- **News feed**: press mentions of this company

#### `/trending` [NEW]
- Header: total breakouts this week
- **Breakout feed**: infinite scroll of products with `is_breakout = TRUE`, sorted by velocity
- Filter sidebar: by category, attribute, time window
- **Velocity chart**: time series of global breakout count

#### `/funding` [NEW]
- Funding round feed (table): date, company, product, round type, amount, investors, source
- **Funding volume chart**: weekly $ total bar chart
- Filter: by stage, category, amount range
- Latest rounds sticky top

#### `/acquisitions` [NEW]
- Table of all acquisitions with filters
- **M&A volume chart**: monthly $ bar chart
- **Top acquirers leaderboard**: companies by total spent
- **Acquisition price distribution**: histogram

#### `/attributes/[group]/[value]` [NEW]
- Header: attribute name, product count, growth trend
- **Growth chart**: products with this attribute over time
- **Revenue rollup**: `market_size_snapshots WHERE scope_type='attribute'`
- **Top products grid**

#### `/graveyard` (v0 exists, extend)
- Grouped-by-year sections of dead products
- **Death reason pie chart**: shutdown / acquired / pivoted / bankruptcy
- **Pre-death signal teaser**: "these products showed warning signs — subscribe for alerts"
- Filter by category, year range, death reason

#### `/evolution` (v0 exists, extend)
- Era-based horizontal scroll: mainframe → PC → web1 → mobile → AI
- Each era: product count, top products, key events
- **Era transition lines**: when one era's products died vs new era's products launched

#### `/explore` (v0 exists, extend)
- Full-screen force-directed graph of `product_relationships`
- Filter panel: relationship types, categories, time range
- Click node → side drawer with dossier preview + "open dossier" button

#### `/search` [NEW]
- Unified results: products + companies + articles + press mentions in tabs
- Faceted filters in sidebar
- Semantic + keyword hybrid (pgvector + full-text)

#### `/watchlist` [NEW, Phase 4+]
- Saved products grid
- Per-product alert settings (breakout / funding / news / death)
- Digest frequency control
- Recent alerts feed

#### `/dashboard` [NEW, Phase 4+]
- User's activity: recently viewed dossiers, saved count, export count
- Custom watchlists with quick switcher
- API key section (if pro tier)
- Usage stats (dossier views this month against limit)

#### `/pricing` [NEW]
- 4-tier card layout: Free / Pro / API / Enterprise
- Feature comparison table
- FAQ
- CTA per tier

#### `/api/docs` [NEW]
- OpenAPI spec viewer
- Endpoint reference
- Auth docs
- Rate limits per tier
- Example requests in curl/JS/Python
- "Get API key" CTA

#### `/submit` [NEW]
- Product submission form: name, url, category, description, logo upload
- Auto-fetch metadata from url (uses same logo cascade + Firecrawl scrape)
- Duplicate detection
- Admin review queue (`submissions` table, not ingested until approved)

#### `/login`, `/signup`, `/profile` — v0 exists as UI
- Phase 4: wire up Supabase Auth (email + Google + GitHub OAuth)
- Profile: display name, avatar, email, linked accounts, pro tier status

---

### Global chrome (every page)
- **Site header**: logo + wordmark (from `lib/branding.ts`), primary nav (Feed, Products, Dossiers, Markets, Insights, Explore), search command palette (⌘K), sign-in button, theme toggle (deferred)
- **Site footer**: about, pricing, API, changelog, twitter, github, rss feed link

### `/` — Home (Feed)
*The Product Hunt-style landing page. First thing shipped.*
- Hero bar: "X new products today • Y launches this week"
- **Launch Today** section — grid of products launched in last 24h with upvote-style indicator
- **Breakout Alerts** section — products where `is_breakout = TRUE` today (signal velocity > 2 stddev)
- **Trending This Week** — top 10 by 7-day buzz delta, ranked list with sparkline
- **Fresh Funding** — latest funding rounds (pulled from `funding_rounds`, linked to product dossiers)
- **From the News** — latest `press_mentions` with source logo + snippet
- **Product Graveyard Highlight** — 1 recently discontinued product with death reason (tease to `/graveyard`)
- **Category spotlight** — rotating deep-dive into one category with lifecycle chart
- **Submit product CTA** — sticky footer bar

### `/products` — Browse / filter
- Left sidebar: **faceted filter panel** (shadcn Accordion per attribute group)
  - Category / sub-category / function (hierarchical tree)
  - All 10 attribute groups as checkbox lists (capability, audience, pricing_model, deployment, integration, compliance, tech_stack, data_format, ux_pattern, business_model)
  - Status filter (active / discontinued / acquired)
  - Launch year range slider
  - Funding range slider
  - "Has logo", "Has press", "Has funding" quick toggles
- Top bar: search, sort (buzz / trending / newest / A-Z / funding), grid/list toggle
- Main: product cards grid (reuses `product-card.tsx`)
- Active filters as removable chips

### `/dossier/[slug]` — Full product intelligence file
*The premium unit. This is what gets monetized.*

Sections (anchor-navigated tabs or long-scroll with sticky TOC):
1. **Hero** — large logo, name, tagline, category badges, status, website/github/twitter links, save/share buttons
2. **Quick stats strip** — founded year, age in years, lifespan (if dead), total funding, last round, employee count (if known), signal score, breakout flag
3. **Attribute panel** — all multi-select attributes grouped by tag_group, as colored pills
4. **Dimensional scores** — radar chart (recharts) showing 8 dimensions: ease-of-use, feature-depth, value-for-money, support, performance, docs, mobile, integrations
5. **Description + screenshots** — long-form description, screenshot carousel, video embed (if available)
6. **Signal charts** — 4 sub-charts (already in master doc):
   - Mention volume over time (monthly bar chart, stacked by platform)
   - Sentiment trend (30-day rolling line)
   - Velocity score (WoW change)
   - Platform breakdown (donut: Reddit/HN/X/news/GitHub)
7. **Funding & valuation timeline** — dual-axis chart: funding rounds as points + valuation line
8. **Revenue/ARR chart** — if data available (often null for private)
9. **Press mentions** — chronological feed, filterable by publication, with sentiment indicators
10. **Alternatives & competitors** — grid of products sharing same `primary_function`, sorted by attribute overlap score
11. **Product relationships graph** — mini force-graph showing "killed", "inspired", "competed_with", "acquired" edges to other products
12. **Historical events** — acquisitions, pivots, rebrand moments from `product_changelog`
13. **Similar by attribute** — "products with this same 8-dim score profile"
14. **Related tasks** — TAAFT-style task tags → links to `/tools-to/{task}` pages
15. **Related articles** — `insights` entries that mention this product
16. **Dossier metadata footer** — source, confidence, last verified, data freshness per field

### `/markets` — Market-level analytics (NEW)
*The Bloomberg layer. Queries the financial/signal aggregations.*
- **Category heatmap** — grid of categories × time, cell color = total VC invested that period
- **Lifecycle curves** — line chart per sub-category showing product count + median lifespan over time
- **Survival curves** — cohort analysis: "products launched in 2018 — what % still alive?"
- **Attribute market share** — stacked area chart: "open-source vs proprietary revenue over time in dev tools"
- **Funding velocity leaderboard** — categories ranked by $ raised in last 90 days
- **Acquisition tracker** — M&A feed, acquirer → acquired, price, multiple
- **Breakout history** — time series of how many products hit `is_breakout` per day (sentiment of the overall tech market)

### `/functions/[slug]` — Function leaf page (NEW)
*e.g. /functions/markdown-note-editor*
- All products with this primary_function
- Lifecycle chart: new launches per year + deaths per year
- Revenue rollup: total market $ for this function over time
- Dominant attributes in this function (heatmap)
- Top 5 ranked by signal score
- Comparison matrix of top 10 across dimensional scores

### `/tools-to/[task]` — Task-based discovery (NEW)
*e.g. /tools-to/write-cold-emails — massive SEO long-tail*
- "Best tools to [task]" H1
- Products ranked by buzz score matching `task_search_tags`
- Quick-compare table
- Related tasks

### `/compare?a=x&b=y` — Side-by-side (NEW)
- Two dossier previews side by side
- Radar chart of dimensional scores overlaid
- Attribute diff (what A has that B doesn't, and vice versa)
- Signal score charts compared
- Funding comparison
- "Verdict" summary line

### `/attributes/[group]/[value]` — Attribute slice (NEW)
*e.g. /attributes/capability/open-source, /attributes/compliance/soc2*
- All products with this attribute
- Growth chart: how many products have this attribute over time
- Revenue/funding rollup for this attribute slice
- Top products by signal score

### `/companies/[slug]` — Company view (NEW)
- All products by this company
- Full funding history timeline
- Employee count over time (if data)
- News/press mentions
- Acquisition status
- Related companies (invested in same round, acquired by same acquirer)

### `/trending` — Breakout feed
- Real-time feed of products with `is_breakout = TRUE`
- Sort by velocity, by category, by attribute
- Chart: breakout count over time

### `/insights` and `/insights/[slug]` — Articles
*Already in v0. Editorial content, AI-generated trend reports, teardowns.*

### `/explore` — Knowledge graph
*Already in v0. Force-graph viz of product relationships.*

### `/evolution` — Historical timeline
*Already in v0. Era-based scroll: mainframe → PC → web1 → mobile → AI.*

### `/graveyard` — Discontinued products
*Already in v0. Grouped by year, death reason, acquirer.*

### `/search` — Full-text search results (NEW)
- Unified search across products, companies, articles, press mentions
- Facet filters on left
- Semantic + keyword hybrid

### `/watchlist` — User's saved products + alerts (NEW, user feature, Phase 4+)
- Saved products grid
- Alert settings per product (breakout / funding / news / death)
- Email digest frequency

### `/dashboard` — User dashboard (NEW, Phase 4+)
- Recent activity
- Saved dossiers count
- Custom watchlists
- API key (if pro tier)

### `/pricing` (NEW, monetization)
- Free tier: 10 dossiers/mo
- Pro tier: unlimited dossiers + alerts + exports
- API tier: programmatic access, rate limits
- Data tier: CSV exports + webhooks
- Enterprise: custom datasets, API volume, SLA

### `/api/docs` (NEW, monetization)
- OpenAPI spec
- Endpoint reference
- Auth
- Example queries
- Pricing link

### `/login`, `/signup`, `/profile`
*Already in v0 as UI-only. Phase 4: wire up Supabase Auth.*

### `/submit` — Product submission form (NEW, community)
*Let users submit products for review. Admin approves → ingested.*

---

## Visual UI Map — Excalidraw Deliverable

Before any code is written, produce a comprehensive Excalidraw file at `prism/docs/ui-map.excalidraw` that visualizes the full app. Ali specifically wants to see the entire scope at a glance across desktop, tablet, and mobile breakpoints.

### Why Excalidraw (not Figma)

1. **Already in Ali's toolkit** — `excalidraw-toolkit` project exists in his workspace (per memory)
2. **Text-first, fast to edit** — the file is JSON, easy to revise as scope changes
3. **Live-editable in the browser** — Excalidraw.com + local import; no Figma account needed
4. **Version-controllable** — commits to git cleanly unlike Figma which requires external links

### File structure

One `.excalidraw` file with multiple zoom-level sections arranged spatially:

```
┌──────────────────────────────────────────────────────────────────────┐
│  SECTION 1 — SITEMAP (top-left zoom target)                          │
│  Tree/graph of all 25 routes with auth gates + user flow arrows      │
│                                                                       │
│  SECTION 2 — DESKTOP WIREFRAMES (center, largest)                    │
│  Grid of wireframe panels for each page                              │
│  ┌────────┬────────┬────────┬────────┐                                │
│  │ /      │/products│/dossier│/markets│                                │
│  ├────────┼────────┼────────┼────────┤                                │
│  │/insight│/compare│/trend  │...     │                                │
│  └────────┴────────┴────────┴────────┘                                │
│                                                                       │
│  SECTION 3 — TABLET WIREFRAMES (right of desktop)                    │
│  Same pages, 768px collapsed layouts                                 │
│                                                                       │
│  SECTION 4 — MOBILE WIREFRAMES (far right)                           │
│  Same pages, 375px single-column layouts                             │
│                                                                       │
│  SECTION 5 — USER FLOWS (bottom)                                     │
│  Flow diagrams: signup → first dossier, browse → compare → save,     │
│  search → filter → dossier, funding alert → dossier                  │
│                                                                       │
│  SECTION 6 — COMPONENT LIBRARY (bottom-right)                        │
│  Reusable panels: card variants, attribute chips, signal charts,     │
│  navigation, filter sidebar                                          │
└──────────────────────────────────────────────────────────────────────┘
```

### Scope reality

| Approach | Panels | Effort | Output quality |
|----------|--------|--------|----------------|
| **Full scope** | 25 routes × 3 breakpoints = 75 panels + 6 flows + sitemap + component library | 3-4 sessions | Comprehensive, ready-to-hand-to-dev |
| **Focused (Recommended)** | 10 critical pages × 3 breakpoints = 30 panels + sitemap + 4 flows + component library | 1-2 sessions | Covers 80% of UX decisions, rest get added as they're built |
| **Minimum viable** | 5 critical pages × 3 breakpoints = 15 panels + sitemap | 1 session | Enough to align on architecture, missing many pages |

**Recommendation**: Focused scope. The 10 critical pages are Home, Products (browse), Dossier, Markets, Functions/[slug], Compare, Insights/[slug] (with the graph widget), Trending, Companies/[slug], Graveyard. Everything else gets added incrementally.

### Per-panel content

Each wireframe panel includes:
- Page title + route at top
- Header strip (logo + nav)
- Grid regions labeled with widget names
- Key widget placeholders drawn as boxes (e.g. "RADAR CHART", "FORCE GRAPH", "FUNDING TIMELINE")
- Arrows showing interactions (click → navigation, hover → tooltip)
- Small text annotations for data source (e.g. "→ product_signal_scores")
- Status badges: [v0] if exists, [NEW] if not, [PHASE X] if deferred

### Excalidraw creation process

1. Use the `excalidraw` skill / Excalidraw MCP tools (`mcp__excalidraw__*`) — already available in this environment
2. Build SECTION 1 (sitemap) first — this is the cheapest anchor
3. Build SECTION 2 (desktop wireframes) next, starting with the 5 critical pages
4. Clone desktop → tablet → mobile with progressive collapse rules:
   - Desktop: 2-col main + right rail
   - Tablet (768px): main full-width, right rail collapses below main
   - Mobile (375px): single column, all sections stacked, sidebar becomes bottom drawer
5. SECTION 5 (user flows) last
6. Save as `prism/docs/ui-map.excalidraw` in the repo
7. Commit with message `docs(ui): initial UI wireframe map across breakpoints`

### Responsive rules baked into every page

These are the breakpoint-specific rules that apply to every wireframe:

| Element | Desktop (>1024px) | Tablet (768–1024px) | Mobile (<768px) |
|---------|-------------------|---------------------|-----------------|
| Site header | Full horizontal nav | Full nav, condensed | Hamburger menu |
| Dossier layout | Sticky left TOC + main | Top horizontal tabs + main | Collapsible accordion sections |
| Faceted filter | Left sidebar permanent | Top drawer overlay | Bottom sheet modal |
| Card grid | 4 columns | 2 columns | 1 column |
| Right rail (home) | 30% width right | Collapses below main | Stacked below main |
| Radar/Force graph | 400×400 | 320×320 | 280×280 |
| Tables (markets page) | Full multi-col | Horizontal scroll | Card-per-row stacked |
| Search | ⌘K palette | ⌘K palette + button | Full-screen overlay |

---

## Financial / Market Analytics Layer

This is how Ali gets "associate investments, sales, $ figures with products, app types, attributes, over time." Bloomberg-style aggregation, not per-product only.

### Schema additions (on top of master doc)

**Already covered by master schema:**
- `funding_rounds` — per-round $ data ✓
- `revenue_snapshots` — per-year revenue ✓
- `products.monthly_visits_est` — traffic proxy ✓

**New tables needed for the Bloomberg layer:**

```sql
-- ─────────────────────────────────────────────
-- MARKET SIZE SNAPSHOTS — rolls up $ to category/function level
-- ─────────────────────────────────────────────
CREATE TABLE market_size_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type TEXT NOT NULL,            -- 'category' | 'sub_category' | 'function' | 'attribute'
  scope_value TEXT NOT NULL,           -- 'productivity' | 'markdown-note-editor' | 'open-source' etc.
  period_year INT NOT NULL,
  period_quarter SMALLINT,             -- nullable for annual data
  total_funding_usd BIGINT,
  total_revenue_est_usd BIGINT,
  active_product_count INT,
  new_product_count INT,
  dead_product_count INT,
  median_valuation_usd BIGINT,
  top_acquisition_usd BIGINT,
  source_confidence SMALLINT,          -- 1-5, reflects coverage completeness
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scope_type, scope_value, period_year, period_quarter)
);
CREATE INDEX idx_market_size_scope ON market_size_snapshots(scope_type, scope_value);
CREATE INDEX idx_market_size_period ON market_size_snapshots(period_year DESC);

-- ─────────────────────────────────────────────
-- ACQUISITIONS (denormalized from funding_rounds for fast M&A queries)
-- ─────────────────────────────────────────────
CREATE TABLE acquisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acquired_product_id UUID REFERENCES products(id),
  acquired_company_id UUID REFERENCES companies(id),
  acquirer_company_id UUID REFERENCES companies(id),
  price_usd BIGINT,
  price_is_estimated BOOLEAN DEFAULT FALSE,
  announcement_year INT NOT NULL,
  announcement_month INT,
  close_year INT,
  close_month INT,
  acquisition_type TEXT,               -- 'full' | 'asset' | 'talent' | 'merger'
  outcome TEXT,                        -- 'integrated' | 'shutdown' | 'spin_off' | 'pivoted'
  source_url TEXT,
  notes TEXT
);

-- ─────────────────────────────────────────────
-- VALUATION TIMELINE — private valuations over time
-- ─────────────────────────────────────────────
CREATE TABLE valuation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  snapshot_date DATE NOT NULL,
  valuation_usd BIGINT NOT NULL,
  valuation_type TEXT,                 -- 'post-money' | 'pre-money' | 'secondary' | 'tender' | 'ipo'
  source TEXT,
  source_url TEXT,
  is_estimated BOOLEAN DEFAULT FALSE
);
```

### The aggregation job (`scripts/jobs/compute-market-sizes.ts`)

Runs nightly. For each attribute/category/function, sums:
- Total funding raised in period
- Estimated revenue (sum of `revenue_snapshots`)
- Active product count
- New launches, deaths
- Median valuation, top acquisition

Writes rows to `market_size_snapshots`. This pre-computes the expensive queries so `/markets` loads fast.

### UI queries this unlocks

- "Total VC invested in AI Tools per quarter 2020–2026" → bar chart
- "Revenue growth of SaaS vs perpetual-license companies" → dual line chart
- "Average valuation of open-source companies over time" → line chart
- "Which sub-category has raised the most in the last 90 days?" → leaderboard
- "Top 10 acquisitions by price in 2025 in dev tools" → ranked table
- "Category lifecycle: when did note-taking apps peak?" → product-count-over-time area chart
- "Survival rate of 2018-cohort SaaS products in 2026" → cohort chart

### Data sourcing for $ figures

| Source | Coverage | Cost | Notes |
|--------|----------|------|-------|
| **Crunchbase public pages via Firecrawl** | High | $ per scrape | Crunchbase public pages have funding data. Scrape on demand. Cheaper than their API ($49/mo). |
| **SEC EDGAR API** | Public companies only | Free | 10-K / 10-Q filings for revenue, 8-K for material events |
| **Press releases via RSS** | Medium | Free | Funding round announcements appear on TC/Verge feeds |
| **TechCrunch funding tag feed** | High | Free | TC has a dedicated funding feed, auto-parseable |
| **Wikipedia "company" infobox** | Medium | Free | Scrape for founding year, HQ, employee count, revenue |
| **Manual curation for vintage** | Low | Labor | For Phase 2 historical data |

**Key insight**: Firecrawl-scraping Crunchbase public pages is a **huge cost saver** vs their $49/mo API — they don't block scraping aggressively if rate-limited. This is where Ali's "kickstart with Firecrawl" preference pays off.

---

## Beyond-Mentions Signals — What else can we use for "trending & popular"?

Mention volume across platforms is the obvious signal. Here's what nobody else is using that we can capture for ~free:

### Tier 1 — Free, massive signal, criminally underused

| Signal | Why it matters | API / source | Cost |
|--------|---------------|--------------|------|
| **Wikipedia pageviews** | Historical data back to 2015, reliable "does the world care about this thing" metric. Nobody tracks it for tech products but it's the best lagging popularity signal available. | `wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/{title}/daily/...` | **Free** |
| **Tranco top 1M websites** | Academic-grade replacement for Alexa rank. Monthly ranking of every website in the world. Cross-reference product domains to get popularity rank over time. | `tranco-list.eu` — free CSV download | **Free** |
| **GitHub star velocity** | Not just stars, but rate of star accrual per day. A project gaining 100 stars/day vs 10 stars/day is a 10x signal — raw star count hides that. | GitHub API (already in plan) | **Free** |
| **GitHub contributor growth** | Unique contributors in last 30/90 days. Healthier than stars because fake stars exist but fake contributors don't. | GitHub API | **Free** |
| **Academic paper citations** | For research-y products (LangChain, Hugging Face models, vector DBs, research tools). Papers citing the product in their methodology = adoption proxy. | Semantic Scholar API | **Free** |
| **Wayback Machine snapshot frequency** | How often a product's landing page gets archived = proxy for press/interest. Products trending hot get archived more. | CDX API | **Free** |
| **Subdomain discovery** | CT logs (crt.sh, certstream) track new subdomains as SSL certs get issued. A company spinning up `api.x.com`, `dashboard.x.com`, `docs.x.com` in one week = product expansion signal. | `crt.sh` — free queries | **Free** |
| **DNS query volume** | Cloudflare publishes top-queried domains. Quantcast retired but similar data exists. | Cloudflare Radar (free API) | **Free** |
| **npm download counts** | For JS libraries / dev tools. Weekly downloads over time. | `api.npmjs.org/downloads/point/last-week/{package}` | **Free** |
| **PyPI download counts** | Same for Python packages. | `pypistats.org` API | **Free** |
| **Docker Hub pull counts** | Container adoption signal for infra tools. | Docker Hub API | **Free** |
| **Homebrew analytics** | Install counts for Mac dev tools. | `formulae.brew.sh/analytics/` | **Free** |
| **Chrome Web Store installs** | Extension install counts + trajectory. | Scrape via Firecrawl | **$** |
| **VS Code Marketplace installs** | Extension install counts for VS Code tools. | Marketplace API | **Free** |
| **YouTube video count for product name** | How many tutorial/review videos exist + recent upload velocity. | YouTube Data API free tier | **Free** |
| **Reddit subreddit size + growth** | Products with own subreddit: member count over time = fan base proxy. | Reddit API | **Free** |

### Tier 2 — Paid but high-signal

| Signal | Cost | Notes |
|--------|------|-------|
| **BuiltWith technology adoption** | $295+/mo | Tracks what tech powers what sites over time. "Is this CMS growing or shrinking?" Defer to Phase 6+. |
| **SimilarWeb traffic** | $200+/mo | Already in master doc. Defer. |
| **App Annie / Sensor Tower mobile data** | $1k+/mo | App Store rank + downloads. Mobile-only. Defer until needed. |
| **Glassdoor review count + rating** | Scrape or paid | Employee sentiment = company health. Scrape for free via Firecrawl. |
| **LinkedIn employee count + growth** | Scrape | Headcount = company growth. Public profile scraping. |

### Tier 3 — Indirect / inference signals

- **Hiring page crawl** — count of open roles over time (company growth indicator)
- **Blog post velocity** — publishing frequency (company momentum)
- **Changelog update frequency** — shipping velocity
- **Commit velocity for open-source** — development momentum
- **Conference talk count** — talks mentioning product at conferences (scrape schedules)
- **Podcast mention count** — Listen Notes API tracks this (free tier exists)

### Top 5 to add to Phase 1 ingestion (in order of ROI)

1. **GitHub star velocity + contributor count** — already planned, just add velocity calc
2. **Wikipedia pageviews** — trivial API, massive historical signal, 1 day of work
3. **npm / PyPI / Docker Hub download counts** — for dev-tool products (huge % of Product Hunt)
4. **Wayback Machine snapshot frequency** — free CDX API, 1 day of work
5. **Tranco website ranking** — monthly CSV cross-reference, 1 day of work

These 5 together give you a **composite popularity index** that goes way beyond "mentions on Reddit this week."

### Schema addition for non-mention signals

```sql
-- Extend social_mentions to be signal_snapshots (more generic)
-- OR add a parallel table:
CREATE TABLE popularity_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  signal_type TEXT NOT NULL,           -- 'wikipedia_pageviews' | 'github_stars' | 'npm_downloads' | 'tranco_rank' | 'wayback_snapshots' | 'subreddit_members' | ...
  snapshot_date DATE NOT NULL,
  value BIGINT NOT NULL,               -- raw count / rank / etc
  velocity NUMERIC(10,4),              -- rate of change
  source TEXT,
  metadata JSONB,
  UNIQUE(product_id, signal_type, snapshot_date)
);
CREATE INDEX idx_popularity_signals_product_type ON popularity_signals(product_id, signal_type, snapshot_date DESC);
```

Update `product_signal_scores` formula to include these:

```
Signal Score = (
  mention_volume      * 0.15 +
  sentiment           * 0.10 +
  velocity            * 0.20 +
  press_coverage      * 0.10 +
  funding_velocity    * 0.10 +
  popularity_index    * 0.20 +    -- NEW: Wikipedia + Tranco + downloads composite
  developer_adoption  * 0.15      -- NEW: GitHub stars + contributors + package downloads
) normalized 0–100
```

---

## Cost Breakdown — Lean Mode

Ali's constraint: **keep running costs as low as possible** while still hitting Phase 0–2 (500 products + logos + live UI). Everything below assumes aggressive free-tier usage and cost-minimization choices.

### Phase 0–2 (MVP, seed 500 products, live site): **~$0–10/mo + ~$8 one-time**

| Line item | Cost | Notes |
|-----------|------|-------|
| Vercel Hobby | **$0** | Free tier covers static hosting + 2 cron jobs (Phase 5+ needs Pro for >2 crons) |
| Supabase Free | **$0** | 500MB DB + 1GB storage + 50k MAU. Plenty for 500 products + logos. Upgrade only when DB > 500MB (~10k products) |
| Domain | **~$1/mo** | Namecheap/Cloudflare, ~$12/yr |
| Anthropic (Claude **Sonnet 4.6**, NOT Opus) | **~$8 one-time seed + ~$5/mo** | See detailed math below |
| Product Hunt API | **$0** | Free developer token |
| Brandfetch free tier | **$0** | 500 req/mo — enough for 500 products initial seed |
| Clearbit Logo API | **$0** | No key required |
| Firecrawl free tier | **$0** | 500 scrapes/mo free. Only used as logo fallback (tier 4) so actual usage = maybe 50/mo |
| Google favicon | **$0** | Free public endpoint |
| **MVP TOTAL** | **~$6–10/mo** | |

### Critical cost-lever: use Claude Sonnet 4.6 for extraction, not Opus

This is the single biggest cost knob. Opus 4.6 is ~5x more expensive than Sonnet 4.6 for roughly-equivalent extraction quality on structured tasks like "parse product page → JSON."

| Model | Input $/M tokens | Output $/M tokens | Cost per product (3k in / 500 out) | 500 products | 50/day for 30 days |
|-------|-----------------|-------------------|-------------------------------------|--------------|---------------------|
| **Sonnet 4.6** | ~$3 | ~$15 | **$0.0165** | **$8.25** | **$24.75/mo** |
| Opus 4.6 | ~$15 | ~$75 | $0.0825 | $41.25 | $123.75/mo |

**Rule**: Sonnet for bulk extraction (PH ingestion, news article parsing). Opus only for deeply nuanced analysis (graph relationship inference, historical context). This alone saves ~$100/mo at modest scale.

### Phase 3–5 (news + social + signal scoring, ~5k products): **~$50–80/mo**

| Line item | Cost | Why it jumps |
|-----------|------|--------------|
| Vercel Pro | **$20/mo** | Needed for >2 cron jobs + longer execution time |
| Supabase Pro | **$25/mo** | DB > 500MB at ~10k products. Also gets daily backups. |
| Anthropic (Sonnet) | **~$15–25/mo** | More ingestion volume + news article analysis |
| Firecrawl Hobby | **$16/mo** | 3k scrapes — only if Free tier (500/mo) exhausted. Defer as long as possible. |
| Brandfetch | **$0** | Stay on free tier by rate-limiting |
| Reddit / HN / GitHub APIs | **$0** | All free |
| Domain | **$1/mo** | |
| **Phase 3–5 TOTAL** | **~$60–90/mo** | |

### Phase 6+ (historical data, 50k+ products): **~$300–800/mo at full scale**

This is when costs start mattering. Drivers: Firecrawl Growth tier ($333/mo for vintage archive scraping), SimilarWeb/Semrush ($250+/mo for real traffic data), Crunchbase API ($49/mo), optional Twitter/X API ($100/mo), scaled Supabase + Vercel + Anthropic. **But you don't need any of this until monetization is proven.**

### Cost-minimization rules baked into the plan

1. **Sonnet 4.6 for all extraction** — never Opus unless specifically required
2. **RSS before Firecrawl** — news feed uses `rss-parser` (free) for all 8 news sources, Firecrawl reserved only for sites without RSS
3. **Batch Claude calls** — extract 10 products per API call instead of 1-per-call (10x fewer round-trips, ~same token cost)
4. **Aggressive caching** — store every API response in Supabase with a `fetched_at` timestamp, don't re-fetch anything inside 24h
5. **Defer Brandfetch paid tier** — stay on 500/mo free tier by throttling logo refresh to 500 NEW products per month (older products already have logos cached)
6. **Defer Firecrawl paid tier** — logo fallback only hits ~10% of products, so 500/mo free = 5,000 products covered. Don't upgrade until you hit that ceiling.
7. **Defer Vercel/Supabase Pro** — stay on free tiers until you genuinely blow a limit. Most Phase 0–2 work fits comfortably.
8. **Skip Twitter/X API entirely until Phase 5+** — $100/mo for marginal signal. Reddit + HN + GitHub cover 80% of social signal for $0.
9. **Skip SimilarWeb/Semrush until monetization exists** — $250+/mo is not worth it for an unmonetized product. Estimate traffic manually for key products if needed.
10. **One-time seed, not continuous full re-scrape** — after Phase 1 seeds 500 products once, daily ingestion only adds NEW products (~50/day). The expensive 500-product bulk extraction only happens once.

### Realistic monthly burn at each stage

| Stage | Products | Monthly burn | What you have |
|-------|----------|--------------|---------------|
| Phase 0–2 MVP | 500 | **$6–10** | Live site, real data, logos, dossier pages |
| Phase 3 — RSS news | 500 | **$10–15** | + daily news feed, press mentions linked to products |
| Phase 4 — social signals | 2k | **$25–40** | + Reddit/HN/GitHub data, basic buzz scores |
| Phase 5 — signal job + cron | 5k | **$60–90** | + nightly signal scores, breakout detection, 4 cron jobs |
| Phase 6+ at scale | 50k+ | **$300–800** | + historical archive, premium signals, monetization-ready |

**Bottom line**: you can run Prism for **under $10/month through Phase 2** — all the way to a live site with 500 real products + logos + dossier pages. Costs only meaningfully start at Phase 4 (social signals) where you hit ~$25–40/mo. You don't spend >$100/mo until you have 5k+ products and 4 running ingestion jobs.

---

## Verification Plan

**Phase 0 end:** `SELECT * FROM products LIMIT 1;` returns empty result (schema exists, table queryable)
**Phase 1 end:** `SELECT COUNT(*), COUNT(logo_url) FROM products;` returns 500+ rows with 95%+ logo coverage; logos visually verified in Supabase Storage bucket
**Phase 2 end:** Homepage + products page load real data from Supabase, 0 references to `mock-data.ts` in codebase, Vercel deploy returns 200
**Phase 3 end:** `SELECT COUNT(*) FROM press_mentions WHERE created_at > NOW() - INTERVAL '24 hours';` returns >20
**Phase 4 end:** `SELECT COUNT(DISTINCT product_id) FROM social_mentions WHERE snapshot_date = CURRENT_DATE;` returns >200
**Phase 5 end:** Vercel Cron dashboard shows all 4 jobs green; at least one product has `is_breakout = TRUE`

End-to-end test: visit homepage → see real product with real logo, real buzz score, real press mention from last 24h.
