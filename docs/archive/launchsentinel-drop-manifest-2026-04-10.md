# LaunchSentinel drop manifest — 2026-04-10

## Context

The Supabase project `fnlmqkfmjfzzkkqcmahe` (displayed as **LaunchSentinel** in the Supabase dashboard) was originally created 2025-08-19 for an earlier product-hunt-app attempt located at `C:\Users\alima\product-hunt-app\` (separate codebase, different stack).

On **2026-04-10**, the project was repurposed for **Prism** (Bloomberg meets Product Hunt). Ali's Obsidian notes at `Claude Code Projects/Prism.md` document that the old project was abandoned. To avoid paying $10/month for a second Supabase project, the existing LaunchSentinel project was reused after clearing its contents.

## What was dropped

All 9 tables in the `public` schema were dropped with `CASCADE`:

| Table | Rows | Notes |
|---|---|---|
| `public.products` | 27 | old seed + github_trending scraper output |
| `public.profiles` | 0 | empty |
| `public.votes` | 0 | empty |
| `public.comments` | 0 | empty |
| `public.comment_likes` | 0 | empty |
| `public.favorites` | 0 | empty |
| `public.collections` | 0 | empty |
| `public.collection_products` | 0 | empty |
| `public.scraping_logs` | 0 | empty, RLS disabled |

### Inventory of the 27 products dropped

Seed entries (19) — all with placeholder `images.unsplash.com` logo URLs, `source: 'manual'`:

1. Linear — issue tracker
2. Notion (×2 — duplicate)
3. Cursor AI — AI code editor
4. Discord — community voice/video
5. Todoist — task manager
6. Duolingo — language learning
7. Obsidian — note knowledge base
8. Spotify — music streaming
9. Vercel — frontend hosting
10. Figma (×2 — duplicate)
11. Midjourney — AI art generator
12. Claude AI (×2 — duplicate) — Anthropic assistant
13. Supabase — Firebase alternative
14. RunwayML — AI video editor
15. Shopify — ecommerce platform
16. Canva — design platform

`github_trending` scraper entries (8) — with `opengraph.githubassets.com` screenshot URLs, `source: 'github_trending'`, launched 2025-08-20:

1. Agents.md — openai/agents.md
2. Keyboard Signature — cnrad/keyboard-signature
3. Doxx — bgreenwell/doxx (CLI docx viewer)
4. Warzone Cheat — BO6-Warzone-cheat/warzone-cheat (⚠️ low-quality/sketchy entry)
5. ChatMock — RayBytes/ChatMock (OpenAI via ChatGPT subscription)
6. Overtype — panphora/overtype (markdown textarea editor)
7. Open Fiesta — NiladriHazra/Open-Fiesta (open-source AI startup)
8. Synapse Trading Bot — anthugeist/synapse-trading-bot (crypto bot)

### Auth / Storage schemas

**Auth** (`auth.*`) was **left alone** — 1 user row, 1 session, 11 audit log entries, 1 identity. These represent the test account for the old product-hunt-app. Clearing them is unnecessary and risks logging out an unrelated browser session.

**Storage** (`storage.*`) was **left alone** — buckets and objects were empty (0 rows each), only Supabase's internal migration tracking rows remained (49 rows, normal state).

## Recovery

Three recovery paths exist if any of this data is ever needed back:

1. **Supabase Point-in-Time Recovery (PITR)** — Ali's org is on the Pro plan, which includes 7-day PITR on all projects. Log in to Supabase dashboard → Project → Database → Backups → Restore to a point before 2026-04-10 UTC.
2. **This manifest file** — lists every dropped row's name + source, enough to recreate if needed (none of it was valuable data anyway).
3. **Conversation transcript** — the full `row_to_json` dump of all 27 rows is preserved in the Claude Code session transcript (2026-04-10).

## Extensions changed

After the drop, three extensions were added for Prism:

- `pg_trgm` — fuzzy string similarity (dedup by product name)
- `vector` (pgvector) — embedding similarity (dedup by semantic content)
- `pg_cron` — nightly signal score job scheduler

These are in addition to the existing standard extensions (`uuid-ossp`, `pgcrypto`, `pg_graphql`, `pg_stat_statements`, `supabase_vault`, `plpgsql`).

## Schema applied

Migration `0001_prism_foundation` from `docs/MASTER-SPEC.md` §4 was applied immediately after the drop. See `supabase/migrations/0001_prism_foundation.sql` in the repo for the full DDL.

## Supabase project ID

`fnlmqkfmjfzzkkqcmahe` — the project will be renamed from `LaunchSentinel` to `prism-dev` in the Supabase UI (manual step, MCP has no `update_project` tool).
