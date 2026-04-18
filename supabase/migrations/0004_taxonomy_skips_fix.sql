-- ═══════════════════════════════════════════════════════════════════
-- 0004_taxonomy_skips_fix.sql
-- Date: 2026-04-18
-- Purpose: Add missing taxonomy slugs to reduce backfill SKIPs
--
-- Root causes addressed:
--   A. Missing top-level catch-all categories (other, services, travel)
--      Claude generates these for products that don't fit the 15 existing categories
--   B. Singular/plural mismatches (marketplace vs marketplaces, reading-app vs reading-apps)
--   C. Missing hardware-other depth-1 subcategory (17 hits in first 12 months)
-- ═══════════════════════════════════════════════════════════════════

-- ── A. New depth-0 catch-all categories ────────────────────────────────────
INSERT INTO functions (slug, name, display_name, depth, parent_id) VALUES
  ('other',    'other',    'Other',    0, NULL),
  ('services', 'services', 'Services', 0, NULL),
  ('travel',   'travel',   'Travel',   0, NULL)
ON CONFLICT (slug) DO NOTHING;

-- ── A. Depth-1 subcategories for new categories ─────────────────────────────
INSERT INTO functions (slug, name, display_name, depth, parent_id)
SELECT v.slug, v.slug, v.display_name, 1, p.id
FROM (VALUES
  ('general-services', 'General Services', 'services'),
  ('travel-tools',     'Travel Tools',     'travel'),
  ('other-tools',      'Other Tools',      'other')
) AS v(slug, display_name, parent_slug)
JOIN functions p ON p.slug = v.parent_slug AND p.depth = 0
ON CONFLICT (slug) DO NOTHING;

-- ── A. Depth-2 catch-all leaves ─────────────────────────────────────────────
INSERT INTO functions (slug, name, display_name, depth, parent_id)
SELECT v.slug, v.slug, v.display_name, 2, p.id
FROM (VALUES
  ('general-services-other', 'General Services (Other)', 'general-services'),
  ('travel-tools-other',     'Travel Tools (Other)',     'travel-tools'),
  ('other-tools-other',      'Other Tools (Other)',      'other-tools')
) AS v(slug, display_name, parent_slug)
JOIN functions p ON p.slug = v.parent_slug AND p.depth = 1
ON CONFLICT (slug) DO NOTHING;

-- ── B. Singular aliases for plural slugs ────────────────────────────────────
-- Claude occasionally generates singular forms; these mirror the parent so
-- validateAndFilter accepts both forms.

INSERT INTO functions (slug, name, display_name, depth, parent_id)
SELECT 'marketplace', 'marketplace', 'Marketplace', depth, parent_id
FROM functions WHERE slug = 'marketplaces'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO functions (slug, name, display_name, depth, parent_id)
SELECT 'reading-app', 'reading-app', 'Reading App', depth, parent_id
FROM functions WHERE slug = 'reading-apps'
ON CONFLICT (slug) DO NOTHING;

-- ── C. hardware-other subcategory (depth 1) + leaf (depth 2) ────────────────
INSERT INTO functions (slug, name, display_name, depth, parent_id)
SELECT 'hardware-other', 'hardware-other', 'Hardware (Other)', 1, id
FROM functions WHERE slug = 'hardware' AND depth = 0
ON CONFLICT (slug) DO NOTHING;

INSERT INTO functions (slug, name, display_name, depth, parent_id)
SELECT 'hardware-other-tools', 'hardware-other-tools', 'Hardware Other Tools', 2, id
FROM functions WHERE slug = 'hardware-other' AND depth = 1
ON CONFLICT (slug) DO NOTHING;

-- ── D. marketing-other leaf (depth 2 under marketing-other sub) ─────────────
-- "unknown sub_category: marketing-other" appears in logs — add if missing
INSERT INTO functions (slug, name, display_name, depth, parent_id)
SELECT 'marketing-other', 'marketing-other', 'Marketing (Other)', 1, id
FROM functions WHERE slug = 'marketing' AND depth = 0
ON CONFLICT (slug) DO NOTHING;

INSERT INTO functions (slug, name, display_name, depth, parent_id)
SELECT 'marketing-other-tools', 'marketing-other-tools', 'Marketing Other Tools', 2, id
FROM functions WHERE slug = 'marketing-other' AND depth = 1
ON CONFLICT (slug) DO NOTHING;
