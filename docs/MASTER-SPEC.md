# LaunchSentinel / Prism — Master Context Document

> **Recovered 2026-04-09** from frozen Claude Code session `62a5c57e` (original timestamp 2026-04-09T04:58:27Z). This is Ali's original spec written at the project kickoff. Codename: **Prism**. Working repo: `v0-product-sentinel`.

---

# LaunchSentinel — Master Context Document
> Use this file to onboard Claude Code into the full project context. Every decision, schema, pipeline, and roadmap is documented here. Update this file as the project evolves.

---

## 1. What Is LaunchSentinel?

LaunchSentinel is a **Bloomberg meets Obsidian meets Product Hunt** platform for the entire arc of tech product history.

**Core value proposition:**
- Track tech products from the 1960s/70s through today
- Show which products/companies have been around and for how long
- Deconstruct products by primary function (spreadsheet, note-taker, smartphone, etc.)
- Classify by category (productivity, video game, exercise tracker, etc.)
- Map era-aware properties (pre-internet vs SaaS era vs mobile era)
- Overlay financial signals: revenue, VC funding, market cap
- Social signal scoring and velocity tracking (Reddit, HN, GitHub, Google Trends, etc.)
- Obsidian-style knowledge graph showing relationships between products
- Dashboards and analytics for articles, research, and institutional data sales

**The gap nobody else fills:**
Every competitor (Product Hunt, Futurepedia, Toolify, TAAFT, G2) is **present-tense only**. Nobody tracks:
- Historical timelines of how products evolved
- Category lifecycle curves (when did "to-do apps" peak?)
- Survival rate data by cohort year
- The graveyard / discontinued products layer
- Revenue/funding overlaid on product history
- Pre-death signal patterns

---

## 2. Phased Roadmap

### Phase 1 — Seed the Modern Database (NOW)
- 2,000–5,000 recent products from Product Hunt, Crunchbase, Wikipedia
- Focus: breaking products down by lifespan, category, primary function
- Wire up: social signal scoring, news feed, funding round ingestion
- Sources: Product Hunt, Crunchbase public, HN, Reddit, GitHub, Google Trends

### Phase 2 — Historical Arc (LATER)
- Products going back to 1960s/70s
- Manual curation for pre-internet era (this is the moat)
- Sources: Wikipedia, Computer History Museum, Byte Magazine (Archive.org), PC Magazine archives, NYT Archive API, Wayback Machine CDX API, Chronicling America (Library of Congress)
- Vintage press quotes attached to products
- Era classification: mainframe → PC → web1 → mobile → AI

### Phase 3 — Graph + Dashboards
- Obsidian-style force graph (Sigma.js / D3.js)
- Category lifecycle charts
- Survival curve visualizations
- Breakout alerts feed

### Phase 4 — Monetization
- API access tier for institutional buyers
- Downloadable datasets (CSV/JSON)
- Premium dashboard subscriptions
- Sponsored placements (clearly labeled)
- Weekly "Signal Report" newsletter
- Embeddable widgets for journalists/blogs

---

## 3. Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL)
- **Ingestion:** Firecrawl, Claude API, RSS feeds
- **Hosting:** Vercel
- **Graphs:** D3.js / Sigma.js / Graphology for the knowledge graph, Observable Plot / Recharts for dashboards
- **Scheduling:** Vercel Cron or Railway cron

---

## 4. Full Database Schema

