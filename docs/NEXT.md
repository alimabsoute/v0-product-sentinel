# NEXT — Prism resume point

> **Last updated**: 2026-04-10, after an unblocked-work pass that ported Round 3 into the generator, built Round 4, and landed `lib/branding.ts`.
> **Read this file first** when returning to the project.

## What just landed (2026-04-10 session)

Unblocked work completed in a single pass — no API keys or MCP auth touched. All changes live on `feature/toolset-enhancement` (pending commit).

1. **Bug fix** — `app/categories/[slug]/page.tsx:204` referenced `b.buzzScore.total` but `Product.buzz.score` is the real field. Fixed to `b.buzz.score`. No more crash on `/categories/[slug]?sort=buzz`.

2. **`lib/branding.ts` — single source of truth** — codename `prism` is now referenced via `BRAND.name`, `BRAND.initial` (logo monogram), `BRAND.metaTitle`, `BRAND.metaDescription`, `BRAND_COPYRIGHT`, and a `brandTitle(pageTitle)` helper. Final name change is now a single-file edit.

3. **"Sentinel" → branding.ts across 8 code files**:
   - `app/layout.tsx` — metadata title + description
   - `app/insights/page.tsx` + `app/graveyard/page.tsx` — metadata titles via `brandTitle()`
   - `app/insights/[slug]/page.tsx` — article body template
   - `components/site-header.tsx` — logo monogram + wordmark
   - `components/site-footer.tsx` — logo + copyright
   - `app/login/page.tsx` + `app/signup/page.tsx` — logos + testimonial quote
   - `lib/mock-data.ts` + `app/globals.css` — header comments
   - No remaining user-facing "Sentinel" strings (only historical refs in `docs/` recovery transcripts).

4. **Wireframe generator rebuilt to produce all 4 rounds** — `docs/wireframes/prism-wireframe-build.mjs` now produces **Round 1 + 2 + 3 + 4** instead of just 1 + 2. Round 3 is no longer dependent on manual JSON edits.
   - **Round 3** (x=3360, amber): Panels 9-12 — Quick Preview Modal, Placeholder Audit (10 rows mapping every home-feed element to MOCK/REAL/HYBRID status), Tablet 768px breakpoint, Mobile 375px breakpoint with bottom nav.
   - **Round 4** (x=5000, purple): Panel 13 — User Flows (4 flows: signup→first dossier, browse→compare→save, search→filter→dossier, funding alert→company follow). Panel 14 — Component Library palette with product cards, buttons, pills, charts (sparkline/bar/line/radar/donut/heatmap), avatars, dividers, widgets.
   - Big section headers (ROUND 1-4) above each column with colored strips.
   - Generator output path now lives in `docs/wireframes/prism-all-rounds.excalidraw` (was `Desktop/Excalidraw Files/`). Re-running is safe — no more zigzag, no more lost Round 3.
   - **Output**: 9,581 elements, 5.7 MB. Valid Excalidraw v2 JSON. X bounds 80 → 6,600; Y bounds -60 → 17,500.
   - **Backup**: previous canonical saved to `docs/wireframes/prism-all-rounds.backup-pre-generator-port.excalidraw` (4,183 elements, the manually-edited Round 3 version).

## Where we actually left off (pre-execution)

Planning and wireframing are complete. Foundation execution (Day 1) is still blocked on credentials.

### Still blocked on credentials
- [ ] **MCP auth** — Supabase, Vercel, Firecrawl (one-time browser consent)
- [ ] **API keys for GitHub Actions secrets**: `ANTHROPIC_API_KEY`, `PRODUCT_HUNT_DEVELOPER_TOKEN`, `FIRECRAWL_API_KEY`

Once those are resolved, `STRATEGIC-PLAN.md` Day 1 kicks in:

1. **Day 1: Foundation** — Supabase project, deps install, ~~`lib/branding.ts`~~ ✅ already done
2. **Day 2: Schema migration** — push 11-table schema from `MASTER-SPEC.md` §4 into Supabase
3. **Day 2 cont.: Vocabulary seed** — `functions.sql` + `tags.sql` (AI draft + 1hr human review)
4. **Day 4: Logo pipeline + Product Hunt ingestion** — 50 real products, logo cascade PH → Brandfetch → Clearbit → Firecrawl → favicon
5. **Day 5: UI cut-over** — delete `lib/mock-data.ts` (1,197 lines), query Supabase, deploy to preview
6. **Day 6: GitHub Actions crons** — 4 parallel sources (PH, HN, GitHub Trending, Reddit)
7. **Day 7: News feed** — RSS → Haiku classifier → Sonnet on funding articles ($7/mo target)

### Unchecked from the pre-execution checklist
- [x] ~~Rename `brand` string in `site-header.tsx` + `app/layout.tsx`~~ ✅ now reads from `lib/branding.ts`
- [x] ~~Fix the latent bug at `app/categories/[slug]/page.tsx:204`~~ ✅ fixed

## Deferred (don't pull the thread)

- Final product name — parked, keep `prism` codename. `BRAND.isCodename = true` flag in `lib/branding.ts` marks this clearly.
- Twitter API ($100/mo) — defer until after signal scoring proven
- Crunchbase API ($49/mo) — scrape public pages with Firecrawl instead
- SimilarWeb API ($250+/mo) — defer indefinitely
- Phase 2 historical data (1960s-2000 curation) — Phase 1 first, historical depth later

## File map

```
v0-product-sentinel/
├── lib/
│   ├── branding.ts             ← NEW. single source of truth for brand strings
│   └── mock-data.ts            ← still 1,197 lines, deletion scheduled for Day 5
├── docs/
│   ├── NEXT.md                 ← you are here
│   ├── MASTER-SPEC.md          ← 15-section original spec
│   ├── STRATEGIC-PLAN.md       ← 1,708-line full execution plan
│   ├── PRISM-OVERVIEW.md       ← richer synthesized overview
│   ├── wireframes/
│   │   ├── prism-all-rounds.excalidraw           ← REGENERATED from source, 9,581 elements, Rounds 1-4
│   │   ├── prism-all-rounds.backup-pre-generator-port.excalidraw  ← previous canonical, 4,183 elements
│   │   ├── prism-ui-map.excalidraw               ← original messy layout (pre-recovery)
│   │   ├── prism-ui-map.backup-pre-round3.excalidraw
│   │   └── prism-wireframe-build.mjs             ← now 2,600+ lines, produces all 4 rounds
│   └── recovery/               ← full chat transcripts from the frozen sessions
└── [existing Next.js code]     ← 14 commits + this pass, v0.dev scaffold + branding refactor
```

The Obsidian doc `Claude Code Projects/Prism.md` stays as the narrative/changelog layer.
