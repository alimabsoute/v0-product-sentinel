# NEXT — Prism resume point

> **Last updated**: 2026-04-10 (post Day 3.5 — Vocabulary seed live)
> **Read this file first** when returning to the project.

## Status: Day 1 + Day 2 + Day 3.5 COMPLETE ✅

Day 3.5 landed on top of the foundation. Migrations 0002 + 0003 applied, taxonomy seeded:
- `functions` table: **15 categories + 115 subcategories + 414 leaves = 544 rows**
- `tags` table: **98 values across 10 attribute groups**
- Products table extended with: `primary_function_id` (FK), `sub_category`, `website_url`, `twitter_handle`, `github_repo`, `docs_url`, `description`, `screenshots[]`, `logo_url`, `logo_source`, `logo_confidence`
- `tags.slug` column added + `tags_slug_unique` constraint (replaces broken partial index from 0002)
- Top categories by leaf count: AI Tools 73, Dev Tools 60, Productivity 40, Design 28, Marketing 28

Day 1 + Day 2 state (unchanged):

Supabase schema is live. All blockers resolved.

### What's on the live database

**Project**: `fnlmqkfmjfzzkkqcmahe` in org `izpyiciidhsswljgxmvq` (`alimabsoute's Org`, Pro plan, us-east-2)
- **URL**: `https://fnlmqkfmjfzzkkqcmahe.supabase.co`
- **Dashboard name**: still shows `LaunchSentinel` — pending manual rename to `prism-dev` (MCP has no `update_project`)
- **Repurposed** from the abandoned product-hunt-app project. 27 old seed rows + 9 tables were dropped after backup; full audit trail in `docs/archive/launchsentinel-drop-manifest-2026-04-10.md`.

**Extensions installed** (migration `0001_prism_foundation`):
- `pg_trgm` v1.6 — fuzzy name match for dedup cascade Layer 2
- `vector` (pgvector) v0.8.0 — embedding similarity for dedup cascade Layer 6
- `pg_cron` v1.6 — nightly signal score job scheduler (Day 6)
- Plus existing: `uuid-ossp`, `pgcrypto`, `pg_graphql`, `pg_stat_statements`, `supabase_vault`, `plpgsql`

**Tables created** (14 total, all empty, RLS off — enabled later):
1. `companies`
2. `products` (with `GENERATED ALWAYS AS` lifespan_months + `task_search_tags TEXT[]` + `functionality_scores JSONB`)
3. `funding_rounds`
4. `revenue_snapshots`
5. `tags` + `product_tags`
6. `press_mentions`
7. `product_relationships` (graph edges)
8. `product_alternatives`
9. `social_mentions` (time-series)
10. `product_signal_scores`
11. `product_graveyard`
12. `product_changelog`
13. `job_posting_snapshots`

**Indexes**: 12 total — category/status/source/launched_year/primary_function on products, FK indexes on press_mentions + funding_rounds + social_mentions + signal_scores, partial index on `is_breakout = TRUE`, plus trigram indexes for `products.name` and `companies.name`.

### Credentials

**`.env.local`** (gitignored) now contains:
- `ANTHROPIC_API_KEY`, `PRODUCT_HUNT_DEVELOPER_TOKEN`, `FIRECRAWL_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` = **TODO** (not auto-fetchable via MCP — Ali will paste manually from Supabase dashboard → Settings → API when needed for Day 4 ingestion)

**GitHub Actions secrets** on `alimabsoute/v0-product-sentinel`:
```
ANTHROPIC_API_KEY                    (set 2026-04-10)
FIRECRAWL_API_KEY                    (set 2026-04-10)
PRODUCT_HUNT_DEVELOPER_TOKEN         (set 2026-04-10)
NEXT_PUBLIC_SUPABASE_URL             (set 2026-04-10)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (set 2026-04-10)
NEXT_PUBLIC_SUPABASE_ANON_KEY        (set 2026-04-10)
SUPABASE_SERVICE_ROLE_KEY            — TODO before Day 4
```

### Dependencies installed (Day 1)

```json
"@supabase/supabase-js": "^2.103.0",
"@anthropic-ai/sdk": "^0.87.0"
```
`zod` was already in the v0 scaffold.

---

## Next: Day 4 — First ingestion

