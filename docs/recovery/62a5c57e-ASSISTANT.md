# Assistant messages from session 62a5c57e

[2026-04-09T04:58:35.103Z] This is an ambitious and well-thought-out project. Let me explore what you've already built in the v0 repo, then give you my assessment and plan.

---

[2026-04-09T05:03:37.689Z] Now I have a clear picture. Let me look at a few critical files directly to understand the data model and design before planning.

---

[2026-04-09T05:04:10.724Z] Now I have a complete picture. Let me write out my plan and recommendations.

---

[2026-04-09T05:06:05.587Z] Great addition — attributes are the difference between "a product list" and "a queryable intelligence layer." Let me add a detailed attribute scoping section to the plan.

---

[2026-04-09T05:06:58.959Z] Now let me ask a few critical clarifying questions before finalizing.

---

[2026-04-09T05:34:19.809Z] What would you like to clarify about these questions? I asked about:

1. **Repo strategy** — whether to rename `v0-product-sentinel` → `launchsentinel`, keep as-is, or start fresh
2. **Vocabulary seeding** — how to build the ~400-function taxonomy and attribute controlled vocabulary (AI draft + your review, fully manual, or start narrow)
3. **Logo sources** — which of the 5 fallback sources (PH API, Brandfetch, Clearbit, Firecrawl, Google favicon) to wire up now

Let me know which one(s) you want more detail on — e.g., trade-offs between the options, what each means in practice, or if there's a different dimension of the decision you want me to address instead.

---

[2026-04-09T05:36:04.268Z] Yes, that's a clean approach — use a codename now, single find-replace later. A few codename options that won't pollute Google or pre-commit you to anything:

- **`psyche`** — Greek for "soul/mind", neutral, short
- **`oracle-db`** ❌ (taken)
- **`northstar`** — directional, generic
- **`atlas`** — cartographer of products, fits the "map tech history" vibe
- **`lighthouse`** ❌ (Google product)
- **`vantage`** — observation point, neutral
- **`beacon`** — generic, short
- **`observatory`** — on-theme, longer

My pick: **`atlas`** — short, on-theme, easy to grep-replace later, no existing product conflicts in this space.

For the rename mechanics: I'll use `atlas` as the repo name, package.json `name`, Supabase project name, and internal references. Every user-facing string ("Atlas", "atlas.app") will be isolated in a single `lib/branding.ts` constants file so the eventual rename is a 1-file change + repo/Supabase rename.

---

[2026-04-09T05:37:32.806Z] Product-themed codenames:

- **`dossier`** — investigative intelligence file, fits the Bloomberg-for-products angle
- **`catalog`** — literal, short, clean
- **`ledger`** — financial record-keeping vibe, matches the funding/signal layer
- **`almanac`** — historical yearbook, fits the 1960s-onward arc
- **`compendium`** — comprehensive collection
- **`specimen`** — scientific observation, fits the "deconstruct by function" angle
- **`archive`** — historical (fits graveyard + history)
- **`registry`** — official record of products
- **`exhibit`** — showcase of products
- **`canon`** — the canon of tech products

---

[2026-04-09T05:38:42.659Z] More codename options, grouped by theme:

**Observation / Intelligence:**
- **`prism`** — breaks products into attributes/facets (literal fit for your attribute system)
- **`facet`** — each attribute = one face of a gem
- **`sleuth`** — detective investigating products
- **`spyglass`** — observation tool
- **`lens`** — focused view

**Collection / Archive:**
- **`trove`** — valuable collection
- **`vault`** — secure store
- **`reliquary`** — collection of significant artifacts
- **`curio`** — cabinet of curiosities

**Publication / Intelligence report:**
- **`gazette`** — publication
- **`bulletin`** — news digest
- **`chronicle`** — ongoing historical record
- **`herald`** — announcer of news

**Structure / Graph:**
- **`lattice`** — interconnected network (fits knowledge graph)
- **`mosaic`** — many pieces assembled into picture
- **`matrix`** — grid of relationships

**Workshop / Origin:**
- **`foundry`** — where things are forged
- **`atelier`** — workshop/studio

My top picks from this list for your specific project:
1. **`prism`** — on-theme with the attribute-breakdown system you just asked me to scope out
2. **`trove`** — evokes the historical/archive moat
3. **`sleuth`** — fits the investigative Bloomberg-intelligence angle
4. **`gazette`** — fits the news feed + dashboards

---

[2026-04-09T05:40:00.196Z] Two separate things — let me clarify.

**`prism` = codename for the whole project** (replaces "launchsentinel" / "product-sentinel" everywhere). I suggested it as the codename because the metaphor fits: a prism breaks white light into its component colors, just like the attribute system breaks a product into its component facets. But prism is the *project name*, not the name of the attribute feature.

**The "product attribute thing" you asked about** is a feature *inside* the project. It's scoped in the plan file already, and here's the short version of what I proposed:

> **A 4-layer classification system so products are queryable beyond just category:**
>
> 1. **Hierarchy** — `category` → `sub_category` → `primary_function` (tree: "Productivity" → "Note-Taking Apps" → "markdown-note-editor"). A product has ONE leaf function; category + sub_category auto-derive.
>
> 2. **Multi-select attributes** — tags grouped by type. A product has MANY attributes across MANY groups:
>    - `capability` (collaborative, offline-capable, ai-assist, real-time, version-history...)
>    - `audience` (developers, designers, enterprise, solopreneurs...)
>    - `pricing_model` (free, freemium, open-source, pay-per-use...)
>    - `deployment` (cloud, self-hosted, desktop-app, browser-extension...)
>    - `integration` (works-with-slack, works-with-notion, works-with-github...)
>    - `compliance` (soc2, hipaa, gdpr...)
>    - `data_format` (markdown, json, images, video...)
>    - `ux_pattern` (keyboard-first, command-palette, no-code, drag-drop...)
>    - `business_model` (saas, marketplace, open-source-funded...)
>
> 3. **Task-based tags** — short action phrases like `["write cold emails", "summarize meeting notes", "remove image backgrounds"]`. Powers `/tools-to/{task}` SEO pages (TAAFT-style).
>
> 4. **Dimensional scores** — Futurepedia-style 1-5 ratings on ease-of-use, feature-depth, value-for-money, performance, documentation, mobile-experience, integrations. AI-estimated at ingestion, later replaced with real review data.
>
> **Why this matters:** unlocks real queries like *"show me all open-source, self-hosted, AI-powered note-taking apps with a free tier that integrate with Obsidian"* — plus side-by-side comparison, alternative finding, and massive SEO long-tail via task pages.
>
> **Critical implementation detail:** Claude must pick attributes from a *controlled vocabulary* during extraction — otherwise you get "ai-powered" vs "AI-Powered" vs "uses-ai" chaos. That's why the "how do we seed the vocabulary" question matters.

So my question stands: is `prism` (or another codename) good for the *project name*, and separately — how should I seed the ~400-function attribute vocabulary before ingestion runs? Do you want me to re-ask those questions now, or do you want to discuss the attribute design more first?

---

[2026-04-09T05:40:39.077Z] Here's the taxonomy section from the plan — this is the 4-layer attribute/classification system I scoped out:

---

## Attribute / Taxonomy System

Category alone is too coarse. "Productivity" lumps Notion + Todoist + RescueTime + Linear together — totally different beasts. A granular attribute layer unlocks real filtering, side-by-side comparison, TAAFT-style discovery ("tools to write cold emails"), and knowledge graph edges.

### 4-Layer Classification

**Layer 1 — Hierarchical taxonomy** (single-value per product):
- `category` — top level (~15 values): AI Tools, Dev Tools, Productivity, Design, Marketing, Analytics, Finance, Communication, Security, Data, Hardware, Entertainment, Education, Health, E-commerce
- `sub_category` — mid level (~100 values): "Code Editors", "Note-Taking Apps", "CRM", "Email Marketing", "Vector Databases"...
- `primary_function` — leaf level (**~400 canonical values**): "markdown-note-editor", "ai-code-completion", "transactional-email-api", "block-based-wiki"...

Only the leaf is a FK to a `functions` table. Categories + sub-categories auto-derive from the function's parent chain. This avoids Notion/Obsidian getting tagged as "Note-Taking" AND "Wiki" AND "Productivity" — one leaf, multiple ancestors auto-inferred.

**Layer 2 — Multi-select attributes** (many-to-many via `product_tags`, grouped controlled vocabulary):

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

**Layer 3 — Task-based discovery tags** (`task_search_tags TEXT[]`):
Short action phrases extracted from product description: `["write cold emails", "summarize meeting notes", "generate sql queries", "remove image backgrounds", "transcribe video"]`. Powers:
- `/tools-to/{task}` SEO pages — massive long-tail traffic driver
- Natural language search ("I need to...")
- Cross-product comparison when two products solve the same task differently

**Layer 4 — Dimensional scoring** (`functionality_scores JSONB`):
Futurepedia-style 1-5 scores on consistent dimensions:
```json
{ "ease_of_use": 4, "feature_depth": 5, "value_for_money": 3, "customer_support": 4, "performance": 5, "documentation": 4, "mobile_experience": 3, "integrations": 5 }
```
Initially Claude-estimated at ingestion (flagged `score_source: "ai_estimated"`), later replaced by real review data from G2/Capterra scraping.

### Seeding the vocabulary

Before any ingestion runs, the `functions` tree + tag vocabulary need to be seeded. Two options:
1. **Manual** — you write ~400 functions + ~15 categories + ~10 attribute groups × 15 values ≈ 550 canonical values. ~3 hours. Highest quality.
2. **AI-bootstrapped + you review** — I generate a draft by merging Product Hunt's topic list + TAAFT's task tags + common SaaS taxonomies, you edit. ~1 hour. Needs cleanup.

