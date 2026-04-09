---
title: Prism
codename: prism
final-name: TBD
created: 2026-04-09
type: project
status: planning-complete-pre-execution
directory: C:\Users\alima\v0-product-sentinel (will rename to prism when name locked)
wireframe: C:\Users\alima\Desktop\Excalidraw Files\prism-ui-map.excalidraw
tags:
  - project
  - nextjs
  - react-19
  - tailwind-4
  - shadcn-ui
  - supabase
  - firecrawl
  - anthropic
  - github-actions
  - product-intelligence
  - analytics
  - bloomberg-style
  - typescript
---

# Prism

> **Bloomberg meets Product Hunt** — a platform for the entire arc of tech product history. Tracks products from the 1960s through today with signal scoring, attribute-based taxonomy, knowledge graph, dossiers, and market analytics.

> **Codename only.** Final product name TBD. `prism` metaphor: breaks products into their component attributes/facets, just like a prism breaks light into its component colors. Everything is grep-replaceable when final name locks.

> **This is NOT [[Launch Sentinel]]** — that's a separate older project in `C:\Users\alima\product-hunt-app\`. Prism is a from-scratch rebuild starting from the v0-product-sentinel repo (Next.js 16 + shadcn/ui scaffold).

## Core Value Proposition

Every competitor (Product Hunt, Futurepedia, Toolify, TAAFT, G2, AlternativeTo) is **present-tense only**. Nobody tracks:
- Historical timelines (how products evolved from 1960s → now)
- Category lifecycle curves (when did "to-do apps" peak?)
- Survival rates by cohort year
- Product graveyard + pre-death signal patterns
- Revenue/funding overlaid on product history
- Attribute-based market analytics (e.g. "VC $ into word processors 1990→now")

## Codename System

| Concept | Name | Notes |
|---------|------|-------|
| Project / repo / Supabase project | `prism` | Placeholder until final brand locks |
| Full product intelligence file | `dossier` | Sub-brand. Route `/dossier/[slug]`, "Open dossier" CTA |
| Product attribute taxonomy system | `prism-layer` | Metaphorical link: breaks into facets |
| Branding source of truth | `lib/branding.ts` | Single file — rename = 1-file edit |

## Decisions Locked

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Codename | `prism` | Final name TBD, brainstorm list saved below |
| Dossier sub-brand | yes | `/dossier/[slug]`, monetizable unit (free: 10/mo, pro: unlimited, API: paid) |
| Vocabulary seeding | AI draft + 1hr human review | Saved as `supabase/seed/functions.sql` + `tags.sql` |
| Logo source cascade | PH GraphQL → Brandfetch → Clearbit → Firecrawl → Google favicon | Full 5-tier, Firecrawl from day 1 |
| Execution philosophy | Working backward from today | Ship Product Hunt-style modern feed FIRST, backfill historical depth later |
| Cron runtime | GitHub Actions (free for public repos) | NOT Vercel Pro ($20/mo saved) |
| LLM for extraction | Claude Sonnet 4.6 | NOT Opus (5× cheaper for structured extraction) |
| LLM for news classification | Claude Haiku 4.5 + keyword pre-filter | News feed cost: $7/mo vs naive $125/mo |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 + React 19 + App Router |
| UI | shadcn/ui + Tailwind CSS 4 + Lucide icons |
| Fonts | Geist + Geist_Mono + Fraunces (already wired in v0) |
| Database | Supabase (PostgreSQL, pgvector, pg_trgm, pg_cron) |
| Auth | Supabase Auth (Phase 4+) |
| Hosting | Vercel (Hobby tier) |
| Cron runtime | GitHub Actions (public repo, free) |
| Scraping | Firecrawl (Hobby tier $16/mo) |
| LLM | Anthropic Claude API (Sonnet + Haiku mix) |
| Charts | recharts + custom D3 for graph viz |
| Graph viz | graphology + sigma.js for Obsidian-style force graphs |

## Starting Point (What's Already Built in v0)

The v0-product-sentinel Next.js scaffold is 100% UI-complete with mock data. Built pages:
- `/` (home/feed), `/products`, `/products/[slug]` → will rename to `/dossier/[slug]`
- `/categories/[slug]`, `/insights`, `/insights/[slug]`
- `/explore` (force-graph viz already built), `/evolution`, `/graveyard`
- `/login`, `/signup`, `/profile` (UI-only, no auth wired)

