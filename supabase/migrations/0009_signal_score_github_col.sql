ALTER TABLE product_signal_scores
  ADD COLUMN IF NOT EXISTS github_velocity_score NUMERIC(5,2) DEFAULT 0;
