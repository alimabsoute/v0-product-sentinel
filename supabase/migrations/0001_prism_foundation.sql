-- ═══════════════════════════════════════════════════════════════════
-- 0001_prism_foundation — Day 1 schema
-- Date: 2026-04-10
-- Source: docs/MASTER-SPEC.md section 4 (Full Database Schema)
--
-- Enables pg_trgm (fuzzy name match), vector (embedding dedup),
-- pg_cron (nightly signal score jobs) and creates the 14 core tables
-- with indexes.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Extensions ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ─── COMPANIES ─────────────────────────────────────────────────────
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  founded_year INT,
  defunct_year INT,
  hq_country TEXT,
  hq_city TEXT,
  founding_story TEXT,
  historical_significance TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRODUCTS ──────────────────────────────────────────────────────
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  -- Lifecycle
  launched_year INT,
  launched_month INT,
  discontinued_year INT,
  discontinued_month INT,
  lifespan_months INT GENERATED ALWAYS AS (
    CASE
      WHEN discontinued_year IS NOT NULL AND launched_year IS NOT NULL
      THEN ((discontinued_year - launched_year) * 12) +
           (COALESCE(discontinued_month, 6) - COALESCE(launched_month, 6))
      ELSE NULL
    END
  ) STORED,

  -- Classification
  primary_function TEXT NOT NULL,
  category TEXT NOT NULL,
  platform TEXT NOT NULL,
  is_open_source BOOLEAN DEFAULT FALSE,

  -- Era-aware
  business_model TEXT,
  distribution TEXT,
  has_api BOOLEAN,
  has_network_effects BOOLEAN,

  -- Status
  status TEXT NOT NULL DEFAULT 'active',
  acquisition_company_id UUID REFERENCES companies(id),

  -- Source
  source TEXT NOT NULL,
  source_url TEXT,
  confidence_score SMALLINT DEFAULT 3,

  -- Traffic / taxonomy
  monthly_visits_est BIGINT,
  monthly_visits_source TEXT,
  monthly_visits_date DATE,
  task_search_tags TEXT[],
  functionality_scores JSONB,

  -- Phase 2 vintage
  press_quotes JSONB,
  historical_context TEXT,
  era TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FUNDING ROUNDS ────────────────────────────────────────────────
CREATE TABLE funding_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  round_type TEXT,
  amount_usd BIGINT,
  year INT,
  month INT,
  investors JSONB,
  valuation_usd BIGINT,
  is_disclosed BOOLEAN DEFAULT TRUE,
  is_estimated BOOLEAN DEFAULT FALSE,
  source TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REVENUE SNAPSHOTS ─────────────────────────────────────────────
CREATE TABLE revenue_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  year INT NOT NULL,
  revenue_usd BIGINT,
  revenue_is_estimated BOOLEAN DEFAULT FALSE,
  arr_usd BIGINT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TAGS ──────────────────────────────────────────────────────────
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  tag_group TEXT
);

CREATE TABLE product_tags (
  product_id UUID REFERENCES products(id),
  tag_id UUID REFERENCES tags(id),
  PRIMARY KEY (product_id, tag_id)
);

-- ─── PRESS MENTIONS ────────────────────────────────────────────────
CREATE TABLE press_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  publication TEXT NOT NULL,
  headline TEXT,
  snippet TEXT,
  url TEXT UNIQUE,
  mention_year INT,
  mention_date DATE,
  sentiment SMALLINT,
  is_vintage BOOLEAN DEFAULT FALSE,
  source TEXT,
  metadata JSONB
);

-- ─── PRODUCT RELATIONSHIPS (graph edges) ───────────────────────────
CREATE TABLE product_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_a_id UUID REFERENCES products(id),
  product_b_id UUID REFERENCES products(id),
  relationship_type TEXT NOT NULL,
  year_started INT,
  year_ended INT,
  notes TEXT,
  CHECK (product_a_id != product_b_id)
);

-- ─── PRODUCT ALTERNATIVES ──────────────────────────────────────────
CREATE TABLE product_alternatives (
  product_id UUID REFERENCES products(id),
  alternative_id UUID REFERENCES products(id),
  relationship TEXT,
  source TEXT,
  PRIMARY KEY (product_id, alternative_id)
);

-- ─── SOCIAL MENTIONS (time-series) ─────────────────────────────────
CREATE TABLE social_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  platform TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  mention_count INT DEFAULT 0,
  sentiment_avg NUMERIC(4,3),
  engagement_sum INT,
  source_url TEXT,
  raw_data JSONB
);

-- ─── SIGNAL SCORES (computed nightly) ──────────────────────────────
CREATE TABLE product_signal_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  score_date DATE NOT NULL,
  signal_score NUMERIC(5,2),
  mention_score NUMERIC(5,2),
  sentiment_score NUMERIC(5,2),
  velocity_score NUMERIC(5,2),
  press_score NUMERIC(5,2),
  funding_score NUMERIC(5,2),
  wow_velocity NUMERIC(8,4),
  mom_velocity NUMERIC(8,4),
  is_breakout BOOLEAN DEFAULT FALSE,
  UNIQUE(product_id, score_date)
);

-- ─── PRODUCT GRAVEYARD ─────────────────────────────────────────────
CREATE TABLE product_graveyard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) UNIQUE,
  death_year INT,
  death_month INT,
  death_reason TEXT,
  death_announcement_url TEXT,
  acquirer_company_id UUID REFERENCES companies(id),
  successor_product_id UUID REFERENCES products(id),
  pre_death_signal_data JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRODUCT CHANGELOG (audit trail) ───────────────────────────────
CREATE TABLE product_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by TEXT DEFAULT 'system'
);

-- ─── JOB POSTINGS SNAPSHOTS ────────────────────────────────────────
CREATE TABLE job_posting_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  snapshot_date DATE NOT NULL,
  total_postings INT,
  source TEXT,
  UNIQUE(company_id, snapshot_date)
);

-- ─── INDEXES ───────────────────────────────────────────────────────
CREATE INDEX idx_products_launched_year ON products(launched_year);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_primary_function ON products(primary_function);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_source ON products(source);
CREATE INDEX idx_press_mentions_product ON press_mentions(product_id);
CREATE INDEX idx_funding_company ON funding_rounds(company_id);
CREATE INDEX idx_social_mentions_product_date ON social_mentions(product_id, snapshot_date DESC);
CREATE INDEX idx_signal_scores_date ON product_signal_scores(score_date DESC);
CREATE INDEX idx_signal_scores_breakout ON product_signal_scores(is_breakout) WHERE is_breakout = TRUE;

-- Trigram indexes for fuzzy name dedup (Layer 2 of the dedup cascade)
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX idx_companies_name_trgm ON companies USING gin (name gin_trgm_ops);
