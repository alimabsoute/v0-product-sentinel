-- User saved products (watchlist/bookmarks)
CREATE TABLE IF NOT EXISTS user_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- User alert preferences
CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'signal_change', -- 'signal_change' | 'funding' | 'news'
  threshold NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE user_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own saves" ON user_saves
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users can manage own alerts" ON user_alerts
  FOR ALL USING (auth.uid() = user_id);

-- Index for fast watchlist lookups
CREATE INDEX IF NOT EXISTS idx_user_saves_user_id ON user_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saves_product_id ON user_saves(product_id);