```sql
-- ─────────────────────────────────────────────
-- COMPANIES
-- ─────────────────────────────────────────────
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  founded_year INT,
  defunct_year INT,                    -- NULL if still active
  hq_country TEXT,
  hq_city TEXT,

  -- Phase 2 vintage fields
  founding_story TEXT,                 -- nullable
  historical_significance TEXT,        -- nullable

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  -- Lifecycle
  launched_year INT,
  launched_month INT,                  -- nullable, often unknown for old products
  discontinued_year INT,               -- NULL = still active
  discontinued_month INT,              -- nullable
  lifespan_months INT GENERATED ALWAYS AS (
    CASE
      WHEN discontinued_year IS NOT NULL AND launched_year IS NOT NULL
      THEN ((discontinued_year - launched_year) * 12) +
           (COALESCE(discontinued_month, 6) - COALESCE(launched_month, 6))
      ELSE NULL
    END
  ) STORED,

  -- Classification
  primary_function TEXT NOT NULL,      -- 'spreadsheet', 'note-taker', 'smartphone', etc.
  category TEXT NOT NULL,              -- 'productivity', 'entertainment', 'dev-tools', etc.
  platform TEXT NOT NULL,              -- 'web', 'mobile', 'desktop', 'hardware', 'cross-platform'
  is_open_source BOOLEAN DEFAULT FALSE,

  -- Era-aware properties
  business_model TEXT,                 -- 'saas', 'perpetual', 'freemium', 'hardware', 'marketplace'
  distribution TEXT,                   -- 'self-serve', 'sales-led', 'retail', 'bundled'
  has_api BOOLEAN,
  has_network_effects BOOLEAN,

  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'discontinued', 'acquired', 'merged', 'dead'
  acquisition_company_id UUID REFERENCES companies(id),

  -- Source tracking
  source TEXT NOT NULL,                -- 'product_hunt', 'crunchbase', 'wikipedia', 'manual'
  source_url TEXT,
  confidence_score SMALLINT DEFAULT 3, -- 1-5, lower for inferred/vintage data

  -- Social/traffic signals (Phase 1 additions)
  monthly_visits_est BIGINT,           -- from SimilarWeb/Semrush API
  monthly_visits_source TEXT,          -- 'similarweb' | 'semrush' | 'manual'
  monthly_visits_date DATE,
  task_search_tags TEXT[],             -- TAAFT-style: ["write emails", "summarize docs"]
  functionality_scores JSONB,          -- Futurepedia-style: {ease_of_use: 4, features: 5}

  -- Phase 2 vintage fields
  press_quotes JSONB,                  -- [{source, quote, year, url}]
  historical_context TEXT,
  era TEXT,                            -- 'mainframe', 'pc', 'web1', 'mobile', 'ai'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- FUNDING ROUNDS
-- ─────────────────────────────────────────────
CREATE TABLE funding_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  round_type TEXT,                     -- 'seed', 'series-a', 'ipo', 'acquisition', etc.
  amount_usd BIGINT,                   -- NULL if undisclosed
  year INT,
  month INT,
  investors JSONB,                     -- array of investor names
  valuation_usd BIGINT,
  is_disclosed BOOLEAN DEFAULT TRUE,
  is_estimated BOOLEAN DEFAULT FALSE,  -- TRUE for vintage/inferred data
  source TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- REVENUE SNAPSHOTS
-- ─────────────────────────────────────────────
CREATE TABLE revenue_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  year INT NOT NULL,
  revenue_usd BIGINT,
  revenue_is_estimated BOOLEAN DEFAULT FALSE,
  arr_usd BIGINT,                      -- nullable, SaaS era mostly
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TAGS
-- ─────────────────────────────────────────────
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  tag_group TEXT                       -- 'function', 'category', 'era', 'trend', etc.
);

CREATE TABLE product_tags (
  product_id UUID REFERENCES products(id),
  tag_id UUID REFERENCES tags(id),
  PRIMARY KEY (product_id, tag_id)
);

-- ─────────────────────────────────────────────
-- PRESS MENTIONS
-- ─────────────────────────────────────────────
CREATE TABLE press_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  publication TEXT NOT NULL,           -- 'NYT', 'TechCrunch', 'Byte Magazine', etc.
  headline TEXT,
  snippet TEXT,
  url TEXT UNIQUE,
  mention_year INT,
  mention_date DATE,
  sentiment SMALLINT,                  -- -1, 0, 1
  is_vintage BOOLEAN DEFAULT FALSE,    -- flag for pre-2000 sources
  source TEXT,                         -- 'nyt_api', 'manual', 'wayback', 'rss_feed'
  metadata JSONB                       -- event_type, importance_score, tags, hn_score etc.
);

-- ─────────────────────────────────────────────
-- PRODUCT RELATIONSHIPS (graph edges)
-- ─────────────────────────────────────────────
CREATE TABLE product_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_a_id UUID REFERENCES products(id),
  product_b_id UUID REFERENCES products(id),
  relationship_type TEXT NOT NULL,     -- 'competed_with', 'inspired', 'killed', 'spawned', 'acquired'
  year_started INT,
  year_ended INT,
  notes TEXT,
  CHECK (product_a_id != product_b_id)
);

-- ─────────────────────────────────────────────
-- PRODUCT ALTERNATIVES (AlternativeTo-style)
-- ─────────────────────────────────────────────
CREATE TABLE product_alternatives (
  product_id UUID REFERENCES products(id),
  alternative_id UUID REFERENCES products(id),
  relationship TEXT,                   -- 'direct_competitor' | 'successor' | 'predecessor' | 'killer'
  source TEXT,
  PRIMARY KEY (product_id, alternative_id)
);

-- ─────────────────────────────────────────────
-- SOCIAL MENTIONS (time-series)
-- ─────────────────────────────────────────────
CREATE TABLE social_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  platform TEXT NOT NULL,              -- 'reddit' | 'twitter' | 'hackernews' | 'github' | 'google_trends' | 'youtube' | 'stackoverflow'
  snapshot_date DATE NOT NULL,
  mention_count INT DEFAULT 0,
  sentiment_avg NUMERIC(4,3),          -- -1.000 to 1.000
  engagement_sum INT,                  -- upvotes + comments + shares
  source_url TEXT,
  raw_data JSONB                       -- store top posts for context
);

-- ─────────────────────────────────────────────
-- SIGNAL SCORES (computed nightly)
-- ─────────────────────────────────────────────
CREATE TABLE product_signal_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  score_date DATE NOT NULL,
  signal_score NUMERIC(5,2),           -- 0-100 composite
  mention_score NUMERIC(5,2),
  sentiment_score NUMERIC(5,2),
  velocity_score NUMERIC(5,2),
  press_score NUMERIC(5,2),
  funding_score NUMERIC(5,2),
  wow_velocity NUMERIC(8,4),           -- week-over-week % change
  mom_velocity NUMERIC(8,4),           -- month-over-month % change
  is_breakout BOOLEAN DEFAULT FALSE,   -- TRUE when velocity > 2 stddev above 90-day avg
  UNIQUE(product_id, score_date)
);

-- ─────────────────────────────────────────────
-- PRODUCT GRAVEYARD (discontinued products)
-- ─────────────────────────────────────────────
CREATE TABLE product_graveyard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) UNIQUE,
  death_year INT,
  death_month INT,
  death_reason TEXT,                   -- 'shutdown' | 'acquisition' | 'pivot' | 'replaced' | 'bankruptcy'
  death_announcement_url TEXT,
  acquirer_company_id UUID REFERENCES companies(id),
  successor_product_id UUID REFERENCES products(id),
  pre_death_signal_data JSONB,         -- snapshot of signal scores 6mo before death
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PRODUCT CHANGELOG (audit trail)
-- ─────────────────────────────────────────────
CREATE TABLE product_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by TEXT DEFAULT 'system'     -- 'system' | 'manual' | 'pipeline'
);

-- ─────────────────────────────────────────────
-- JOB POSTINGS SNAPSHOTS
-- ─────────────────────────────────────────────
CREATE TABLE job_posting_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  snapshot_date DATE NOT NULL,
  total_postings INT,
  source TEXT,                         -- 'indeed' | 'linkedin' | 'manual'
  UNIQUE(company_id, snapshot_date)
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX idx_products_launched_year ON products(launched_year);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_primary_function ON products(primary_function);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_source ON products(source);
CREATE INDEX idx_press_mentions_product ON press_mentions(product_id);
CREATE INDEX idx_funding_company ON funding_rounds(company_id);
CREATE INDEX idx_social_mentions_product_date ON social_mentions(product_id, snapshot_date DESC);
CREATE INDEX idx_signal_scores_date ON product_signal_scores(score_date DESC);
CREATE INDEX idx_signal_scores_breakout ON product_signal_scores(is_breakout) WHERE is_breakout = TRUE;
```