Reusable components:
- `product-card.tsx` — 4 variants (default, compact, featured, list)
- `market-pulse.tsx` — recharts analytics widget
- `news-feed.tsx` — real-time styled feed
- `search-command.tsx` — ⌘K command palette
- `site-header.tsx`, `site-footer.tsx`
- 56 shadcn/ui primitives under `components/ui/`

Known bugs in v0 scaffold:
- `app/categories/[slug]/page.tsx:204` references `b.buzzScore.total` but type is `b.buzz.score` → runtime error waiting to happen, will fix during type reconciliation

Gaps to fill:
- Zero backend: no `/app/api/`, no Supabase client, no auth, no middleware
- All data is mock (`lib/mock-data.ts` — 1,197 lines to replace)
- Brand string "Sentinel" hardcoded in `site-header.tsx` + `layout.tsx` metadata (rename targets)

## 4-Layer Attribute Taxonomy (the prism metaphor)

Category alone is too coarse. This is the breakdown system that makes products queryable at fine grain.

### Layer 1 — Hierarchical taxonomy (single-value per product)
- `category` (~15 top-level: AI Tools, Dev Tools, Productivity, Design, Marketing, Finance, etc.)
- `sub_category` (~100 mid-level: "Code Editors", "Note-Taking Apps", "Vector DBs", etc.)
- `primary_function` (~400 leaf values: "markdown-note-editor", "ai-code-completion", etc.)

Leaf is FK to `functions` table; category + sub-category auto-derive from parent chain.

### Layer 2 — Multi-select attributes (many-to-many via `product_tags`)
10 attribute groups, each a controlled vocabulary Claude picks from during extraction:
- `capability` — collaborative, real-time, offline-capable, ai-assist, api-first, e2e-encrypted
- `audience` — developers, designers, marketers, solopreneurs, smb, enterprise
- `pricing_model` — free, freemium, paid-only, open-source, pay-per-use
- `deployment` — cloud, self-hosted, desktop-app, mobile-app, browser-extension, cli
- `integration` — slack, notion, zapier, google-workspace, github, vscode
- `compliance` — soc2, hipaa, gdpr, ccpa, iso27001, pci-dss
- `tech_stack` — react, rust, python, go, typescript, wasm
- `data_format` — markdown, json, csv, sql, images, video
- `ux_pattern` — keyboard-first, command-palette, no-code, drag-drop, ai-chat-ui
- `business_model` — saas, marketplace, ads, open-source-funded, hardware-sales

### Layer 3 — Task-based tags (`task_search_tags TEXT[]`)
TAAFT-style: `["write cold emails", "summarize meeting notes", "remove image backgrounds"]` → powers `/tools-to/{task}` SEO long-tail pages.

### Layer 4 — Dimensional scoring (`functionality_scores JSONB`)
Futurepedia-style 1-5 ratings: ease_of_use, feature_depth, value_for_money, support, performance, documentation, mobile, integrations. AI-estimated at ingestion (`score_source: "ai_estimated"`), later replaced by G2/Capterra real reviews.

### What this unlocks
- Faceted filter sidebar on `/products`
- Compare view with radar overlay + attribute diff
- Alternative finder sorted by attribute overlap
- `/functions/[slug]` pages with market rollups
- `/tools-to/[task]` SEO goldmine

## Financial / Market Analytics Layer

Tracks $ figures over time across products, categories, functions, attributes.

New tables beyond master schema:
- `market_size_snapshots` — rolls up $ to category/function/attribute level per year/quarter
- `acquisitions` — denormalized M&A feed
- `valuation_snapshots` — private valuations over time
- `popularity_signals` — beyond-mention signals (Wikipedia pageviews, Tranco rank, GitHub stars, npm downloads, etc.)

Queries this unlocks:
- "VC $ invested in AI Tools per quarter 2020→2026"
- "Revenue growth SaaS vs perpetual-license"
- "Average valuation of open-source companies"
- "Which category raised the most in last 90 days?"
- "Survival rate of 2018 cohort in 2026"
- "When did note-taking apps peak?"
- Ali's literal example: "Total funding into word processors 1990→now"

## Beyond-Mentions Signals

Signals most competitors aren't using (all free):
- **Wikipedia pageviews** — free API, back to 2015, reliable popularity proxy
- **Tranco top-1M website ranking** — academic-grade, free CSV monthly
- **GitHub star velocity** — rate of change, not raw count
- **GitHub contributor count** — fake stars exist, fake contributors don't
- **npm / PyPI / Docker Hub download counts** — for dev tool products
- **Wayback Machine snapshot frequency** — press interest proxy
- **SSL cert transparency logs** — new subdomain velocity = product expansion
- **Homebrew analytics** — Mac dev tool install counts
- **VS Code Marketplace installs** — extension adoption
- **Academic paper citations** — Semantic Scholar API free
- **Reddit subreddit size + growth** — fan base proxy
- **Discord server member counts** — community size