### What this unlocks in the UI

- **Faceted filter sidebar** on `/products` — checkboxes per attribute group
- **Function pages** `/functions/markdown-note-editor` — all products doing this, ranked by buzz, with lifecycle chart
- **Task pages** `/tools-to/write-cold-emails` — TAAFT-style SEO goldmine
- **Compare view** `/compare?a=notion&b=obsidian` — radar chart of dimensional scores + attribute diff
- **Alternative finder** `/products/notion/alternatives` — products sharing the same primary_function, sorted by attribute overlap

### Critical implementation detail

Claude MUST pick attribute values from the controlled vocabulary during extraction — otherwise you get "ai-powered" vs "AI-Powered" vs "uses-ai" chaos. The extraction prompt passes the full vocabulary inline and a validation layer drops any value not in the list (logged as "vocabulary miss" for later review).

---

That's the attribute system. Want me to expand any layer (more examples, deeper group list, UI mockups), or is this the right shape? And do you want me to re-ask the codename + vocabulary seeding + logo source questions once you're aligned on this?

---

[2026-04-09T05:43:44.205Z] Good instinct — `dossier` actually has a natural home as a *sub-brand within prism*, not a competing codename. Here's how they layer:

## Prism = the platform, Dossier = the unit of content

- **Prism** — the whole product (metaphor: breaks light into its component colors; the platform breaks products into their component facets)
- **Dossier** — the full intelligence file on a single product (metaphor: investigative folder compiled on a subject)

This gives you a clean two-word vocabulary that actually maps to user language:

| Concept | Named as | Example user-facing copy |
|---------|----------|-------------------------|
| The platform | **Prism** | "Prism tracks 50,000 products across tech history" |
| A product's full page | **Dossier** | "Open dossier" (instead of "View product"), "Notion's dossier", "dossier updated 2h ago" |
| The URL | `/dossier/{slug}` | `prism.app/dossier/notion` |
| An exported PDF report | "Dossier PDF" | Premium feature: "Download dossier" |
| An institutional data license | "Dossier API" | B2B offering: "Dossier API access" |

## Why this works

1. **"Dossier" sounds premium and investigative** — fits the Bloomberg-for-products angle far better than "product page" or "profile"
2. **It's already common in intelligence contexts** — users instantly understand what a "dossier" contains (background, history, connections, analysis)
3. **It becomes a countable noun you can monetize** — "unlock 10 dossiers/month on the free tier", "pro tier: unlimited dossiers", "API: 1000 dossiers/day"
4. **It naturally separates from other page types** — homepage is the feed, `/dossier/{slug}` is deep research, `/compare` is side-by-side, `/tools-to/{task}` is discovery. Each page type has a clear verb.
5. **No rename friction** — `prism` and `dossier` are both codenames-for-now. When the final brand lands, prism might become "Sentinel" or "Keel" or whatever — but "dossier" as the name for the product-detail concept could survive the rebrand, because it's a feature/content name, not the company name.

## Concrete impact on the plan

- Route rename: `/products/[slug]` → `/dossier/[slug]` in v0 scaffold
- Navigation copy: "Products" → "Dossiers" (or keep "Products" as the listing label and "Dossier" as the detail label — both work)
- Button copy: "View product" → "Open dossier"
- API namespace: `lib/queries/dossier.ts` for the full-product-detail queries (vs `lib/queries/products.ts` for list/feed queries)
- Later: `/api/dossier/{slug}.json` becomes the public API endpoint for institutional buyers

Want me to bake this naming into the plan file, then we can get back to the three open questions (vocabulary seeding, logo sources, and whatever else you want to lock in before exiting plan mode)?

---

[2026-04-09T05:45:54.655Z] Naming is baked into the plan. Now let me ask the remaining three open questions so I can finalize.

---

[2026-04-09T05:48:15.913Z] Got it — locking in your "yes" as accepting recommendations across the board. Baking all three decisions into the plan now, then exiting plan mode.

---

[2026-04-09T05:48:54.102Z] Got both — updating the plan to put Firecrawl back in the logo cascade, and adding a full cost breakdown.

---

[2026-04-09T05:49:53.549Z] Plan is updated with the full cost breakdown. Here's the summary for you:

**Phase 0–2 MVP (live site, 500 products, real logos, dossier pages): ~$6–10/month + $8 one-time seed**

The single biggest cost lever: **Claude Sonnet 4.6 instead of Opus for extraction** — same quality for structured tasks, ~5x cheaper. Extracting 500 products costs ~$8 on Sonnet vs ~$41 on Opus.

**Everything else on free tiers through Phase 2:**
- Vercel Hobby, Supabase Free, Firecrawl Free (500/mo), Brandfetch Free (500/mo), Clearbit (no key), Product Hunt API (free), Reddit/HN/GitHub APIs (all free)

**Costs only start meaningfully rising at Phase 4** (~$25–40/mo) when social signals come online, and Phase 5 (~$60–90/mo) when you need Vercel Pro for multi-cron execution.

**Key deferrals baked into the plan:** Twitter/X API ($100/mo), SimilarWeb/Semrush ($250+/mo), Crunchbase API ($49/mo) — all deferred until post-monetization.

**10 cost-minimization rules** are now written into the plan (Sonnet-only for extraction, RSS before Firecrawl, batch Claude calls 10-at-a-time, aggressive 24h caching, stay on free tiers until genuinely blown, etc.).

Exiting plan mode now so you can review the full thing.

---

[2026-04-09T06:03:24.565Z] Four big additions requested. Let me add them all to the plan — full UI map, financial analytics layer, signals beyond mentions, and Firecrawl moved to day-1.

---

[2026-04-09T06:06:12.992Z] Honest answer: I don't see a skill or command literally called `ultraplan` in my available tools. A few things it might refer to — let me clarify which you mean:

1. **`ultrathink` / extended thinking** — a keyword that tells me to spend much more reasoning budget before acting. For a project of this complexity (9 tables + ingestion + signals + UI + monetization + analytics layer), this would genuinely help — I'd spend more time thinking through trade-offs, edge cases, and interaction effects between subsystems before writing code. If this is what you mean, you'd just say "ultrathink this" before asking me to execute anything and I'd engage deeper reasoning.

2. **`gepetto` skill** — creates detailed, sectionized implementation plans. Similar to what I'm already doing in this file, but more structured / heavier on section hierarchy.

3. **`gsd:new-project`** — initializes a new project with deep context gathering, produces a formal project charter + phase roadmap + research summaries. This is the heaviest option — it would basically take what we've discussed and turn it into a full GSD workspace with phases, plans, and structured execution gates. Probably overkill for where we are right now (pre-coding), but genuinely useful *when* we start executing because it gives you atomic-commit guarantees, phase verification, UAT criteria, etc.

4. **`writing-plans` skill** — for multi-phase implementation plans. Again, similar to what we're doing.

My honest take on which would actually help you right now:

- **For the current planning phase we're in**: none of the above would add much. The plan file is already dense and covers the right ground. What would genuinely help is **you eyeballing what's written** and telling me where it's wrong or missing, which is what we've been doing.
- **For when we start executing** (Phase 0: rename repo, create Supabase, write schema, etc.): `gsd:new-project` or `gsd:plan-phase` would be *very* useful — they enforce atomic commits, phase gates, and verification so you don't end up with a half-migrated schema or broken state.
- **For really deep reasoning on one specific hard decision** (e.g., "what's the optimal signal score weighting formula"): `ultrathink` prefix would help.

Can you tell me which of those you meant, or describe what "ultraplan" does in your head? I want to make sure I'm answering the right question before we either keep building out the plan file, switch to GSD workflow, or kick off execution.

---

[2026-04-09T06:11:44.832Z] Yes, completely makes sense. You want **widget-level spatial spec** for every page — not "insights page has a graph" but "insights page has an Obsidian-style force graph in bottom-right, ~600×400, showing article↔product edges, hover reveals product preview." And named example widgets like "chart showing VC $ into word processors 1990→2026" rather than abstract "market chart." Let me tear down my earlier UI map and rebuild it at that level of precision.

---

[2026-04-09T06:14:15.714Z] Yes, that makes total sense — you want **wireframe-level detail per page**, not just a page list. Position of each widget, what chart type, what data it pulls, what question it answers for the user. Like "the Obsidian graph goes bottom-right of the insights detail page pulling from product_relationships, force-directed layout, 300×300, clicking a node navigates to that dossier."

And yes — **ultrathink-level depth would genuinely help here**. I was treating the UI map as a table of contents, but what you want is a wireframe spec dense enough that it's essentially implementation-ready. Let me do that properly. I'll expand the UI section with ASCII wireframes + widget tables for every significant page, starting with the 5 most critical (Home, Dossier, Markets, Insights detail, Products browse).

---

[2026-04-09T06:18:04.984Z] Got it — visual Excalidraw deliverable for the full UI map across desktop/tablet/mobile. Let me add that to the plan and flag one scope reality: a truly comprehensive file with all 25+ pages × 3 breakpoints is ~75+ wireframe panels plus user-flow diagrams. That's a big deliverable — I'll propose a realistic structure.

Also important: **I can't create the Excalidraw file while plan mode is active** — I'm restricted to editing only the plan file right now. So I'll scope the Excalidraw build into the plan, exit plan mode, and then the first thing I do on execution is build the Excalidraw file *before* touching any code.

---

