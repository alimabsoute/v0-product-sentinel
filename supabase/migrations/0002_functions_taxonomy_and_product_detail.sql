-- ═══════════════════════════════════════════════════════════════════
-- 0002_functions_taxonomy_and_product_detail — Day 3.5 prep
-- Date: 2026-04-10
-- Sources:
--   docs/STRATEGIC-PLAN.md   § Attribute / Taxonomy System
--   docs/wireframes          Dossier + Products browse + Function leaf
--
-- Adds the hierarchical functions taxonomy + the product detail columns
-- that every wireframe dossier page depends on, plus URL-safe slugs on
-- tags for /attributes/[grp]/[val] routes.
--
-- Safe to run while tables are empty — products.primary_function is
-- dropped and replaced with a FK column.
-- ═══════════════════════════════════════════════════════════════════

-- ─── functions (hierarchical taxonomy tree) ────────────────────────
CREATE TABLE functions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,       -- kebab-case, URL-safe: /functions/[slug]
  name         TEXT NOT NULL,              -- canonical machine name, same as slug usually
  display_name TEXT NOT NULL,              -- Title Case for UI
  parent_id    UUID REFERENCES functions(id) ON DELETE RESTRICT,
  depth        SMALLINT NOT NULL,          -- 0=category, 1=sub_category, 2=function (leaf)
  description  TEXT,
  product_count INT DEFAULT 0,             -- denormalized for fast leaf-page lookup
  created_at   TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT functions_depth_valid CHECK (depth BETWEEN 0 AND 2),
  CONSTRAINT functions_root_has_no_parent CHECK (
    (depth = 0 AND parent_id IS NULL) OR
    (depth > 0 AND parent_id IS NOT NULL)
  )
);

CREATE INDEX idx_functions_parent ON functions(parent_id);
CREATE INDEX idx_functions_depth  ON functions(depth);
CREATE INDEX idx_functions_slug   ON functions(slug);

-- ─── products: replace TEXT primary_function with FK + add dossier fields ──
ALTER TABLE products DROP COLUMN primary_function;

ALTER TABLE products
  ADD COLUMN primary_function_id UUID REFERENCES functions(id) ON DELETE RESTRICT,
  ADD COLUMN sub_category        TEXT,             -- denormalized for fast facet filter
  ADD COLUMN website_url         TEXT,             -- dossier 🔗 website
  ADD COLUMN twitter_handle      TEXT,             -- dossier 🐦 @handle (sans @)
  ADD COLUMN github_repo         TEXT,             -- dossier 🐙 org/repo
  ADD COLUMN docs_url            TEXT,             -- dossier 📖 docs
  ADD COLUMN description         TEXT,             -- long-form prose on dossier
  ADD COLUMN screenshots         TEXT[],           -- dossier screenshot carousel
  ADD COLUMN logo_url            TEXT,             -- dossier logo header
  ADD COLUMN logo_source         TEXT,             -- 'product_hunt'|'brandfetch'|'clearbit'|'firecrawl'|'google_favicon'|'manual'
  ADD COLUMN logo_confidence     SMALLINT DEFAULT 3;

CREATE INDEX idx_products_primary_function_id ON products(primary_function_id);
CREATE INDEX idx_products_sub_category        ON products(sub_category);

-- ─── tags: URL-safe slug column for /attributes/[grp]/[val] routes ────────
ALTER TABLE tags ADD COLUMN slug TEXT;

-- Populate slug = lower(name) with a unique index (cannot be UNIQUE yet
-- because existing rows have NULL slugs — table is empty so this is a no-op)
CREATE UNIQUE INDEX idx_tags_slug_unique ON tags(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_tags_group ON tags(tag_group);