Top 5 to add in Phase 1: GitHub star velocity, Wikipedia pageviews, package downloads, Wayback snapshots, Tranco rank.

## Multi-Source Ingestion Strategy

### Week 1 sources (all free APIs, no Firecrawl)
| Source | Method | Yield/day | Cost |
|--------|--------|-----------|------|
| Product Hunt GraphQL API | Official dev token | 100-200 candidates | Free |
| Hacker News "Show HN" | Algolia API | 5-15 | Free |
| GitHub Trending | GH API / scrape | 10-20 | Free |
| Reddit r/SideProject + r/InternetIsBeautiful | Reddit API | 10-20 | Free |

### Week 2 additional sources (Firecrawl scrapes)
- Indie Hackers products (revenue bonus data)
- BetaList (pre-launch)
- TAAFT / Futurepedia (AI tools)
- AlternativeTo (alternatives graph)

### Dedup cascade (without this DB becomes garbage)
1. slug exact match
2. Root domain match
3. Name fuzzy (`pg_trgm` > 0.8)
4. Twitter handle
5. GitHub repo
6. pgvector embedding similarity > 0.9

### News feed automation (cost-optimized)
- 8 RSS sources (TC, Verge, HN, PH, VentureBeat, Wired, Ars, MIT Tech Review)
- Keyword pre-filter (skip 80% of articles) → Claude Haiku classifier → Sonnet only for funding articles
- Naive: $125/mo → Optimized: **$7/mo**

## Realistic Cost Breakdown

| Phase | Monthly Burn | Products | What You Have |
|-------|--------------|----------|---------------|
| 0-2 MVP | **$6-10** | 500 | Live site + real data + logos + dossier pages |
| 3 RSS news | $10-15 | 500 | + automated news feed + press mentions |
| 4 Social signals | $25-40 | 2k | + Reddit/HN/GitHub signals |
| 5 Signal scoring | **$47** | 5k | + breakout detection + 4 cron jobs (full automation) |
| 6+ at scale | $300-800 | 50k+ | + historical + premium signals + monetization |

**Hard cost ceiling: ~$47/mo for full automation** with 15 products/day + hourly news + dedup + logos. Firecrawl ($16) + Claude API (~$30) + domain ($1).

Stretch ultra-lean: ~$30/mo via batching Claude calls + aggressive caching.

## Week-by-Week Execution Plan

### Week 1 — Ship something live
- Day 1: Foundation (rename repo, Supabase project, deps, branding.ts)
- Day 2: Schema migration + vocabulary seed
- Day 3: Excalidraw UI map (✅ Round 1+2 done — see wireframe path)
- Day 4: Logo pipeline + Product Hunt single-source ingestion (50 products)
- Day 5: UI cut-over (delete mock, query Supabase, deploy to preview)
- Day 6: Automation wiring (GitHub Actions crons for 4 sources)
- Day 7: News feed automation (RSS + Haiku + funding escalation)

### Week 2 — Expand
- Week 2 sources (Firecrawl: Indie Hackers, BetaList, TAAFT, AlternativeTo)
- Faceted filter sidebar on `/products`
- Dossier rich layout
- `/trending` page

### Week 3 — Markets layer
- `market_size_snapshots` + aggregation job
- `/markets` page (heatmap, lifecycle curves, funding leaderboard, survival curves, M&A tracker)
- `/functions/[slug]` pages

### Week 4 — Beyond-mentions signals
- Wikipedia pageviews, GitHub star velocity, package downloads, Wayback, Tranco
- Composite popularity index in signal score formula

### Week 5+ — Graveyard, compare, insights/graph, Phase 2 historical data

## UI Wireframes (Excalidraw)

File: `C:\Users\alima\Desktop\Excalidraw Files\prism-ui-map.excalidraw`
Open via: https://excalidraw.com → drag file onto canvas.

### Round 1 panels (3 panels, hi-def)
1. **SITEMAP** — 25 routes in 4 color-coded sections (Discovery/Intelligence/Research/User)
2. **`/` HOME** — Feed with Launched Today 4×2 grid, Breakout Alerts, Trending, Category Spotlight with lifecycle chart, Market Pulse sparklines, News feed, Fresh Funding, Graveyard
3. **`/dossier/[slug]`** — Hero + quick stats + sticky TOC + description/screenshots + attribute panel + dimensional radar chart + 2×2 signal charts + funding timeline + press mentions + relationship force-graph + alternatives + changelog + tasks + metadata