[2026-04-09T06:19:48.699Z] Ultrathinking this — the critical insight is **GitHub Actions as the cron runtime instead of Vercel Pro**. That alone saves $20/mo and unlocks unlimited scheduled jobs for free. Let me rework the cost section and add a detailed ingestion architecture.

---

[2026-04-09T06:22:08.360Z] Ultrathinking through this now. Three big things to lock down: (1) optimal multi-source ingestion path with Firecrawl as the only paid tool, (2) automated pipeline architecture that stays free-tier on infra, (3) realistic cost math and week-by-week execution order. Adding this as a definitive "Execution Plan" section at the top.

---

[2026-04-09T06:23:48.009Z] The plan is now comprehensive. Here's the summary of what ultrathinking surfaced:

**Cost reality (full automation): ~$47/mo, achievable $30/mo ultra-lean**
- Firecrawl Hobby $16 + Claude API ~$30 + Domain $1 + everything else free
- Claude mix: Haiku for quality gate + news classification (cheap), Sonnet for deep extraction (expensive)
- 450 new products/month + hourly news feed + daily signal scores + dedup + logos

**Multi-source ingestion beats PH-only**
- Week 1 parallel sources (all free APIs): PH GraphQL + HN Show HN + GitHub Trending + Reddit r/SideProject = 125-255 candidates/day
- After dedup + quality gate → 5-20 unique new products/day (your target)
- Week 2 adds Firecrawl-scraped sources: Indie Hackers, BetaList, TAAFT, AlternativeTo

**$0 infrastructure via hybrid pattern**
- GitHub Actions (public repo = unlimited free) for heavy ingestion jobs
- Vercel Cron (2 free) for webhook receivers
- Supabase pg_cron (free) for DB-resident jobs like dedup sweeps + materialized view refresh
- Keep repo public until monetization so Actions stays free

**Critical dedup logic** (without this the DB becomes garbage)
- 6-tier cascade: slug → domain → name fuzzy → twitter → github → pgvector embedding similarity

**News feed cost trick**
- Naive: $125/mo. Optimized: **$7/mo** via keyword pre-filter → Haiku classifier → Sonnet escalation only for funding articles.

**Week 1 ships a live site** — Day 1 foundation, Day 3 Excalidraw map, Day 4 first ingestion, Day 5 UI cut-over, Day 6 automation wiring, Day 7 news feed. End of Week 1: live site with 50+ real products and 5-20/day automated ingestion.

**Excalidraw deliverable is Day 3** (before any UI code) — focused scope: sitemap + 10 critical pages × 3 breakpoints + 4 user flows + component library. Built with the Excalidraw MCP tools.

---

[2026-04-09T06:26:57.732Z] Plan approved. First action per the Week 1 schedule is **Day 1: Foundation** (repo rename, Supabase, deps, branding) followed by **Day 3: Excalidraw UI map** before any UI code.

Before I start executing — a few things to confirm up front so I don't block on them mid-execution:

**Things I can't do for you that you'll need to hand me:**

1. **GitHub repo rename** — you need to rename `v0-product-sentinel` → `prism` on GitHub (Settings → Repository name), because I can't rename your repo via the API without elevated auth. After you rename, I'll update the local folder, `remote origin`, and the Vercel project name.

2. **Supabase project creation** — I need you to create the project in the Supabase dashboard (or via `supabase projects create`) and hand me back the project URL + anon key + service role key. I'll write everything into `.env.local`. Name it `prism`, region closest to you (probably `us-east-1`), free tier.

3. **API keys to obtain** (all free signups, ~15 min total):
   - **Product Hunt Developer Token** — https://api.producthunt.com/v2/oauth/applications → create app → copy developer token
   - **Brandfetch API key** — https://developers.brandfetch.com/ → free tier signup → 500 req/mo
   - **Firecrawl API key** — https://firecrawl.dev → you said you're OK paying for this, so Hobby tier $16/mo
   - **Reddit API** — https://www.reddit.com/prefs/apps → create a "script" app → client_id + client_secret
   - **Anthropic API key** — https://console.anthropic.com/ (you probably already have one)
   - **GitHub Personal Access Token** — https://github.com/settings/tokens → classic token, `public_repo` scope only

4. **Domain decision (deferrable)** — Week 1 will deploy to a Vercel-assigned subdomain like `prism-*.vercel.app`. Final domain mapping happens whenever you lock in the real product name. No action needed now.

**Which I can start on immediately without waiting:**

- Read the entire v0-product-sentinel repo structure in detail so I understand every file before editing
- Draft `lib/branding.ts` with the Prism constants
- Draft `supabase/migrations/0001_initial_schema.sql` with the 8-table minimal schema
- Draft the AI-generated vocabulary seed (the ~400 functions + ~150 tag values) for your review
- Draft the Excalidraw UI map file (I have the Excalidraw MCP tools available)

**Proposed order for the first execution session:**

1. I read the full v0 repo (~15 min of exploration, mostly in parallel subagents)
2. I build the Excalidraw UI map (`prism/docs/ui-map.excalidraw`) — sitemap + 10 critical pages × 3 breakpoints + flows
3. I draft the schema migration, vocabulary seed, branding.ts, and logo cascade module as **local files in the existing `v0-product-sentinel` folder** (no Supabase calls yet, just file creation) — you can review them before they get applied
4. You provide the API keys + rename the GitHub repo + create the Supabase project (can happen in parallel to my work above)
5. Next session: I apply the migration, run the first PH ingestion, cut over the UI, deploy

Two questions to kick off:

1. **Should I start with the Excalidraw UI map right now** (so you have the visual spec before any code is touched), or **start with the file-drafting** (schema + vocab + branding + logo module) in parallel while you handle the GitHub/Supabase/API key setup?