---

## 5. Signal Score Formula

The Signal Score is a 0–100 composite score computed nightly per product.

```
Signal Score = (
  mention_volume    * 0.25 +   -- raw mention count across all platforms
  sentiment         * 0.20 +   -- rolling 30-day avg sentiment
  velocity          * 0.25 +   -- rate of change WoW (weighted highest — most predictive)
  press_coverage    * 0.15 +   -- press mention frequency and source quality
  funding_velocity  * 0.15     -- recency and size of funding rounds
) normalized to 0–100
```

**Breakout flag:** Set `is_breakout = TRUE` when a product's velocity exceeds 2 standard deviations above its own 90-day rolling average.

**4 charts per product:**
1. Mention volume over time — bar chart, monthly, all platforms combined
2. Sentiment trend — line chart, rolling 30-day avg
3. Velocity score — rate of change WoW
4. Platform breakdown — donut: Reddit vs X vs HN vs press vs GitHub

---

## 6. Social Signal Sources

### Tier 1 — Free, High Signal (Build First)
| Source | API | Cost | Notes |
|--------|-----|------|-------|
| Reddit | Reddit API | Free (100 req/min) | Best qualitative signal for tech |
| Hacker News | Firebase API | Free | Small but very high-value audience |
| GitHub | GitHub API | Free | Stars/forks = best dev tool health proxy |
| Google Trends | pytrends (unofficial) | Free | 5yr historical, search interest over time |

