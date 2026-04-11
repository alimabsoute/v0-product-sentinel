-- ═══════════════════════════════════════════════════════════════════
-- 0003_tags_slug_unique_constraint — Day 3.5 fix
-- Date: 2026-04-10
--
-- The partial unique index from 0002
--   CREATE UNIQUE INDEX idx_tags_slug_unique ON tags(slug) WHERE slug IS NOT NULL;
-- cannot back ON CONFLICT (slug). Postgres requires a full unique
-- constraint for ON CONFLICT to target. Every tag row carries a slug
-- anyway, so replace with a proper UNIQUE constraint.
-- ═══════════════════════════════════════════════════════════════════

DROP INDEX IF EXISTS idx_tags_slug_unique;
ALTER TABLE tags ADD CONSTRAINT tags_slug_unique UNIQUE (slug);