### Round 2 panels (8 panels, hi-def)
4. **`/markets`** — Bloomberg analytics: category heatmap, funding leaderboard, lifecycle curves, survival curves, attribute market share, acquisition tracker, breakout history
5. **`/products`** — Faceted filter sidebar with 10 attribute groups + 4×6 product grid + pagination
6. **`/insights/[slug]`** — Article reader with Obsidian-style force graph in right sidebar (dark canvas, nodes = products in article, edges = relationships)
7. **`/functions/[slug]`** — Leaf taxonomy page with $ chart, lifecycle chart, top 10 ranked, full product grid
8. **`/compare?a=&b=`** — Side-by-side hero cards, radar overlay, attribute diff 3-col, signal timeline, funding comparison, AI verdict
9. **`/companies/[slug]`** — Company profile with products grid, funding timeline, valuation chart, related companies
10. **`/trending`** — Breakout feed with sparklines + global velocity chart
11. **`/graveyard`** — Death reason donut, pre-death signals teaser (paid feature), grouped dead products by year

### Round 3+ (not yet built)
- Tablet breakpoint clones
- Mobile breakpoint clones
- User flow diagrams (signup → first dossier, browse → compare → save, search → filter → dossier, funding alert → dossier)
- Component library (reusable cards, buttons, badges, charts)

Generator script at `C:\Users\alima\prism-wireframe-build.mjs` (~3,500 elements, 1.96MB file). Reruns with edits.

## Environment Variables Needed

For ingestion scripts in GitHub Actions (secrets):
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
PRODUCT_HUNT_DEVELOPER_TOKEN=
FIRECRAWL_API_KEY=
GITHUB_TOKEN=              # auto-injected in Actions
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
```

Deferred (post-monetization):
- `TWITTER_BEARER_TOKEN` — $100/mo, skip until signal scoring proven
- `CRUNCHBASE_API_KEY` — $49/mo, scrape public pages with Firecrawl instead
- `SIMILARWEB_API_KEY` — $250+/mo, defer

## Name Brainstorm (for final rename)

Top 5 candidates to stress-test for domain availability:
1. **Hindsight** — historical analysis angle
2. **Chronicle** — ongoing record, news-magazine feel
3. **Kestrel** — uncommon, observer bird, clean
4. **Prism** — current codename, facet metaphor
5. **Meridian** — navigation, reference line

Alternative themes:
- Historical: Epoch, Canon, Annals, Docket, Legacy, Origin
- Observation: Periscope, Observ, Probe, Recon, Scout, Polaris, Lantern
- Document: Folio, Datum, Ledger, Register, Index, Archive, Dossier (already a sub-brand)
- Structural: Facet, Lattice, Spectrum, Axis, Helix
- Workshop: Foundry, Atelier

## Next Steps

- [ ] **Finalize product name** — blocker for repo rename + domain registration
- [ ] Review Round 1+2 wireframes in Excalidraw, give feedback
- [ ] Authenticate Supabase MCP, Vercel MCP, Firecrawl MCP (one-time browser consent)
- [ ] Provide 3 API keys for GitHub Actions runtime: Anthropic, Product Hunt dev token, Firecrawl
- [ ] **Then Day 1 execution begins**: repo rename, Supabase project, schema migration, deps, branding.ts

## Plan Document

Full strategic plan: `C:\Users\alima\.claude\plans\enumerated-strolling-dusk.md`

## Related Projects
- [[Launch Sentinel]] — earlier separate attempt at similar concept (Next.js 15 + OpenAI) — different codebase, not related to Prism build
- [[Moonlight Analytica]] — Could syndicate Prism's market analytics content
- [[Blog Formatter]] — Could generate insights articles about featured products
- [[Excalidraw Toolkit]] — powers the wireframe deliverable format

## Changelog

- **2026-04-09** — Project planning complete. Codename `prism` + sub-brand `dossier` locked. Full 4-layer attribute taxonomy designed. Multi-source ingestion strategy (PH + HN + GitHub Trending + Reddit + Firecrawl for Week 2 sources). GitHub Actions as free cron runtime. Cost target $47/mo for full automation. Round 1+2 Excalidraw wireframes delivered (11 pages, 3,562 elements). Waiting on: final product name, MCP auth, API keys for GitHub Actions.