### Tier 2 — Strong Signal, Some Cost
| Source | API | Cost | Notes |
|--------|-----|------|-------|
| Twitter/X | Twitter API | $100/mo | Fastest breaking signal, annoying but worth it at scale |
| YouTube | YouTube Data API | Free | View counts + comment sentiment on product videos |
| App Store / Google Play | App Store API | Free | Review count + rating over time, great for mobile |
| Stack Overflow | SO API | Free | Question volume = dev adoption proxy |

### Tier 3 — Niche but Valuable
- Discord server size (no official API but trackable)
- Product Hunt upvotes/comments over time
- Indie Hackers revenue mentions
- LinkedIn job posting count (company growth proxy)

### Tier 4 — Institutional / Premium (Phase 3+)
- SimilarWeb / Semrush — web traffic estimates
- Crunchbase API — $49/mo, funding velocity
- SEC EDGAR — free API, public company revenue + 8-K filings
- G2 / Capterra — review velocity over time

---

## 7. News Feed Sources (RSS)

```typescript
export const NEWS_SOURCES = [
  { name: "TechCrunch",      rss: "https://techcrunch.com/feed/",                    category: "startup",       reliability: 5 },
  { name: "The Verge",       rss: "https://www.theverge.com/rss/index.xml",           category: "consumer-tech", reliability: 5 },
  { name: "Hacker News",     api: "https://hacker-news.firebaseio.com/v0",            category: "dev-tools",     reliability: 4 },
  { name: "Product Hunt",    rss: "https://www.producthunt.com/feed",                 category: "products",      reliability: 5 },
  { name: "VentureBeat",     rss: "https://venturebeat.com/feed/",                   category: "enterprise",    reliability: 4 },
  { name: "Wired",           rss: "https://www.wired.com/feed/rss",                  category: "consumer-tech", reliability: 4 },
  { name: "ArsTechnica",     rss: "http://feeds.arstechnica.com/arstechnica/index",   category: "deep-tech",     reliability: 5 },
  { name: "MIT Tech Review", rss: "https://www.technologyreview.com/feed/",           category: "research",      reliability: 5 },
];
```

Claude analyzes each article and extracts:
- `is_product_relevant` — is this about a specific product?
- `event_type` — launch | acquisition | shutdown | funding | update | controversy
- `sentiment` — -1 | 0 | 1
- `importance_score` — 1–5
- `funding_round` — extracted when event_type is 'funding'

---

## 8. Funding Round Extraction

When Claude detects a funding article, extract and write to `funding_rounds`:

```typescript
interface FundingRound {
  round_type: string        // 'seed' | 'series-a' | 'series-b' | 'ipo' | 'acquisition'
  amount_usd: number | null // null if undisclosed
  investors: string[]
  valuation_usd: number | null
  is_disclosed: boolean
}
```

**Key insight:** Funding velocity is a leading indicator. A product that just raised Series A will have a marketing push + press wave 2–4 weeks later. Capturing funding → correlating with subsequent mention spike = predictive signal.

---

## 9. Ingestion Pipeline Code

### Product Hunt Ingestion

```typescript
// ingestion/product-hunt.ts
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function scrapeProductHunt(page = 1): Promise<any[]> {
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: `https://www.producthunt.com/?page=${page}`,
      formats: ["markdown"],
      actions: [{ type: "wait", milliseconds: 2000 }],
    }),
  });
  const data = await res.json();
  return data?.data?.markdown ? [data.data] : [];
}

