-- github_snapshots: daily star/fork counts per product with a GitHub repo
CREATE TABLE IF NOT EXISTS github_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  stars INTEGER NOT NULL DEFAULT 0,
  forks INTEGER NOT NULL DEFAULT 0,
  open_issues INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, snapshot_date)
);
CREATE INDEX IF NOT EXISTS idx_github_snapshots_product ON github_snapshots(product_id);
CREATE INDEX IF NOT EXISTS idx_github_snapshots_date ON github_snapshots(snapshot_date);
