# NEXT — Prism resume point

> **Last updated**: 2026-04-09, after recovering session `62a5c57e` (which froze mid-brainstorm) and session `61fa2303` (continuation).
> **Read this file first** when returning to the project.

## Where I left off (the exact moment the terminal froze)

I was in a naming brainstorm with Claude. The last message I sent was:
> *"Do another round, then give me your top choices (and check for availability)"*

Claude was about to return a new round of Latin/Italian-sounding names (I liked **Lumien** and **Prizma**). The terminal froze before the response came back. In the continuation session I decided to **park the naming decision** and keep the codename **`prism`** so I could stop losing momentum on naming and move forward.

**Translation**: name is still TBD. Don't rabbit-hole on it again. Keep `prism`. Move on.

## The real blocker (aside from naming)

**Round 3 wireframes.** Rounds 1+2 are done (11 hi-def panels in `docs/wireframes/prism-ui-map.excalidraw`). Round 3 still owes:

1. **Modal quick-preview panel** — when a user clicks a product card from the feed, does a modal open (like the current v0 skeleton), or does it route to `/dossier/[slug]`? Spec the modal layout.
2. **Placeholder audit** — go through every Round 1+2 panel and label each element as *real data* vs *placeholder/hardcoded*. Specifically: is "pre-death signal" actually wired to the `product_signal_scores.is_breakout` field, or is it just visual filler? This is the question I asked Claude right before the freeze — never got a full answer.
3. **Tablet breakpoint** — responsive clone of all 11 panels at tablet widths.
4. **Mobile breakpoint** — responsive clone of all 11 panels at mobile widths.
5. **User flow diagrams** — at least: signup → first dossier, browse → compare → save, search → filter → dossier, funding alert → dossier.
6. **Component library panel** — reusable cards, buttons, badges, charts.

All of the above go into the same Excalidraw file via edits to `docs/wireframes/prism-wireframe-build.mjs` (re-run with `node prism-wireframe-build.mjs`).

## Then — after Round 3 wireframes are locked

The `STRATEGIC-PLAN.md` Day 1 checklist kicks in. Summary order:

1. **Day 1: Foundation** — Supabase project, deps install, `lib/branding.ts` single-source-of-truth file
2. **Day 2: Schema migration** — push the 11-table schema from `MASTER-SPEC.md` section 4 into Supabase
3. **Day 2 cont.: Vocabulary seed** — `functions.sql` + `tags.sql` (AI draft + 1hr human review per locked decision)
4. **Day 4: Logo pipeline + Product Hunt ingestion** — 50 real products, logo cascade PH → Brandfetch → Clearbit → Firecrawl → favicon
5. **Day 5: UI cut-over** — delete `lib/mock-data.ts` (1,197 lines), query Supabase, deploy to preview
6. **Day 6: GitHub Actions crons** — 4 parallel sources (PH, HN, GitHub Trending, Reddit)
7. **Day 7: News feed** — RSS → Haiku classifier → Sonnet on funding articles (target $7/mo news cost vs $125 naive)

Full daily breakdown is in `STRATEGIC-PLAN.md` — that's the 1,708-line plan from this morning.

## Blockers I need to resolve *before* Day 1 can start

- [ ] **MCP auth** — Supabase, Vercel, Firecrawl (one-time browser consent)
- [ ] **API keys for GitHub Actions secrets**: `ANTHROPIC_API_KEY`, `PRODUCT_HUNT_DEVELOPER_TOKEN`, `FIRECRAWL_API_KEY`
- [ ] **Rename `brand` string in `site-header.tsx` + `app/layout.tsx`** (currently hardcoded to "Sentinel")
- [ ] **Fix the latent bug** at `app/categories/[slug]/page.tsx:204` — references `b.buzzScore.total` but type is `b.buzz.score`. Will crash at runtime.

## Deferred (don't pull the thread)

- Final product name — parked, keep `prism` codename
- Twitter API ($100/mo) — defer until after signal scoring proven
- Crunchbase API ($49/mo) — scrape public pages with Firecrawl instead
- SimilarWeb API ($250+/mo) — defer indefinitely
- Phase 2 historical data (1960s-2000 curation) — Phase 1 first, historical depth later
- `/gsd:new-project` — already have a better plan (`STRATEGIC-PLAN.md`) + spec (`MASTER-SPEC.md`) + overview (`PRISM-OVERVIEW.md`). Formalizing now would be busywork. Revisit when executing if GSD's atomic-commit structure adds value.

## File map — where everything lives now

```
v0-product-sentinel/
├── docs/
│   ├── NEXT.md                 ← you are here
│   ├── MASTER-SPEC.md          ← 15-section original spec (recovered, 30 KB)
│   ├── STRATEGIC-PLAN.md       ← 1,708-line full execution plan (114 KB)
│   ├── PRISM-OVERVIEW.md       ← richer synthesized overview (copied from Obsidian)
│   ├── wireframes/
│   │   ├── prism-ui-map.excalidraw            ← Rounds 1+2, 11 panels
│   │   ├── prism-ui-map.backup-pre-round3.excalidraw
│   │   └── prism-wireframe-build.mjs          ← 2,242-line generator, edit + rerun
│   └── recovery/               ← full chat transcripts from the frozen sessions
│       ├── 62a5c57e-USER.md    (33 KB — my messages, main session)
│       ├── 62a5c57e-ASSISTANT.md (81 KB — Claude's responses)
│       ├── 61fa2303-USER.md    (21 KB — continuation session, mine)
│       └── 61fa2303-ASSISTANT.md (12 KB — continuation, Claude's)
└── [existing Next.js code]     ← 14 commits, v0.dev scaffold + iterations
```

The Obsidian doc `Claude Code Projects/Prism.md` stays as the narrative/changelog layer. Keep both in sync — `PRISM-OVERVIEW.md` is a snapshot, Obsidian is the living copy.