async function extractProductData(markdown: string): Promise<any[]> {
  const msg = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `You are a product data extraction agent for LaunchSentinel.
Extract ALL products from the following Product Hunt page markdown. Return ONLY a valid JSON array — no preamble, no backticks.

For each product extract:
{
  "name": string,
  "tagline": string,
  "company_name": string | null,
  "launched_year": number | null,
  "launched_month": number | null,
  "primary_function": string,
  "category": string,
  "platform": "web" | "mobile" | "desktop" | "cross-platform" | "hardware",
  "business_model": "saas" | "freemium" | "open-source" | "perpetual" | "marketplace",
  "has_api": boolean | null,
  "has_network_effects": boolean | null,
  "status": "active",
  "source": "product_hunt",
  "source_url": string | null,
  "confidence_score": 4
}

Markdown:
${markdown}`,
    }],
  });

  try {
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    return JSON.parse(text);
  } catch {
    return [];
  }
}

async function upsertProduct(product: any) {
  const { data: company } = await supabase
    .from("companies")
    .upsert({ name: product.company_name ?? product.name, slug: slugify(product.company_name ?? product.name) }, { onConflict: "slug", ignoreDuplicates: true })
    .select("id").single();

  await supabase.from("products").upsert({
    company_id: company?.id ?? null,
    name: product.name,
    slug: slugify(product.name),
    launched_year: product.launched_year,
    launched_month: product.launched_month,
    primary_function: product.primary_function,
    category: product.category,
    platform: product.platform,
    business_model: product.business_model,
    has_api: product.has_api,
    has_network_effects: product.has_network_effects,
    status: product.status ?? "active",
    source: "product_hunt",
    source_url: product.source_url,
    confidence_score: product.confidence_score ?? 4,
  }, { onConflict: "slug", ignoreDuplicates: true });
}

