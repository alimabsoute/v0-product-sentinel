# Prism — Master Plan
> Last updated: 2026-04-18

---

## What Exists Today

| System | State | Notes |
|--------|-------|-------|
| 14,114 products in DB | ✅ Live | Backfill still running toward 25K |
| 18 categories, slugs, descriptions | ✅ | |
| Signal scores (6,275 products) | ⚠️ Partial | 44% covered, rest unscored |
| Press mentions (73 articles) | ⚠️ Sparse | 8 RSS sources, hourly cron running |
| 6 GitHub Actions crons | ✅ Live | signals, news, PH, HN, Reddit, backfill |
| Auth (login/signup/profile/watchlist) | ✅ | Supabase auth |
| /products browser | ✅ | No faceted sidebar yet |
| /dossier/[slug] | ✅ (at /products/[slug]) | Route rename pending |
| /markets Bloomberg dashboard | ✅ | Attribute chart blocked (see below) |
| /evolution timeline | ✅ | |
| /explore force graph | ✅ | 500 nodes |
| /insights news feed | ✅ | Sparse data |
| /compare side-by-side | ✅ | Mock AI verdict |
| /graveyard | ✅ Fixed | Was showing 1 product, now fixed |
| /trending | ❌ Missing | Data exists, page not built |
| /functions | ❌ Missing | Not built |
| /tools-to | ❌ Missing | Not built |
| CSV/JSON export + rate limiting | ✅ | |
| API docs | ✅ | |
| product_tags (Layer 2) | ❌ Empty | 0 tags for 14K products — biggest gap |
| social_mentions | ❌ Empty | No social crawling built |
| funding_rounds | ❌ Empty | No funding data source |
| relationships / alternatives | ❌ Empty | Script built, not run |

---

## The Core Gap: Layer 2 Attributes

`product_tags` is the most important table in the DB. **It is completely empty.**

It powers:
- Faceted filter sidebar on /products (api-first, self-hosted, freemium, etc.)
- Attribute market share chart on /markets (% of cohort with each attribute over time)
- Compliance filtering (soc2, hipaa, gdpr)
- /functions page (products by capability)
- /tools-to page (tools-to-replace X)
- Recommendation engine ("similar to")
- Compare page real attribute diff

Until `product_tags` is populated, **10+ features are blocked.**

---

## Best Path Forward

### Phase A — Data Foundation (do first, unblocks everything)

#### A1: Build `scripts/enrich-attributes.ts`
**What**: For each product, Firecrawl scrapes 2-3 pages (homepage, /pricing, /features or /security), then Claude Haiku classifies into the 10 tag_groups.

**Why Firecrawl here**: Product descriptions in DB are 1-2 sentences from Product Hunt. Actual websites have pricing tiers, feature lists, compliance badges. Haiku accuracy goes from ~60% → ~90%+ with real page content.

**Tag groups to fill**:
- `capability` — api-first, self-hosted, white-label, open-source
- `audience` — developers, enterprise, smb, consumers
- `pricing_model` — freemium, paid, open-source, usage-based
- `deployment` — cloud, self-hosted, hybrid, edge
- `integration` — slack, github, zapier, notion, salesforce, jira
- `compliance` — soc2, hipaa, gdpr, iso27001, ccpa
- `tech_stack` — react, python, typescript, rust, go
- `data_format` — api, csv, webhooks, graphql, rest
- `ux_pattern` — cli, dashboard, mobile, browser-extension, desktop
- `business_model` — b2b, b2c, b2b2c, marketplace, platform

**Cost**: ~$15-40 Firecrawl + ~$14 Haiku = ~$30-55 one-time
**Build time**: ~1 day
**Unblocks**: 10+ features

#### A2: Run `pnpm enrich:relationships`
**What**: For each product, Haiku finds 3-5 alternatives/competitors → populates `relationships` table
**Cost**: ~$4 (already built, just needs to run)
**Time**: ~2h to run for 14K products

#### A3: Score remaining 7,839 products
**What**: `pnpm signals` — pure metadata math, no API cost
**Time**: ~30 min

#### A4: Bulk news ingest
**What**: `pnpm tsx --env-file=.env.local scripts/ingest-news.ts`
**Time**: ~1h to run

---

### Phase B — Social Signal Layer (the real moat)

Right now `mention_score` in signal scores is 0 for almost everything because `social_mentions` is empty.

#### B1: Twitter/X monitoring
- Use Apify Twitter Scraper or Nitter RSS (free tier) for brand mentions
- `product.twitter_handle` → fetch recent tweets mentioning product
- Store in `social_mentions` (product_id, platform, content, sentiment, mention_date)
- **Cost**: Apify ~$5/mo for 50K mentions. Or free via Nitter RSS.
- **Impact**: signal_score mention_score becomes real data

#### B2: GitHub star velocity (already partially tracked)
- `github_repo` is stored on ~30% of products
- GitHub API: star count snapshots → velocity signal
- Free tier: 5K requests/hr unauthenticated

#### B3: Reddit monitoring
- Already have `ingest-reddit.ts` — extend to monitor r/SaaS, r/entrepreneur, r/webdev for product name mentions
- Store in social_mentions

