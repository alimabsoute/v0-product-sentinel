# Prism (v0-product-sentinel)

## Purpose
"Bloomberg meets Product Hunt" — tech product intelligence platform with signal scoring and press tracking.

## Stack
- **Frontend**: Next.js (App Router), TypeScript, React
- **Backend**: Supabase (PostgreSQL), Auth, Realtime
- **Database**: Project ID `fnlmqkfmjfzzkkqcmahe` — 7,836 products, 6,275 signal scores, 18 categories, 65 press mentions
- **CI/CD**: GitHub Actions (6 crons live)
- **Repo**: Private — alimabsoute/v0-product-sentinel

## Dev Commands

```bash
# Start dev server
npm run dev                              # localhost:3000

# Supabase local
npx supabase start                       # Start local Supabase
npx supabase stop                        # Stop local Supabase
npx supabase status                      # Check status
npx supabase db reset                    # Reset database to migrations

# Generate types from schema
npx supabase gen types typescript --local > types/database.types.ts

# Run tests (if configured)
npm run test
```

## Deploy
```bash
cd v0-product-sentinel && vercel --prod --yes    # Deploy to Vercel
```
Live URL: (TBD — not yet public)

## Key Folders
| Folder | Purpose |
|--------|---------|
| `app/` | Next.js pages and layouts (App Router) |
| `lib/` | Supabase client, utilities, search functions |
| `types/` | TypeScript interfaces (generated from Supabase schema) |
| `components/` | React components |
| `public/` | Static assets |
| `.github/workflows/` | 6 GitHub Actions crons (data ingestion, backfill, signal refresh) |

## Current Status
**Days 1–7 complete.** 7,836 products backfilled into Supabase, 6,275 signal scores computed, 18 categories indexed, 65 press mentions tracked. Migration 0005 (search_vector) applied. `searchProducts()` function written but **NOT YET WIRED to UI**. 10-sprint implementation plan finalized.

**Current phase**: Sprint 1 — Product browser pagination (blocker #1).

## Known Risks
- `searchProducts()` function exists but is disconnected from the product browser UI — no full-text search yet
- Pagination not implemented in product browser — currently trying to load all 7,836 products at once
- Signal scoring may have stale data if cron jobs fail silently — need monitoring dashboard
- Supabase RLS policies not yet enforced — security gap before launch

## Next 3 Tasks
1. Wire `searchProducts()` function to product browser component — enable full-text search + filtering
2. Implement pagination in product browser (Sprint 1 blocker) — reduce initial load, improve UX
3. Build death model — product lifecycle/maturity scoring (signals: funding, press velocity, founder exits)