export async function runProductHuntIngestion(pages = 5) {
  for (let page = 1; page <= pages; page++) {
    const scraped = await scrapeProductHunt(page);
    for (const raw of scraped) {
      const products = await extractProductData(raw.markdown);
      for (const product of products) await upsertProduct(product);
    }
    await sleep(1000);
  }
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
```

### News Feed Ingestion

```typescript
// ingestion/news-feed.ts
// Full file in /ingestion/news-feed.ts
// Key function: analyzeArticle() → returns NewsAnalysis with event_type, sentiment, funding_round etc.
// Key function: upsertNewsMention() → writes to press_mentions, links to product if found
// Key function: runNewsFeedIngestion() → loops all NEWS_SOURCES, processes articles
```

### Scheduler

```typescript
// scheduler.ts — CLI entrypoint
// npx ts-node scheduler.ts news     → runs every hour  (0 * * * *)
// npx ts-node scheduler.ts products → runs daily       (0 6 * * *)
// npx ts-node scheduler.ts all      → runs both
```

---

## 10. Competitor Analysis

| Platform | Scale | What They Do Differently |
|----------|-------|--------------------------|
| Product Hunt | ~500k | Community voting, launch-day momentum |
| TAAFT | 9,500+ | Task-based search ("AI for X") |
| Toolify | 26,000+ | Traffic/market data per tool, monthly visits |
| Futurepedia | 5,700 | Business-oriented; pros/cons scores per dimension |
| G2 | Millions | Verified reviews, Grid rankings, enterprise |
| AlternativeTo | Large | "What replaces X" substitution mapping |
| BetaList | Small | Pre-launch / beta only |

**Features worth incorporating from competitors:**
1. **Toolify's traffic data** — SimilarWeb/Semrush API to attach traffic estimates per product
2. **TAAFT's task-based search** — query by problem/task, maps to `task_search_tags`
3. **Futurepedia's dimension scoring** — structured scorecard per product (`functionality_scores` JSONB)
4. **AlternativeTo's substitution graph** — `product_alternatives` table, surface as "Products that killed this one"

---

## 11. Historical Data Sources (Phase 2)

| Era | Source | Notes |
|-----|--------|-------|
| 1960s–80s | Computer History Museum | Structured, credible |
| 1975–2000 | Byte Magazine (Archive.org) | Fully scanned, goldmine |
| 1980s–90s | PC Magazine, InfoWorld, PC World (Archive.org) | Structured product reviews |
| 1990s+ | Wikipedia | Consistent, automatable |
| 1850s–now | NYT Archive API | Headlines/snippets, free tier |
| Any era | Wayback Machine CDX API | Old product pages, pricing history |
| Pre-1960s | Chronicling America (Library of Congress) | Free API, newspapers |

**Key insight:** Pre-internet data is a manual curation problem. This is the moat. No competitor has it.

---

## 12. What's Still Missing / TODO

### Data Gaps
- [ ] Job postings scraper (Indeed/LinkedIn) — company growth/decline proxy
- [ ] Wayback Machine pricing page tracker — detect when free tiers removed
- [ ] Patent filing ingestion (USPTO API, free) — leading indicator of future launches
- [ ] App Store version history — update cadence = product health signal
- [ ] SEC 8-K filing ingestion (EDGAR API, free) — material events in real time
- [ ] Executive departure tracking — CEO/CTO leaving is a major signal
- [ ] Domain expiration monitor (WHOIS API) — dead product detection

### Product Features Missing
- [ ] **Watchlist + alerts** — users follow a product, get notified on signal spike (retention mechanic)
- [ ] **Comparison view** — side-by-side two products across all signals over time (e.g. "Notion vs Evernote 2015–2025")
- [ ] **Category pages** — all note-taking apps ranked by signal score with lifecycle chart
- [ ] **Product Graveyard** — discontinued products only, unique page, strong SEO
- [ ] **Breakout feed** — homepage feed of products where `is_breakout = TRUE`
- [ ] **API access tier** — programmatic data access for institutional buyers
- [ ] **CSV/dataset exports** — one-click export of any filtered product set
- [ ] **Embeddable widgets** — product history widget for journalists/blogs

### Infrastructure Missing
- [ ] Data freshness indicators on every product card
- [ ] Confidence scoring on signals (not just products)
- [ ] Deduplication layer — when TC and Verge cover same funding round
- [ ] Change log / audit trail (partially done with `product_changelog` table)

### Monetization Missing
- [ ] Sponsored placements (clearly labeled)
- [ ] Data licensing pipeline for hedge funds / PE / VC
- [ ] Weekly "Signal Report" newsletter
- [ ] Embeddable widgets

---

## 13. Key Design Decisions

- **`confidence_score` on every product** — 1–5, lower for inferred/vintage data. Critical for data quality trust.
- **`lifespan_months` as computed column** — auto-calculates from launch/discontinue dates, powers "how long did it last" charts instantly.
- **`press_mentions` as own table** — not JSONB. Queried, filtered, and sentiment-analyzed independently.
- **`product_relationships` for graph** — every "X killed Y", "X inspired Z" edge. Feeds Obsidian-style viz.
- **`era` field stubbed nullable** — backfill in Phase 2 but column is ready.
- **`is_breakout` flag** — nightly job, flags velocity > 2 stddev above 90-day average. This is the flagship feature for institutional buyers.
- **Funding → signal correlation** — capture funding event, correlate with mention spike 2–4 weeks later = predictive lead indicator.
- **RSS-first for news** — no Firecrawl needed for most news sources, RSS is free and reliable.

---

## 14. Environment Variables Needed

```bash
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
FIRECRAWL_API_KEY=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
GITHUB_TOKEN=
TWITTER_BEARER_TOKEN=          # Phase 2, $100/mo
CRUNCHBASE_API_KEY=             # Phase 2, $49/mo
SIMILARWEB_API_KEY=             # Phase 3
```

---

## 15. Immediate Next Steps (Claude Code Session)

1. Add missing schema tables to Supabase: `social_mentions`, `product_signal_scores`, `product_graveyard`, `product_changelog`, `job_posting_snapshots`, `product_alternatives`
2. Add missing columns to `products`: `monthly_visits_est`, `task_search_tags`, `functionality_scores`
3. Add missing columns to `funding_rounds`: `investors`, `valuation_usd`, `is_disclosed`, `source_url`
4. Build Reddit ingestion pipeline (`ingestion/reddit.ts`)
5. Build GitHub stars ingestion (`ingestion/github.ts`)
6. Build Google Trends ingestion (`ingestion/google-trends.ts`)
7. Add funding extraction branch to `analyzeArticle()` in news-feed.ts
8. Build signal score computation job (`jobs/compute-signal-scores.ts`)
9. Add `is_breakout` detection to signal score job
10. Wire up Vercel cron for all jobs, this is really the core of the moat...here's the repo i started in V0 https://github.com/alimabsoute/v0-product-sentinel.git    ....can you tell me your thoughts and plans on how to proceed? one big thing is i want to make sure all products have their official branding/logos in place, is that something we can do with the firecrawl process?
