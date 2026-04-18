-- Migration: 0006_analytics_views
-- Analytics views for /markets Bloomberg dashboard
-- Note: products table stores launched_year (INT) + launched_month (INT)
--       so we construct a date via make_date() for date_trunc operations.

-- View: latest signal score per product
CREATE OR REPLACE VIEW latest_signal_scores AS
SELECT DISTINCT ON (product_id)
  product_id, signal_score, mention_score, sentiment_score,
  velocity_score, press_score, funding_score, score_date
FROM product_signal_scores
ORDER BY product_id, score_date DESC;

-- View: product counts per category per month (uses launched_year/launched_month)
CREATE OR REPLACE VIEW category_monthly_launches AS
SELECT
  category,
  date_trunc('month', make_date(launched_year, COALESCE(launched_month, 1), 1)) AS month,
  COUNT(*) AS product_count
FROM products
WHERE launched_year IS NOT NULL AND status = 'active'
GROUP BY category, date_trunc('month', make_date(launched_year, COALESCE(launched_month, 1), 1));

-- View: survival cohort by launched_year
CREATE OR REPLACE VIEW cohort_survival AS
SELECT
  launched_year,
  category,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'active') AS alive,
  COUNT(*) FILTER (WHERE status != 'active') AS dead
FROM products
WHERE launched_year IS NOT NULL
GROUP BY launched_year, category;
