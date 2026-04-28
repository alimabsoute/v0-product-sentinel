# Launch Sentinel — Backlog

Items are roughly prioritized. Top section = do soon, bottom = someday.

---

## Must Do Before Public Promotion

- [ ] **RLS (Row Level Security)** — Supabase DB is open to anyone with the anon key. Add policies to at minimum: `products`, `press_mentions`, `product_signal_scores`. Write ops (upvotes, comments, watchlist) need user-scoped policies.

- [ ] **Run full `enrich:relationships`** — `MAX_PRODUCTS=2000 npm run enrich:relationships` was interrupted. Run to get meaningful competitor/alternatives coverage. (~$16 total for 2000 products via Haiku)

- [ ] **Monitor `product_tags` enrichment** — Full run was started 2026-04-27. Check coverage in Supabase (`select count(*) from product_tags`). If low, re-run `npm run enrich:attributes`.

---

## UX / Product

- [x] **PH badge removed** — The "PH" button that linked back to Product Hunt has been stripped from all card variants in `components/product-card.tsx`. Only the product's own website link (`url`) is shown.

- [ ] **`website_url` backfill** — Products ingested early may have `website_url = null`, meaning the card link goes nowhere. Query scope: `select count(*) from products where status = 'active' and (website_url is null or website_url = '')`. If significant, write a Haiku backfill script to extract real URLs from `source_url`.

- [ ] **GA4 tracking** — Add measurement ID to `app/layout.tsx` via `@vercel/analytics` or Google's script tag. Needed to understand what pages people actually use.

- [ ] **Homepage UI polish** — Noted 2026-04-26: bounding boxes and card design could be tighter. No spec yet — needs screenshots or direction.


---

## Data & Enrichment

- [ ] **`website_url` backfill script** — For the initial PH backfill cohort that skipped Haiku extraction. Query `products where website_url is null and source_url ilike '%producthunt%'`, run Haiku on each to extract real URL.

- [ ] **Expand `enrich:relationships`** — After the 2000-product run, consider running to full 23K (~$184 total). Unlocks "Alternatives & Competitors" on every product page.

- [ ] **Increase signal score coverage** — Only ~14K of 23,420 products have signal scores. Run `npm run signals` to compute for the rest.

- [ ] **Fix middleware deprecation** — Build warns: `The "middleware" file convention is deprecated. Please use "proxy" instead.` Low priority, cosmetic.

---

## Infrastructure

- [ ] **Upgrade to Supabase Pro** — Free tier is 500MB. DB is growing ~1,500 rows/day from signal scores alone. Will hit limit in ~2-3 months. Pro = $25/month, 8GB.

- [ ] **Set up Vercel Analytics** — Already have `@vercel/analytics` in deps. Just needs the `<Analytics />` component in `app/layout.tsx`.

- [ ] **`enrich-attributes.yml` cron** — Runs weekly Sunday 02:00 UTC. Confirm it's picking up new products correctly after the subquery bug fix.

---

## Mobile Responsiveness

- [ ] **Full responsive pass** — Design and features are being settled first. Once the layout, sections, and data are stable, do a full mobile-first audit: 320px–768px breakpoints, 44px touch targets, `clamp()` typography, compressed card layouts, ticker strip on mobile, graveyard dark section, force graph (consider hiding on < 768px or swapping for a list). Not blocking current feature work — do this as a dedicated pass once the desktop design is locked.

---

## Someday / Nice to Have

- [ ] **Replace "PH" with proper Product Hunt orange cat favicon** in the source badge
- [ ] **`/functions` page** — Currently blocked by empty `product_tags`. Will auto-unlock once enrichment coverage grows.
- [ ] **Related products on detail page** — Currently falls back to same-category; will improve once `relationships` table is populated.
- [ ] **Supabase generated types** — Running `npx supabase gen types --project-id fnlmqkfmjfzzkkqcmahe` would eliminate all the `as unknown as T[]` casts. Needs Supabase CLI login.
- [ ] **Email digest / newsletter** — Press mentions cron is building a quality feed. Could power a weekly digest.