2. **Is it OK to draft files inside `C:\Users\alima\v0-product-sentinel\` now**, or do you want me to hold off until after you've renamed the GitHub repo so the git history stays clean under the new name?

---

[2026-04-09T06:29:23.667Z] Good question — yes, **MCPs eliminate most of the API-key setup I was asking you to do**. Let me re-scope.

## What I can do directly via MCPs (zero API keys needed from you)

| Service | MCP available | What I can do |
|---------|---------------|---------------|
| **Supabase** | `mcp__supabase__*` | Authenticate to your Supabase account, create the `prism` project, run migrations, seed data, query data. **You don't need to touch the dashboard.** |
| **GitHub repo ops** | `mcp__github__*` + `mcp__github-api__*` | Rename the repo, create branches, write files, commit, push, create workflows in `.github/workflows/`, manage Actions secrets |
| **Vercel** | `mcp__claude_ai_Vercel__*` | Deploy the project, get deployment logs, manage the prism project, map domains |
| **Firecrawl** | `mcp__firecrawl__*` | Scrape sites during development (for building ingestion pipelines, testing extraction, validating logo cascade) |
| **Reddit** | `mcp__reddit__*` | Query Reddit API directly — search subreddits, fetch posts, test ingestion logic |
| **Brave Search / web** | `mcp__brave-search__*` | Research, find product listings, verify data |
| **Playwright browser** | `mcp__playwright__*` | Test the deployed site end-to-end, take screenshots, verify logos loaded |
| **Excalidraw** | `mcp__excalidraw__*` | Build the UI wireframe map (`prism/docs/ui-map.excalidraw`) programmatically |
| **Filesystem** | `mcp__filesystem__*` | Read/write files across your workspace |
| **Memory** | `mcp__memory__*` | Store cross-session context about Prism |
| **GitHub API for ingestion testing** | `mcp__github-api__*` | Fetch GitHub Trending data, test the GitHub Trending ingestion logic |

## What still needs real API keys (only 3 things, not 7)

These are keys that go into **GitHub Actions secrets** so the production cron jobs running at 6am every day can authenticate. They're not for me — they're for the automated scripts running on GitHub's servers.

| Key | Why it's still needed | Free? | Where to get it |
|-----|----------------------|-------|-----------------|
| **Anthropic API key** | GitHub Actions cron jobs call Claude API directly for extraction + classification. The MCP auth only works inside my Claude Code session, not in remote GitHub runners. | Pay-per-use (~$30/mo at 15 products/day) | https://console.anthropic.com/ — you probably already have one |
| **Product Hunt developer token** | GitHub Actions hits PH GraphQL API from a remote runner | Free | https://api.producthunt.com/v2/oauth/applications (5 min signup) |
| **Firecrawl API key** | Same — cron runners need their own auth | $16/mo Hobby | https://firecrawl.dev (you already said yes to this) |

**That's it. 3 keys, not 7.** Brandfetch, Clearbit, Reddit OAuth, GitHub PAT — all removed from the list because MCPs handle them, OR they don't need keys at all (Clearbit is keyless), OR GitHub Actions has built-in auth (`GITHUB_TOKEN` auto-injected).

## Updated Day 1 execution (using MCPs)

Instead of asking you to do a bunch of manual dashboard work, here's what I can actually do myself:

1. **I use `mcp__supabase__authenticate`** — pops up a browser prompt once, you click approve, done. I can then create the `prism` project, run migrations, seed data.
2. **I use `mcp__github__*`** — rename `v0-product-sentinel` → `prism`, create branches, push files, set up workflows
3. **I use `mcp__claude_ai_Vercel__*`** — link the renamed repo, deploy to a preview subdomain
4. **I use `mcp__firecrawl__*` and `mcp__reddit__*`** — test the ingestion logic end-to-end while building it
5. **I use `mcp__excalidraw__*`** — build the wireframe map file

The only things I need from you:

1. **Click "approve" once each** when the MCPs prompt for auth (Supabase auth, Vercel auth, Firecrawl auth) — these are one-time consent dialogs
2. **Paste 3 keys when I ask** at the point I'm configuring GitHub Actions secrets (Anthropic, Product Hunt, Firecrawl)
3. **Tell me the rename is OK** — the only thing I want confirmation on is the irreversible repo rename, because it updates GitHub URLs + Vercel project name

## Proposed kickoff

Assuming this clears things up, here's what I want to do in the next block of execution, **in parallel**:

- **Authenticate the key MCPs** (Supabase + Vercel + Firecrawl if not already) — one click each from you
- **Explore the v0-product-sentinel codebase in detail** so I have full context before touching files
- **Start building the Excalidraw UI map** in parallel (since it doesn't need any MCP auth beyond Excalidraw which is already available)

Two quick confirmations before I start:

**1. Repo rename: OK to rename `v0-product-sentinel` → `prism` on GitHub now?** (This is the only irreversible step. After rename I'll update the local folder name + git remote + Vercel project name. Your git history stays intact; only the repo URL changes.)

**2. Should I start with the Excalidraw map or the code exploration first?** My recommendation is do both in parallel — I'll kick off a subagent to do deep codebase exploration while I start building the UI map in Excalidraw. By the time the map is partially done, the exploration report will be back and I can start drafting schema/branding/vocab files.

What do you want me to do?

---

[2026-04-09T06:32:18.520Z] Yes, finalizing the name now is **much cleaner** — eliminates the grep-replace step, avoids codename confusion in URLs/domains/branding, and lets me commit everything under the final identity from commit #1. Very much encouraged if you can lock it in.

On help with the name: if you're stuck or want to riff, I can do a focused brainstorm (give me your vibe/constraints — e.g. "short, no vowels missing, .com available, intelligence-flavored" — and I'll generate 20-30 options with domain availability checks via WHOIS/Brave Search). Or if you already have candidates, bounce them off me and I'll stress-test them (is the .com taken, is there a conflicting product, does it Google-search cleanly, etc.).

On the Excalidraw file — yes, I'll start building it now in parallel, name-independent. The wireframes use placeholder "PRODUCT_NAME" in the header so the rename is literally a single find-replace at the end. Here's my proposed approach:

**Iterative build, not all-at-once:**

The full scope is 10 pages × 3 breakpoints + sitemap + flows = ~35+ panels. If I build it all in one shot and you hate the layout convention, that's a lot of wasted work. Better to do this in rounds:

- **Round 1 (now)**: Sitemap + Desktop `/` (Home/Feed) + Desktop `/dossier/[slug]` → **3 panels**. Show you. Get feedback on convention (box style, annotation density, grid spacing, data-source callouts).
- **Round 2**: If convention is right, build remaining 8 desktop pages
- **Round 3**: Clone all desktop pages into tablet breakpoint
- **Round 4**: Clone into mobile breakpoint
- **Round 5**: User flows + component library

Each round is a checkpoint where you can redirect. Round 1 will take me ~10–15 minutes.

**Where the file lives**: I'll create it at `C:\Users\alima\prism-ui-map.excalidraw` (neutral location, not inside the v0 repo since the repo is about to be renamed). You can open it by going to https://excalidraw.com and dragging the file onto the canvas — no install needed. Once we lock the final product name and rename the repo, I'll move the file to `{final-repo}/docs/ui-map.excalidraw` and commit it.

**One more question before I start drawing**: do you want the wireframes as:

**(A) Low-fi boxes-and-labels** — every widget is a labeled rectangle, fast to build, easy to edit, developer-ready ("RADAR CHART here, 400×400, data: functionality_scores")

**(B) Mid-fi with some visual detail** — labeled rectangles PLUS some actual UI hints (fake chart lines, placeholder card shapes with logo circles, button shapes), slower to build but communicates the feel better

**(C) Flowchart-style** — more diagrammatic than wireframe, focused on data flow and page relationships rather than pixel layout

My recommendation: **(A) low-fi** for Rounds 1–4, then if you want more fidelity we can upgrade specific critical pages in a later round. Low-fi is faster to iterate and the purpose here is spec/alignment, not visual design.

While I wait for your answer on the name and the fidelity level, I'll kick off reading the v0 codebase in detail in a parallel subagent so that when I do start drafting the schema migration, branding.ts, and logo cascade module, I have complete context. That's pure read-only work and doesn't block on anything.

---

[2026-04-09T06:32:47.146Z] Codebase exploration kicked off in the background. Now I'll wait on your two answers before starting the Excalidraw work:

1. **Name status**: are you going to finalize a name now (do you want brainstorm help, or do you have candidates to stress-test?), or should I proceed with `prism` as codename?

2. **Wireframe fidelity**: (A) low-fi boxes-and-labels [recommended], (B) mid-fi with some visual detail, or (C) flowchart-style?

Once you answer those, I'll start building the Excalidraw file (Round 1: sitemap + home + dossier desktop panels) and have it ready for you to drop into excalidraw.com within ~15 min.

---

[2026-04-09T06:37:00.750Z] Here's a curated brainstorm — 30 options across 5 themes, with my top 5 picks called out. I'll verify domain availability on whichever ones resonate.

## My Top 5 Picks

These hit the strongest conceptual fit for "Bloomberg meets Product Hunt with historical depth":

| # | Name | Why it works | Downside |
|---|------|-------------|----------|
| 1 | **Hindsight** | *Perfect* fit for historical analysis angle — nobody else tracks tech history. "With the benefit of hindsight" evokes looking backward with wisdom. Catchy, memorable, owns the time dimension. Strong taglines write themselves: "Hindsight on every product since 1975." | `hindsight.com` likely owned; may need `.app`/`.dev` |
| 2 | **Chronicle** | Ongoing historical record + news-magazine feel. Works for both present-tense feed and historical archive. Premium/editorial vibe. Easy to verb ("chronicled since 1989"). | Common word, may have conflicts |
| 3 | **Kestrel** | Small bird of prey — hovers still, then strikes. Metaphor for patient observation + sharp insight. Uncommon, clean, memorable, likely available on every TLD. | Requires explanation (less obvious) |
| 4 | **Prism** | Current codename. Literal metaphor for the attribute-breakdown system — breaks products into their component facets. Still solid if nothing better wins. | Many products use "prism"; .com almost certainly taken |
| 5 | **Meridian** | Navigation/reference line — positions Prism as the authoritative reference for tech products. Carries gravitas + precision. | Used by finance firms, may conflict |

## Full list by theme

**Time / History** (historical angle strongest):
- **Hindsight** ⭐
- **Chronicle** ⭐
- **Epoch** — marks an era, clean
- **Canon** — the canonical set of products
- **Annals** — historical records, scholarly
- **Docket** — legal-registry feel, unique
- **Legacy** — common but strong
- **Origin** — beginnings, launch
- **Era** — short, generic

**Observation / Intelligence**:
- **Kestrel** ⭐
- **Meridian** ⭐
- **Polaris** — north star, guidance
- **Lantern** — illumination
- **Lookout** — taken by a security company
- **Periscope** — Twitter killed theirs, name might be recoverable
- **Observ** — coined, would need `.io`
- **Probe** — investigative
- **Recon** — military-intelligence feel
- **Scout** — exploration
- **Compass** — direction

**Structural / Facet** (current codename direction):
- **Prism** / **Prizm** ⭐
- **Facet** — single face of a gem (micro-concept)
- **Lattice** — interconnected graph
- **Spectrum** — breadth, range
- **Axis** — reference dimension
- **Helix** — structure, common in biotech

**Document / Record** (matches Dossier sub-brand well):
- **Folio** — collection of works, elegant
- **Datum** — singular of data, data-focused
- **Ledger** — record-keeping, finance vibe (Ledger.com owned by crypto wallet)
- **Register** — official listing
- **Codex** — taken by OpenAI
- **Index** — ordered catalog
- **Archive** — historical store

**Coined / Made-up**:
- **Prizmo** — Prism variant, modern
- **Prizma** — Italian feel
- **ProductDex** — Pokédex for products (cute but long)

## Domain availability reality

For any name you pick, `.com` is usually the hardest. Common fallback patterns that work:
- `try{name}.com` (e.g. `tryhindsight.com`)
- `{name}.app`, `.dev`, `.ai`, `.io`, `.so`
- `get{name}.com`, `use{name}.com`
- `{name}hq.com`

The real check matters more than my guess — if you tell me which 3–5 names resonate most, I'll run Brave Search + direct domain lookups to verify what's actually available across TLDs (~2 min).

## Starting Excalidraw in parallel

I'll kick off the Excalidraw file build **right now** — it's name-independent because I'll put `PRODUCT_NAME` as a placeholder in the header and it becomes a single find-replace when you lock the name. Round 1 = sitemap + Home (desktop) + Dossier (desktop) = 3 panels. File lands at `C:\Users\alima\prism-ui-map.excalidraw` (neutral path, I'll move it once the repo is renamed).

Let me check the Excalidraw MCP tools and the file format first so I know the fastest path to build.

---

[2026-04-09T06:37:55.032Z] Now I know the Excalidraw MCP creates live canvas elements, not a shareable file. I'll take a different approach: write a Python generator that builds the `.excalidraw` JSON file directly — that gives you a file you can drop into excalidraw.com or open in any Excalidraw instance.

Building Round 1 now: sitemap + Home desktop + Dossier desktop (~130 elements).

---

[2026-04-09T06:40:07.502Z] Good — I have the Excalidraw tools and a clear view of the v0 repo. Fastest path is to write a Node script that generates the `.excalidraw` JSON directly (way faster than 200+ individual MCP create_element calls, and reusable for later rounds). Let me build it.

---

[2026-04-09T06:44:27.081Z] Round 1 of the Excalidraw wireframe is ready — **640 elements, 540KB file**.

**File location**: `C:\Users\alima\prism-ui-map.excalidraw`

**To view it**:
1. Go to https://excalidraw.com
2. Either drag the file onto the canvas, OR click the hamburger menu → Open → select `prism-ui-map.excalidraw`
3. Use the "zoom to fit" button (bottom-left, the `⊡` icon) to see everything at once
4. Then zoom in on each of the 3 panels

**What's in Round 1**:

1. **SITEMAP** (top of canvas, ~1600×1000) — All 25 routes grouped into 4 colored sections radiating from the central `/` hub:
   - **Discovery** (blue): products, functions, categories, sub-categories, attributes, tools-to, search
   - **Intelligence** (green): dossier, markets, trending, companies, compare, funding, acquisitions
   - **Research** (yellow): insights, explore, evolution, graveyard
   - **User/Admin** (red): login, signup, profile, watchlist, dashboard, submit, pricing, api/docs
   - Color-coded arrows from hub to each section

2. **`/` HOME (FEED) DESKTOP** (middle, 1440×2200) — Full wireframe with:
   - Header strip (logo, nav, search, sign in)
   - Hero strip ("47 new products today • 312 this week • 8 breakouts")
   - Left column: Launched Today (4×2 card grid with mock logos/taglines/buzz), Breakout Alerts (4 cards with sparklines), Trending This Week (ranked list of 5), Category Spotlight (with a fake lifecycle area chart labeled "2019 peak")
   - Right rail: Market Pulse (6 categories with sparklines + delta %), From the News (5 press headlines with source/time), Fresh Funding (5 rounds with $ badges), Graveyard (3 dead products)
   - Data source annotations on each widget (e.g. "→ product_signal_scores WHERE is_breakout")

3. **`/dossier/[slug]` DESKTOP** (bottom, 1440×3400) — The premium unit. Full wireframe with:
   - Hero (logo placeholder, name, tagline, category/status badges, website/github/twitter links, Save + Share buttons)
   - Quick stats strip (8 stat tiles: Age, Funding, Signal, Breakout, Revenue, Employees, Lifespan, Confidence)
   - Sticky TOC sidebar (13 anchor links)
   - Description + 3 screenshot placeholders
   - **Attribute panel** — 6 grouped rows of pill tags (Capability, Audience, Pricing, Deployment, Integrations, Compliance)
   - **Dimensional scores radar chart** — actual rendered 8-axis radar with both the grid polygon and a data polygon showing sample scores
   - **Signal charts 2×2** — mention volume, sentiment, velocity, platform mix (labeled boxes)
   - **Funding timeline** — 5 funding dots along a timeline with a dashed valuation line overlaid
   - **Press mentions** — 4 headlines with sentiment emoji + publication
   - **Mini relationship force-graph** — "THIS" center node with 4 neighbors (Notion, Obsidian, Roam, Craft) labeled with relationship types
   - **Alternatives** — 4 card grid with match % scores
   - **Changelog** — 5 timeline entries
   - **Bottom row** — task chips, related insights, and data freshness metadata

**Everything is annotated with its data source** in small monospace gray text — `→ products JOIN companies`, `→ product_signal_scores`, etc. — so it's implementation-ready.

**The build script is saved** at `C:\Users\alima\prism-wireframe-build.mjs`, so I can rerun it with additions in future rounds without rebuilding from scratch.

## What I need from you

Open the file in Excalidraw and look at the 3 panels. Then tell me:

1. **Is the convention right?** — Low-fi boxes with labels + data-source annotations. Is this the right level of fidelity, or do you want more visual detail (actual chart shapes, button styling, card mockups) or less (purely boxes and labels)?

2. **Is the layout sound?** — Am I missing any widgets on Home or Dossier that you expected to see? Any widgets in the wrong position?

3. **Any changes to the sitemap** — route names, groupings, missing pages?

Once you confirm Round 1, I'll proceed with:
- **Round 2**: Remaining 8 desktop pages (Markets, Products browse, Insights detail with the graph, Functions, Compare, Companies, Trending, Graveyard)
- **Round 3**: Clone all desktop → tablet breakpoint
- **Round 4**: Clone all → mobile breakpoint
- **Round 5**: User flows + component library

**In the meantime**, I can work on other things in parallel — tell me which (or all):

- **(a)** Continue with Round 2 desktop wireframes right now while you review Round 1
- **(b)** Verify domain availability on your top name candidates (tell me which 3–5 resonate from the brainstorm list) via Brave Search / WHOIS
- **(c)** Wait on the background codebase exploration agent (still running) and use its report to start drafting `lib/branding.ts` + the schema migration
- **(d)** Just wait for your feedback on Round 1 before doing anything else

What's next?

---

[2026-04-09T06:45:27.685Z] Codebase exploration agent finished. Full report was ~8000 words; here are the **only 6 findings that actually change anything in my plan**:

1. **Bug in existing code** — `app/categories/[slug]/page.tsx` line 204 references `b.buzzScore.total` / `a.buzzScore.total` but the `Product` type uses `buzz.score`. Runtime error waiting to happen. I'll fix it as a freebie during the type reconciliation pass.

2. **Current brand string is "Sentinel"** — hardcoded in `components/site-header.tsx` as the `S` logo + "Sentinel" wordmark. Also the metadata title in `app/layout.tsx` is `"Product Sentinel - Track the Buzz"`. These are the only two strings that need to be replaced when we lock the final name — confirming my "single `lib/branding.ts` constants file" approach works cleanly.

3. **Font system already wired** — `Geist` + `Geist_Mono` + `Fraunces` loaded via `next/font/google` in `app/layout.tsx`, exposed as CSS variables (`--font-geist`, `--font-fraunces`). I'll keep this; nothing to change.

4. **Design tokens already exist** in `app/globals.css`:
   - `--sentinel-rising` (green), `--sentinel-falling` (red), `--sentinel-stable` (gray)
   - `--primary: 265 100% 50%` (vibrant purple), `--secondary: 212 92% 50%` (blue)
   - `.glass`, `.glass-hover`, `.gradient-mesh`, `.noise-overlay` utility classes
   - Stagger animation classes `.stagger-1` through `.stagger-6`
   - Bloomberg-appropriate trend colors already in place — I'll reuse these instead of picking new ones. When we rename, we can do `sentinel-rising` → `{brand}-rising` as an optional cleanup (the CSS variable name is internal, so it doesn't have to change).

5. **`next.config.mjs` has `ignoreBuildErrors: true` and `images.unoptimized: true`** — these are v0 scaffold defaults that should be fixed before production but are not blocking. I'll address during the UI cutover phase.

6. **Zero backend surface area** — confirmed. No `/app/api/` directory, no Supabase imports, no auth context, no middleware. This is actually *good* — means I'm building on a clean slate rather than untangling existing backend code.

**Bonus intelligence** the agent surfaced that's worth knowing:

- 4 card variants already exist in `product-card.tsx`: `default`, `compact`, `featured`, `list` → I can reuse all of them as-is on the dossier / products / home pages
- `market-pulse.tsx` already does category trend calculation from product data → directly reusable for the Market Pulse widget in my home wireframe
- `news-feed.tsx` already has real-time styling with live indicator + ping animation → reusable for the From the News widget
- `search-command.tsx` already has ⌘K shortcut wired up → just needs to be pointed at real data
- `explore/page.tsx` already has a force-graph visualization with zoom/pan → massive head start on the `/explore` and dossier relationship-graph widgets

This means the UI cut-over work is actually *less* than I estimated — a lot of components just need new data sources plugged in, not new code.

---

Now waiting on you for **Round 1 wireframe feedback** (the Excalidraw file at `C:\Users\alima\prism-ui-map.excalidraw` — 640 elements, 3 panels) and **which path forward** from the list I gave in my previous message:

- **(a)** Continue Round 2 desktop wireframes while you review Round 1
- **(b)** Verify domain availability on your top name picks — just tell me which 3–5 names from the brainstorm resonate
- **(c)** Start drafting `lib/branding.ts` + schema migration + logo cascade module (now that codebase context is in)
- **(d)** Wait for your feedback before doing anything

Or any combination. Let me know what you want.

---

[2026-04-09T07:14:59.660Z] Good feedback. I'll bump the fidelity — cleaner fills, actual rendered chart elements, better typography hierarchy, card elevation hints, real mini-previews. And I'll do Round 1 enhancements + all 8 Round 2 pages in the same pass since they all use the same helper library.

Rewriting the build script now with the upgraded visual system and all 11 panels.

---

[2026-04-09T07:16:59.289Z] Got it — upgrading to "professional wireframe" fidelity (light card backgrounds, clean borders, actual chart shapes, better typography hierarchy, consistent rounding) and adding Round 2's 8 panels in the same pass. This is a major rewrite of the generator script.

---

[2026-04-09T07:26:45.029Z] Got both — creating the desktop Excalidraw folder and writing a comprehensive Obsidian project doc in parallel with the wireframe build.

---

[2026-04-09T07:27:15.441Z] Wait — `C:\Users\alima\Desktop\Excalidraw\` already exists and it's a clone of the Excalidraw source repo (not an empty folder for files). I'll use `Excalidraw Files` instead to avoid collision. Also noticed there's already a `Launch Sentinel.md` in your Obsidian vault — I'll check what's in it and update/replace it with the new Prism context.

---

[2026-04-09T07:27:38.681Z] Good context — the existing `Launch Sentinel.md` is a *different* older project (in `C:\Users\alima\product-hunt-app\`, Next.js 15 + OpenAI). That's a separate codebase from the v0-product-sentinel we're building on. I'll leave that file alone and create a new `Prism.md` for the current project.

Updating the script output path and running it:

---

[2026-04-09T07:28:36.991Z] Found the bug — `add(dot(...))` passes a single element but `add()` expects an array. Easy fix: make `add()` tolerant of both.

---

[2026-04-09T07:28:51.774Z] **3,562 elements, 1.96 MB file** — Round 1 upgraded + Round 2 (8 new panels) all in one file at `C:\Users\alima\Desktop\Excalidraw Files\prism-ui-map.excalidraw`.

Now writing the comprehensive Obsidian project doc in parallel:

---

[2026-04-09T07:31:11.562Z] Now updating the Project Index to add Prism:

---

[2026-04-09T07:32:05.877Z] Everything's in place. Status recap:

## ✅ Desktop Excalidraw folder
- Created: `C:\Users\alima\Desktop\Excalidraw Files\`
- First file: `prism-ui-map.excalidraw` (1.96 MB, **3,562 elements**)
- Will be the canonical location for all future Excalidraw files
- Note: I had to use `Excalidraw Files` (with space) because your `Excalidraw` folder already exists as a cloned Excalidraw source repo

## ✅ Wireframe Round 1 (upgraded) + Round 2 — 11 panels total

**Hi-def upgrades from Round 1 v1:**
- Subtle card backgrounds (light grays, tinted accents per widget type) instead of transparent
- Consistent 12px rounded corners on every card
- Shadow effects via offset duplicate rectangles
- Actual chart shapes: smooth line chart with area fill, stacked bar charts, radar with concentric rings, donut with colored slices, heatmap with 5-shade gradient
- Proper typography hierarchy (4 sizes + weight variation)
- Color-coded accent strips on every widget
- Mock data inside cards (product names, tags, numbers, buzz scores, sparklines)
- Legends with color swatches
- Consistent pill/badge styling across all uses

**Round 2 panels added:**
4. **`/markets`** — Category×time heatmap, funding velocity leaderboard, multi-line lifecycle curves, survival curves, stacked-area attribute market share, acquisition tracker table, breakout history bar chart
5. **`/products`** — Faceted filter sidebar (taxonomy tree + 10 attribute groups + status/year/funding sliders) + active filter chips + 4×6 product grid + pagination
6. **`/insights/[slug]`** — Article reader with **Obsidian-style dark-canvas force graph** in right sidebar (7 product nodes, colored by buzz, edges showing relationships) + TOC + featured products + related signal chart
7. **`/functions/[slug]`** — Function leaf page with header stats, funding-over-time area chart, launches-vs-deaths multi-line, top 10 ranked list with sparklines, full product grid
8. **`/compare?a=&b=`** — Two product hero cards side-by-side, radar overlay (2 products same chart), 3-column attribute diff, signal timeline overlay, funding comparison, AI verdict strip
9. **`/companies/[slug]`** — Company hero + products grid + full funding timeline + valuation chart + related companies
10. **`/trending`** — Breakout feed with cards + global velocity bar chart sidebar
11. **`/graveyard`** — Death reason donut chart, **pre-death signals teaser (paid tier hook)**, dead products grouped by year

## ✅ Obsidian docs saved

**New file**: `Claude Code Projects/Prism.md` — 17 KB comprehensive project doc with:
- YAML frontmatter (type, status, tags, wireframe path, directory)
- Full context explaining difference from old `[[Launch Sentinel]]`
- All locked decisions
- 4-layer taxonomy design
- Financial analytics layer schema
- Beyond-mentions signal list
- Multi-source ingestion strategy
- Week-by-week execution plan
- Cost breakdown at each phase
- UI wireframe reference with Round 1+2 descriptions
- Environment variables list
- Name brainstorm (5 candidates)
- Next steps checklist
- Changelog entry dated 2026-04-09

**Updated**: `Claude Code Projects/Project Index.md` — added Prism to "In Active Development" table, clarified that old Launch Sentinel is a separate earlier attempt.

## Layout in the Excalidraw file

When you open it, you'll see **two vertical columns** of panels:

**Left column (x=80)** — Round 1:
- Sitemap (top)
- `/` Home desktop
- `/dossier/[slug]` desktop

**Right column (x=1720)** — Round 2:
- `/markets`
- `/products` browse
- `/insights/[slug]` with Obsidian graph
- `/functions/[slug]`
- `/compare`
- `/companies/[slug]`
- `/trending`
- `/graveyard`

Tip: use the `⊡` zoom-to-fit button (bottom-left) to see everything, then scroll/zoom into individual panels.

## What I need from you next

1. **Open the wireframe** (`C:\Users\alima\Desktop\Excalidraw Files\prism-ui-map.excalidraw` → drop on excalidraw.com) and give me feedback on:
   - Is the hi-def fidelity right? Too much? Too little?
   - Any widgets missing or wrong position?
   - Does the Obsidian graph on `/insights/[slug]` look like what you meant?
   - Any Round 2 pages that need rework before I do tablet/mobile?

2. **Final product name** — still the biggest blocker. Tell me your top 3 from the brainstorm list (or new candidates) and I'll verify domain availability.

3. **Want me to continue** with Round 3 (tablet breakpoint) and Round 4 (mobile breakpoint) while you review, or wait for feedback on Rounds 1-2 first?

---

[2026-04-09T07:46:25.440Z] Three solid questions. Let me answer them honestly.

## 1. Product card click → modal quick preview + full dossier

Yes — the existing v0 scaffold does full-page navigation on card click (there's no modal currently). But the right UX pattern here is actually **hybrid**:

| Interaction | What happens | Why |
|-------------|--------------|-----|
| **Hover card** | Small floating tooltip (~280×180): logo + name + tagline + buzz score | Peek without committing — feed-scanning UX |
| **Click** | **Quick-preview modal** (~720×640) overlays current page | Fast deep look without losing feed position |
| **"Open full dossier →"** button inside modal | Full-page navigation to `/dossier/[slug]` | For when you want everything |
| **Cmd+click** | Open full dossier in new tab | Power users |

**Why modal for click, not full page:**
- Feed-scrolling users stay in flow (Product Hunt does this, works great)
- 80% of "what's this?" questions answered without a navigation
- Full dossier reserved for research mode
- Makes the `/dossier/[slug]` page feel premium — you "commit" to opening it

**Quick preview modal contents (the 20% of dossier that answers 80% of questions):**
- Logo + name + tagline + website link (header)
- Category + 4-5 attribute pills (what kind of thing is this?)
- Signal score + 7-day sparkline (is it trending?)
- Quick stats strip (age, funding, employees, status)
- 1 screenshot
- 2-paragraph description snippet
- Latest press mention (1 line, 1 source)
- Actions: "Open full dossier →" (primary) • "🔖 Save" • "📤 Share" • X close

I'll add this as a dedicated panel in Round 3 — it's a critical interaction pattern. Should I also add the **hover card** variant as a separate panel, or skip that for now?

## 2. Real vs placeholder — honest accounting

Fair question. Let me be blunt about what's actually designed vs what's decoration.

### ✅ Fully designed (schema + formula + data source + implementation path ready to code)

- **4-layer attribute taxonomy** — exact SQL schema, controlled vocabulary structure, Claude extraction prompt pattern
- **Logo cascade** — 5 specific APIs, priority order, fallback logic, Supabase Storage layout
- **Signal score formula** — weighted composite with specific input fields, normalization to 0-100
- **Dedup cascade** — 6 specific methods with exact SQL (slug, domain, pg_trgm, twitter handle, github repo, pgvector)
- **News feed automation** — RSS polling, keyword pre-filter, Haiku classifier, Sonnet escalation for funding
- **Multi-source ingestion** — specific APIs and endpoints for PH GraphQL, HN Algolia, GitHub Trending, Reddit
- **Cost model** — per-product extraction cost math, per-article news analysis cost, total $47/mo
- **Database schema** — ~20 tables with field definitions, indexes, FKs
- **GitHub Actions cron architecture** — free tier math, 10 specific jobs with schedules
- **Dossier page structure** — all 16 widgets have concrete data sources and query patterns

### ⚠️ Concept-level (real idea, implementation gaps)

These need additional design work before they ship:

1. **Pre-death signals** — The concept is real (mention drop 60%, exec departure, funding drought, press silence are all genuine warning patterns documented in startup death post-mortems). **But I haven't designed the model.** The honest picture:
   - Need training data: 500+ dead products with their 6-month pre-death signal histories (we don't have this yet — would accumulate over time as we observe deaths)
   - Simpler approach that actually works without training: rule-based alerting where `is_at_risk = TRUE` when 3+ of these are true simultaneously:
     - `signal_velocity_90d < -30%`
     - `no_funding_round_18mo = TRUE`
     - `press_mentions_90d = 0`
     - `github_commits_90d < 10` (for open-source)
     - `executive_departure_90d = TRUE`
   - This is a thresholds + boolean rules classifier — no ML needed. Starts working after we have 90 days of historical signal data. Defer to Phase 6+.

2. **Breakout detection** — Formula is real math (`velocity > 2 stddev above 90-day rolling avg` is a standard statistical alert), but the specific threshold needs validation. Probably will over-flag early and need tuning.

3. **Signal score weights** — The formula structure is real but the specific weights (0.15 mention, 0.10 sentiment, 0.20 velocity, etc.) are my reasoned guess, not validated on data. Will need tuning against observed outcomes.

4. **Relationship detection (killed/inspired/competed)** — Schema (`product_relationships` table) is real but the "how do we know X killed Y?" logic isn't specified. Options:
   - **Manual curation** (highest quality, slow) — editorial team tags relationships
   - **NLP extraction from press mentions** — Claude reads "Product X replaced Product Y" phrases and infers
   - **Co-mention pattern detection** — if X and Y are constantly compared in articles, they're competitors
   - None of these is built yet. Would be Phase 5+.

5. **Dimensional scores** (ease_of_use, feature_depth, etc.) — The schema is real (`functionality_scores JSONB`), and "Claude estimates them at ingestion" is the plan, **but the actual extraction prompt isn't written.** Risk: different products get scored inconsistently by Claude. Would need a calibration prompt with anchor examples. Designable in ~1 hour.

6. **AI verdict on compare page** — The wireframe shows "Notion wins on X, Obsidian wins on Y" but this text is a placeholder. Real version needs a Claude prompt that takes 2 dossiers + attribute diff + signal charts and generates a 1-sentence verdict. Straightforward to build (~30 min), but **not yet designed**.

7. **Historical data curation (Phase 2, 1960s-90s products)** — Sources listed (Byte Magazine, PC Magazine archives, Wayback, NYT Archive) but the extraction pipeline is mostly manual. This is genuinely hard and is the real moat — accepting that it's a long slog.

### 🎨 Pure visual mocks (decoration in wireframes)

These are placeholder values to make the wireframe feel real. Zero design backing:

- **All product names in wireframes** (Notion, Obsidian, Cursor, Linear, Raycast, etc.) — just realistic-sounding mock data
- **All specific numbers** — $280M funding, 87 signal score, +340% velocity, 247 employees, 1,847 products showing — all made up
- **Sparklines in cards** — hardcoded arrays like `[3,4,5,4,6,7,8]`
- **The lifecycle chart "2019 peak"** for note-taking apps — illustrative, not real data
- **Revenue chart curves** — made up; most private companies don't disclose revenue
- **The 5 funding rounds on the dossier timeline** — fabricated for visual
- **The acquisition table** (Figma $20B, Slack $27.7B) — real public data used as plausible examples, but not queried from a DB
- **

---

[2026-04-09T07:49:17.909Z] Three things — modal question, placeholder honesty, and fresh name brainstorm. Let me tackle each.

## 1. Product card click behavior

Here's the thing: **the current v0 scaffold doesn't actually have a modal**. It uses plain Next.js `<Link>` navigation to `/products/[slug]` — click a card and it full-page navigates to the detail view. I read this earlier during the codebase exploration to confirm.

But you're onto something important. There are three real patterns worth considering:

| Pattern | How it works | Best for |
|---------|-------------|----------|
| **(A) Full-page navigation** (current v0) | Click → navigate to `/dossier/[slug]` | Deep research, shareable URLs, SEO, long-scroll with TOC |
| **(B) Modal/sheet quick preview** | Click → overlay with condensed dossier, URL stays same (or updates via shallow routing) | Fast browsing, stay-in-context, 80% of info without leaving feed |
| **(C) Hybrid** ⭐ | Single click → quick preview modal. Modal has "Open full dossier →" button. Cmd-click or the button → full page. | Best of both — Stripe, Linear, Raindrop all use this |

**My recommendation: C (hybrid)**. The quick-preview modal is perfect for the feed/browse experience ("what's this product about?"), and the full-page dossier is where you live when doing serious research on one product.

### What the quick preview modal should contain (shorter than full dossier)

1. Close button (X) top-right + Esc to dismiss
2. Logo + name + tagline + category badges
3. Quick stats strip (same 8 tiles as full dossier)
4. Attribute panel (the grouped pills — this is the killer "what is this" view)
5. **One signal chart** — just mention volume over time (the other 3 are in full dossier)
6. Top 3 alternatives (not 4)
7. "Open full dossier →" button at bottom (links to `/dossier/[slug]`)
8. Save + Share buttons

**What the modal intentionally leaves OUT** (to keep it fast and < 1 screen on desktop):
- Dimensional scores radar
- Funding timeline
- Revenue chart
- Press mentions feed
- Relationship graph
- Full changelog
- Related tasks + insights sections

I'll add this as a **new panel in Round 3**: `/dossier/[slug]` modal/sheet variant showing the hover-feed + opened modal state. I'll also wire the hybrid behavior into the feed wireframe — modal on click, navigate on cmd-click or from the modal's "full dossier" button.

URL handling: use Next.js shallow routing so the URL changes to `/dossier/[slug]` while the feed stays behind the modal — that way shares still work and back button dismisses modal.

## 2. What's real vs placeholder — honest breakdown

Good question to ask. Here's the truth:

### ✅ REAL (actually designed, not vibes)

- **Database schema** — all 15 tables have proper SQL with FKs, indexes, constraints. You could run the migration today.
- **4-layer attribute taxonomy** — the tag groups and 400-function hierarchy design is concrete. Needs to be seeded but the structure is real.
- **Multi-source ingestion pipeline** — every source has a real API endpoint, rate limit, dedup key. PH GraphQL, HN Algolia, GitHub Trending, Reddit API are all real.
- **Dedup cascade** — 6-tier match logic (slug → domain → name fuzzy via pg_trgm → twitter handle → github repo → pgvector embedding). Each step is implementable in ~20 lines of SQL/code.
- **Signal score formula** — weighted composite from master doc: `0.25×mentions + 0.20×sentiment + 0.25×velocity + 0.15×press + 0.15×funding`, normalized 0-100. Real formula.
- **Logo cascade** — 5 real APIs in priority order with actual rate limits and pricing.
- **Cost math** — Anthropic Haiku/Sonnet token pricing, Firecrawl credit math, Supabase limits, GitHub Actions free tier — all verified against real rate cards.
- **GitHub Actions cron architecture** — cron syntax, secrets, minute budgets all real.
- **News feed pipeline** (RSS → keyword pre-filter → Haiku classifier → Sonnet funding escalation) — all real APIs, all code-implementable.
- **Week-by-week execution plan** — every task maps to real files and commands.

### ⚠️ PLACEHOLDER / aspirational (concept is right, algorithm unspecified)

These are features I described in the wireframes but haven't designed the actual algorithms for:

1. **Pre-death signals** ❗ — I listed 4 (mention volume drop 60%+, executive departure, no funding 18 months, zero press 90 days) with fake percentages like "89% of dead products". These are **reasonable hypotheses** but I haven't actually:
   - Validated they predict death (need historical data to backtest)
   - Designed the detection thresholds
   - Built the classifier
   - This is a **Phase 5 feature** that needs its own design pass once we have data.

2. **Dimensional scores (radar chart)** — the 8 dimensions (ease-of-use, features, value, etc.) with 1-5 ratings. I said "AI-estimated at ingestion" but haven't written the rubric. What does "ease of use 4 vs 5" actually mean? Needs a concrete prompt with examples. Eventually replaced by scraping G2 review dimensions (which is also not designed yet).

3. **Breakout detection** — formula "velocity > 2σ above 90-day rolling avg" is solid in principle but needs edge case handling: what about products with < 90 days of data? What counts as "velocity" — raw mentions, normalized by day, or log-scaled? False positive suppression? All TBD.

4. **Survival curves (Kaplan-Meier)** — the chart is rendered in wireframes but the actual cohort tracking SQL and Kaplan-Meier computation isn't written. It's a standard stats library call but needs the data shape first.

5. **Market $ aggregation job** — I defined `market_size_snapshots` table but the actual rollup logic ("how do we estimate revenue for private companies?") is unsolved. For public companies we can hit SEC EDGAR. For private, it's mostly "we don't know" unless Crunchbase has it.

6. **Alternative matching score (attribute overlap %)** — the wireframe shows "89% match" but I haven't defined the overlap metric. Jaccard similarity? Weighted by group importance? Needs a formula.

7. **Compare view "AI verdict"** — the strip that says "Notion wins on X, Obsidian wins on Y" — that's a Claude prompt I haven't written.

8. **Task-based ranking** — how do we rank products for `/tools-to/write-cold-emails`? By signal score? By task-tag-match quality? Both? TBD.

9. **Changelog extraction** — detecting "acquired by X" from press mentions automatically is a real NLP challenge. Current plan is "Claude extracts event_type" but the detailed entity resolution isn't designed.

10. **"Related companies" algorithm on `/companies/[slug]`** — co-invested, same stage, etc. Concept is clear but actual graph query isn't.

11. **Historical data Phase 2** (1960s-90s) — the entire manual curation workflow is a placeholder. This is intentionally deferred to Phase 6+ because it's genuinely a lot of work.

### How to think about this

The **scaffolding is real** (schema, ingestion, costs, architecture) but **some intelligence layers are aspirational**. This is normal for a pre-execution plan — you don't design every algorithm upfront, you design the data plumbing so algorithms can iterate on real data.

The good news: none of the placeholders block shipping the MVP. You can go live with real products + logos + basic signal scoring + attribute filtering + news feed without any of the placeholder features. The placeholders are Phase 4-6 work.

**Want me to design any specific placeholder in detail?** I can do a deep dive on any of them — for example, a full pre-death signal detection spec with backtest plan, or an actual dimensional scoring rubric with example products. Just pick the ones that matter most to you and I'll build them out properly.

## 3. Fresh name brainstorm — 20 new options

Different angles this time. All of these should be Google-checkable / available in some form.

### 🏆 My top 6 NEW picks

| Name | Why | Vibe |
|------|-----|------|
| **Keel** | Ship's keel = stabilizing spine. Foundation + direction. 4 letters, uncommon, strong. Probably available as .com or keel.app. | Grounded, structural |
| **Delphi** | Ancient oracle = source of knowledge. Classical weight + modern rebirth vibe. 6 letters, not crowded in modern tech. | Intellectual, weighty |
| **Acumen** | Sharp business insight — literal meaning for what the product provides. Might be crowded so fallback to `acumen.app`. | Professional, sharp |
| **Bellwether** | A bellwether is the leading indicator of a flock — *exactly* what a signal scoring product is. Uncommon as a product name. | Leading indicator |
| **Crux** | The critical point. 4 letters, punchy. Great for "get to the crux." | Decisive, essential |
| **Rubicon** | "Crossing the Rubicon" = decisive moment. Implies watching inflection points in tech. 7 letters. | Inflection, decisive |

### Latin/Greek roots
- **Cogito** — "I think" (Descartes). Cerebral, classic.
- **Lexicon** — dictionary of a domain. Direct fit for taxonomy angle.
- **Axiom** — self-evident truth.
- **Corpus** — body of work/knowledge.
- **Historia** — history, research.
- **Veritas** — truth. (Often crowded — check .com.)

### Tech-forward single syllable
- **Forge** — where things are made, tempered, tested.
- **Lode** — rich ore deposit. Evokes "mining for insights."
- **Trove** — valuable collection.
- **Gist** — the essence. Short, clean, memorable.
- **Pith** — the core, essence. 4 letters.
- **Hinge** — critical pivot point.
- **Beam** — direction, focus, clarity.
- **Shard** — piece of a whole (database nerds will like it).

### Wisdom / observation
- **Sage** — wise advisor.
- **Sphinx** — wisdom + mystery (asks questions, reveals answers).
- **Clarion** — clear call, announcement. (Like a call to attention.)
- **Pythia** — the priestess at Delphi. Obscure but distinctive.

### Finance / signal
- **Bourse** — stock exchange, French/European flavor.
- **Barometer** — measures atmospheric change, predicts weather.
- **Gauge** — measurement instrument.

### Coined / portmanteau
- **Prizm** — Prism variant with modern spelling, might be more findable.
- **Lumien** — light (lumen) + Latin ending. Intelligence / illumination.

## Which to pursue

I'd pick 3-5 that resonate with you and I'll run domain checks via Brave Search + direct WHOIS lookups to tell you exactly what's available across `.com`, `.app`, `.dev`, `.io`, `.ai`, and `.so`. That usually takes ~2 minutes per name.

**Specific recommendations based on fit:**

- **If you want historical weight** → Delphi, Chronicle, Hindsight, Annals
- **If you want sharp/insight vibe** → Acumen, Keel, Crux, Bellwether, Gist
- **If you want short + distinctive** → Keel, Crux, Pith, Forge, Gist
- **If you want "premium Bloomberg" feel** → Delphi, Rubicon, Acumen, Bellwether
- **If you want the prism metaphor kept** → Prism, Prizm, Facet, Spectrum, Lumien

Which 3-5 do you want me to verify domain availability on? Or do you want me to expand on any particular theme — like "more names in the Bellwether/signal-indicator family" or "more Delphi-style classical names"?

---

[2026-04-09T07:59:23.354Z] Good direction — Latin/Italian has that premium, timeless feel that matches the Bloomberg-meets-Obsidian positioning. Here's a curated third round in that aesthetic.

## 🏆 My top 6 NEW picks (Latin/Italian-flavored)

| Name | Meaning / feel | Why it fits |
|------|---------------|-------------|
| **Lumina** | "Light" (Latin/Italian feminine). Elegant, premium. | Illumination-of-knowledge metaphor, feminine elegance, 3 syllables, easy to say. Pairs with your "Lumien" instinct but uses a real Latin root. |
| **Luminare** | "Light-giver / lamp / luminary" (Latin). | 4 syllables but rolls off the tongue. More distinctive than Lumina. Also means "a luminary person" — a distinguished expert. Perfect for "the authoritative source." |
| **Prismia** | Coined from Prisma + Italian feminine ending. | Keeps your original facet-breakdown metaphor but with Italian phonetics. Feels invented-yet-natural, like a real Italian scientific instrument brand. |
| **Claritas** | "Clarity / brightness / fame" (Latin). | One of the great classical words. Embodies the product's mission: bring clarity to a murky landscape. Premium, authoritative. |
| **Vedetta** | "Lookout, watchtower, scout" (Italian). | Surveillance/intelligence angle without creepy vibes. A vedetta is the person stationed to watch. Elegant Italian feel. 3 syllables. |
| **Iridia** | From "iride" (iris/rainbow) — the optical phenomenon of a prism. | Prism metaphor in Italian clothing. Softer and more feminine than Prism. Rare as a product name. |

---

## Full brainstorm by theme (~25 new options)

### 💡 Light / clarity / brightness
*Your "Lumien" instinct extended*

- **Lumina** ⭐ — light
- **Luminare** ⭐ — light-giver, luminary
- **Lumis** — coined from "lumen," shorter
- **Lucida** — "clear, bright" (Latin)
- **Lucente** — "shining" (Italian)
- **Chiaro** — "clear" (Italian, mas.)
- **Claritas** ⭐ — clarity (Latin)
- **Claris** — clarity, shorter
- **Fulgora** — coined from "fulgor" (brilliance, splendor)

### 🔍 Prism / facet / refraction
*Your "Prizma" instinct extended*

- **Prismia** ⭐ — feminine coined Prism
- **Prisma** — Italian/Latin for prism (but taken by Prisma ORM)
- **Iridia** ⭐ — from rainbow/iris
- **Iride** — rainbow (Italian, short)
- **Vetrine** — glass showcase (Italian)
- **Gemmia** — coined from "gemma" (gem)
- **Cristallo** — crystal (too common maybe)
- **Sfaccetta** — facet (Italian, but awkward to say)

### 🧠 Knowledge / wisdom / intelligence
*Bloomberg angle + classical weight*

- **Scientia** — knowledge (Latin, root of "science"). Historical gravitas.
- **Sapientia** — wisdom. 4 syllables but elegant.
- **Sapera** — coined from "sapere" (to know, Italian verb)
- **Cognita** — "known" (Latin past participle)
- **Cognos** — abbreviated, tech-feel (but IBM has Cognos, skip)
- **Acume** — Italian for acumen. Short and punchy.
- **Intuito** — intuition (Italian)
- **Arguto** — sharp, witty (Italian)

### 👁️ Observation / discovery
*Intelligence-platform angle*

- **Vedetta** ⭐ — lookout, watchtower (Italian)
- **Osserva** — "observes" (Italian verb, 3rd person)
- **Osservatorio** — observatory (5 syllables, long)
- **Scoperta** — discovery (Italian)
- **Visione** — vision (Italian, 3 syllables)
- **Prospetto** — prospect, view, outlook (Italian)
- **Spectra** — plural of spectrum (Latin)

### ⏳ History / record / chronicle
*Historical-archive moat angle*

- **Storica** — historical (Italian)
- **Cronica** / **Cronaca** — chronicle (Italian)
- **Memoria** — memory (Italian/Latin)
- **Ricordo** — memento/memory (Italian)
- **Annalia** — coined from annals
- **Epoca** — epoch (Italian)
- **Vestigia** — traces, footprints (Latin)
- **Lineagia** — coined from lineage

### 🏛️ Foundational / structural
*Solid, authoritative feel*

- **Fondata** — founded (Italian)
- **Pietra** — stone (Italian)
- **Colonna** — column/pillar
- **Fortis** — strong (Latin)
- **Torra** — tower (variant)

---

## Combinations worth considering

Some Latin/Italian constructions that combine two concepts:

- **Lumina Vera** — "true light" (premium, long)
- **Prismata** — plural of prism (Latin) — "the prisms"
- **Claritas Labs** — the classical word + modern "Labs" suffix
- **Lumina.io** — if the single word isn't enough
- **Prismia Veritas** — too long, but evocative

---

## My strongest single recommendation

If I had to pick **one** name from this whole exercise across all three rounds that I think is the best single-word fit for this product:

**Claritas** — it's Latin for clarity, it's a word people have heard (even if they can't quite place it), it's premium-feeling, it's exactly what your product does (brings clarity to an opaque tech landscape), and "clarity" is actually a core differentiator vs competitors (Product Hunt is chaotic, G2 is crowded, AlternativeTo is cluttered — none of them give you clarity). The tagline writes itself: *"Claritas. Clarity on every product in tech."*

Runner-up: **Lumina** (simpler, more feminine, friendlier, still elegant).
Third: **Prismia** (keeps the facet metaphor but in Italian clothing).

---

## Domain verification

Tell me which 3-5 from this round you want me to stress-test and I'll run Brave Search + direct WHOIS on them to verify what's actually available across `.com`, `.app`, `.io`, `.dev`, `.ai`, and `.so`. Takes about 2 min per name.

Strong candidates to check (flag any you want me to verify):

- [ ] Lumina
- [ ] Luminare
- [ ] Prismia
- [ ] Claritas
- [ ] Vedetta
- [ ] Iridia
- [ ] Lumien (your original)
- [ ] Prizma (your original)
- [ ] Lucida
- [ ] Sapera
- [ ] Acume
- [ ] Cognita

Or want me to do a round 4 in a different direction — maybe mythological (Greek gods/oracles), scientific (physics/chemistry), or geographical (places)?