### Day 3.5 — Vocabulary seed ✅ DONE (2026-04-10)
- Migration `0002_functions_taxonomy_and_product_detail` applied
- Migration `0003_tags_slug_unique_constraint` applied (fix for broken partial index)
- `supabase/seed/tags.sql` → 98 tags across 10 groups
- `supabase/seed/functions.sql` → 544 function rows (15 / 115 / 414 across depths 0/1/2)
- Naming rules locked: kebab-case, singular, vendor-neutral noun-phrases, `-other` catch-alls per subcategory, Futurepedia-style granularity

### Day 4 — Logo pipeline + Product Hunt ingestion (50 products)
- Logo cascade: PH GraphQL → Brandfetch → Clearbit → Firecrawl → Google favicon
- Ingestion script at `scripts/ingest-product-hunt.ts`:
  - Fetch PH `featured_today` via GraphQL
  - Claude Sonnet 4.6 extracts: primary_function, category, attributes, task_search_tags, functionality_scores
  - Dedup cascade (slug → root domain → pg_trgm > 0.8 → twitter handle → github repo → pgvector > 0.9)
  - Insert to `products` + `product_tags`
- Target: 50 real products in the `products` table, each with proper attribute taxonomy + real logo URL.

### Day 5 — UI cut-over
- Delete `lib/mock-data.ts` (1,197 lines)
- Create `lib/supabase-client.ts` — browser client
- Create `lib/supabase-server.ts` — server-side admin client
- Refactor pages to `await supabase.from('products').select(...)`
- Fix all type mismatches (product-card, market-pulse, etc.)
- Deploy preview via `vercel` CLI

### Day 6 — GitHub Actions crons
- Workflow: `.github/workflows/ingest-product-hunt.yml` (every 6h)
- Workflow: `.github/workflows/ingest-hn.yml` (every 6h)
- Workflow: `.github/workflows/ingest-github-trending.yml` (daily)
- Workflow: `.github/workflows/ingest-reddit.yml` (every 12h)
- All use the GitHub Actions secrets set above.

### Day 7 — News feed automation
- `scripts/ingest-news.ts` — 8 RSS sources
- Keyword pre-filter → Haiku classifier → Sonnet escalation for funding articles
- Target: $7/mo news cost vs $125/mo naive

---

## Still outstanding manual steps

| Item | When needed | Action |
|---|---|---|
| Rename Supabase project `LaunchSentinel → prism-dev` | Cosmetic, anytime | Supabase dashboard → Settings → General → Rename |
| Fetch `SUPABASE_SERVICE_ROLE_KEY` | Before Day 4 ingestion | Dashboard → Settings → API → service_role → copy → paste into `.env.local` + `gh secret set` |
| Vercel MCP re-auth (optional) | Day 5 UI cut-over (nice-to-have, not required — `vercel` CLI works) | Claude.ai → Settings → Connectors → Vercel → Disconnect → Reconnect. OR file support ticket with reference `ofid_48d43f8e1baa57b4` |

---

## File map

```
v0-product-sentinel/
├── .env.local                  ← gitignored, has all API keys + Supabase creds
├── lib/
│   ├── branding.ts             ← single source of truth for brand strings
│   ├── mock-data.ts            ← 1,197 lines, scheduled for deletion Day 5
│   └── utils.ts
├── supabase/
│   └── migrations/
│       └── 0001_prism_foundation.sql   ← NEW. 14 tables + 3 extensions + 12 indexes
├── docs/
│   ├── NEXT.md                 ← you are here
│   ├── MASTER-SPEC.md          ← 690 lines, schema source of truth
│   ├── STRATEGIC-PLAN.md       ← 1,708 lines, full execution plan
│   ├── PRISM-OVERVIEW.md       ← narrative overview
│   ├── archive/
│   │   └── launchsentinel-drop-manifest-2026-04-10.md   ← NEW. what was dropped + why
│   ├── wireframes/
│   │   ├── prism-all-rounds.excalidraw           ← canonical R1-3 (4,183 elements)
│   │   ├── prism-all-rounds-v2-with-round4.excalidraw ← generator output R1-4 (9,581 elements)
│   │   └── prism-wireframe-build.mjs
│   └── recovery/
└── package.json                ← +@supabase/supabase-js, +@anthropic-ai/sdk
```
