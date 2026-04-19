CREATE OR REPLACE VIEW attribute_cohort_share AS
SELECT
  t.slug AS tag_slug,
  t.name AS tag_name,
  t.group AS tag_group,
  p.launched_year,
  COUNT(*) AS product_count,
  COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (PARTITION BY p.launched_year), 0) AS share_pct
FROM product_tags pt
JOIN tags t ON t.id = pt.tag_id
JOIN products p ON p.id = pt.product_id
WHERE p.launched_year IS NOT NULL AND p.launched_year BETWEEN 2010 AND 2026
GROUP BY t.slug, t.name, t.group, p.launched_year;
