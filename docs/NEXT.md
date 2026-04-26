# NEXT — Launch Sentinel resume point

> **Last updated**: 2026-04-26 — Rebrand session complete
> **Read this file first** when returning to the project.

---

## Status: ALL 10 SPRINTS COMPLETE | Rebrand to Launch Sentinel in progress

### DB State (2026-04-26)
- **23,420 products** in Supabase
- **337,137 signal score rows**
- **73+ press mentions** — hourly cron accumulating
- **0 product_tags** — CRITICAL GAP (blocks /functions, faceted sidebar, attribute charts)
- **0 relationships** — enrichment script ready, not yet run
- **10 GitHub Actions crons live**

---

## What Was Just Done (2026-04-26 session)

1. **Rebrand**: All docs updated from "Prism"/"v0-product-sentinel" to "Launch Sentinel"
2. **Domain**: launchsentinel.com purchased and being connected to Vercel
3. **Death model shipped**: `mark-dead-products.ts` script + weekly cron (`mark-dead-products.yml`, Sun 03:00 UTC) — flags products with stalled signals, no press velocity, and founder exits
4. **Docs rewritten**: CLAUDE.md, README.md, NEXT.md, ARCHITECTURE.md all updated to reflect current state

---

## Current Branch

`rebrand/launchsentinel` — being merged to `main`

---

## Immediate Next: Sprint 1 Cleanup + Data Gaps

### Priority 1 — product_tags (CRITICAL)
The `product_tags` table has 0 rows. This blocks:
- `/functions` page (renders empty)
- Faceted sidebar filtering
- Attribute cohort charts on /markets
- Tag-based search

**Action**: Run `npm run enrich` against full 23,420 product dataset. Monitor costs — ~$X via Claude Haiku.

### Priority 2 — Check mark-dead-products results
The weekly cron just went live. Check Actions tab for first run results:
- Go to: https://github.com/alimabsoute/v0-product-sentinel/actions
- Look for `mark-dead-products` workflow
- Verify dry-run output before enabling live mode

### Priority 3 — relationships table
`enrich-relationships.ts` is written and ready. Run when budget allows:
```bash
# Estimated ~$4 for 23K products via Claude Haiku
npm run enrich:relationships
```

### Priority 4 — RLS enforcement
Supabase RLS policies are NOT enforced. Cannot launch launchsentinel.com publicly without:
- Enabling RLS on all tables
- Writing policies for: public read, authenticated write, user-scoped data
- Testing with anon key (should only see public rows)

---

## Domain / Deployment

- **launchsentinel.com** — purchased, DNS being connected to Vercel
- **Current live URL**: https://v0-product-sentinel.vercel.app
- **Vercel project**: v0-product-sentinel (rename to launch-sentinel in Vercel dashboard)
- **GitHub repo**: alimabsoute/v0-product-sentinel (rename to launch-sentinel on GitHub)

**Deploy command**:
```bash
vercel --prod --yes
```

---

## Critical Auth Notes

- `lib/auth.ts` = SERVER ONLY (has `server-only` marker, imports `next/headers`)
- `lib/auth-client.ts` = BROWSER ONLY (`createBrowserSupabaseClient`)
- Client components MUST import from `auth-client`, never from `auth`

## press_mentions Schema (Actual Column Names)

- `headline` (not `title`)
- `mention_date` (not `published_at`)
- `publication` (source name)
- `lib/db/news.ts` is correct — do not revert

---

## Supabase

- **Project ID**: `fnlmqkfmjfzzkkqcmahe`
- **Dashboard**: https://supabase.com/dashboard/project/fnlmqkfmjfzzkkqcmahe
