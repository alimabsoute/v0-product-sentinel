-- Collections (user-curated product lists)
CREATE TABLE IF NOT EXISTS user_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collection_products (
  collection_id UUID NOT NULL REFERENCES user_collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (collection_id, product_id)
);

-- Comments on products
CREATE TABLE IF NOT EXISTS product_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  parent_id UUID REFERENCES product_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product upvotes
CREATE TABLE IF NOT EXISTS product_upvotes (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (product_id, user_id)
);

-- RLS
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public collections are viewable by all" ON user_collections
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "users manage own collections" ON user_collections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "collection products viewable if collection is public" ON collection_products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_collections c WHERE c.id = collection_id AND (c.is_public = true OR c.user_id = auth.uid()))
  );
CREATE POLICY "collection owners manage products" ON collection_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
  );

CREATE POLICY "comments are public" ON product_comments FOR SELECT USING (true);
CREATE POLICY "users manage own comments" ON product_comments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "upvotes are public" ON product_upvotes FOR SELECT USING (true);
CREATE POLICY "users manage own upvotes" ON product_upvotes
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_public ON user_collections(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_collection_products_collection ON collection_products(collection_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_product ON product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_user ON product_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_product_upvotes_product ON product_upvotes(product_id);