**Firecrawl's role in social**: Firecrawl is NOT the right tool for social — rate-limited, blocks scrapers. Use dedicated APIs (Twitter API v2 Basic: $100/mo, or Apify actors for ~$5/mo).

---

### Phase C — Missing Pages (quick wins, data-dependent)

#### C1: /trending (1-2 days)
- Data exists: signal_score velocity, is_breakout flag
- Page: top 20 breakout products + rising by category
- No new data needed — just build the page

#### C2: /products faceted sidebar (1 day, blocked on A1)
- Left sidebar: filter by tag_group values
- URL params: `?tags=api-first,freemium&category=dev-tools`
- Requires product_tags populated

#### C3: /dossier/[slug] rename (2h)
- Next.js route rename: `app/products/[slug]` → `app/dossier/[slug]`
- Update all internal links
- Add redirect from old URL

#### C4: /functions page (2 days, blocked on A1)
- Group products by `capability` tag
- "Products with: api-first" grid view
- Requires product_tags populated

#### C5: /tools-to page (1 day, blocked on A1)
- "Tools to replace X" — products with `replaces` relationship
- Requires relationships table populated (A2)

---

### Phase D — Attribute Market Share (the flagship chart)

This is the "fundamental components of a product mapped over time in importance" chart on /markets.

**SQL**: Join `product_tags` × `products.launched_year` → % of each cohort with each attribute
**Chart**: Stacked area, x = year (2010–2024), y = % of products with attribute, lines = api-first, self-hosted, ai-assist, etc.

**Blocked on**: A1 (enrich-attributes.ts must run first)
**Build time once data exists**: 1 day

---

### Phase E — Funding Data

Currently 0 funding rounds in DB.

**Options**:
1. **Crunchbase API** — $500/mo (too expensive for now)
2. **Tracxn / Dealroom** — similar pricing
3. **Manual seed** — scrape known funded products (top 200) via Firecrawl on Crunchbase public pages
4. **PitchBook data dump** — if Ali has access

**Recommendation**: Skip for now. Flag products as "funding data unavailable." Revisit when monetizing.

---

## Priority Stack Rank

| # | Task | Phase | Effort | Cost | Unblocks |
|---|------|-------|--------|------|----------|
| 1 | Build enrich-attributes.ts (Firecrawl + Haiku) | A1 | L (1 day) | ~$50 | 10+ features |
| 2 | Run enrich:relationships | A2 | S (30 min) | ~$4 | /tools-to, compare |
| 3 | Run pnpm signals for all 14K | A3 | S (30 min) | $0 | Signal score coverage |
| 4 | Build /trending page | C1 | M (1-2 days) | $0 | New route |
| 5 | Bulk news ingest | A4 | S (1h run) | $0 | Insights feed |
| 6 | Rename /products/[slug] → /dossier/[slug] | C3 | S (2h) | $0 | UX consistency |
| 7 | /products faceted sidebar | C2 | M (1 day) | $0 | Core UX |
| 8 | Attribute market share chart | D | M (1 day) | $0 | Flagship visual |
| 9 | Twitter/Reddit social signals | B1/B3 | L (2 days) | ~$5/mo | Real mention scores |
| 10 | /functions page | C4 | M (2 days) | $0 | Discovery |
| 11 | AI verdict on /compare (real Claude) | — | S (4h) | ~$0.01/use | Compare quality |
| 12 | Funding data (manual seed top 200) | E | L (2 days) | $0 | funding_score |

---

## The Firecrawl Role (Clarified)

| Job | Tool | Notes |
|-----|------|-------|
| Discover real website from PH redirect | Firecrawl | ✅ Already built (enrich-firecrawl.ts) |
| Extract twitter/github from homepage | Firecrawl | ✅ Already built |
| **Scrape feature/pricing/compliance pages for attribute extraction** | **Firecrawl** | **❌ Not built — A1** |
| Crawl social media (Twitter, Reddit, LinkedIn) | ❌ NOT Firecrawl | Use dedicated APIs — Firecrawl gets blocked |
| Crawl Crunchbase for funding | Firecrawl (carefully) | Possible but ToS risk |

---

## Signal Score Formula (Current)

```
signal_score = recency_score       (0–25, based on launched_year)
             + category_heat       (0–15, hardcoded weights)
             + data_richness       (0–20, has description/twitter/github/logo)
             + mention_score       (0–20, social_mentions + press_mentions count)  ← mostly 0 now
             + press_score         (0–10, press_mention count)                     ← sparse
             + funding_score       (0–10, funding_round count)                     ← 0
             + confidence_score    (0–10, PH confidence from ingestion)
```

**Right now scores are 44% based on metadata only.** Once social signals (B phase) are live, scores become real market intelligence.

---

## Total Cost Estimate

| Item | One-time | Monthly |
|------|----------|---------|
| enrich-attributes.ts run | ~$50 | — |
| enrich-relationships.ts run | ~$4 | — |
| Apify Twitter monitoring | — | ~$5 |
| Firecrawl (ongoing enrichment) | — | ~$5 |
| Supabase (current) | — | ~$25 |
| Vercel (current) | — | ~$0 (hobby) |
| **Total** | **~$54** | **~$35/mo** |
