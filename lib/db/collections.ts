import { supabaseAdmin } from '@/lib/supabase-server'

export type Collection = {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  created_at: string
  product_count?: number
}

// Get all public collections, most recent first, with product count
export async function getPublicCollections(limit = 20): Promise<Collection[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_collections')
      .select('*, collection_products(count)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return (data as unknown as Array<Collection & { collection_products: [{ count: number }] }>).map(r => ({
      ...r,
      product_count: r.collection_products?.[0]?.count ?? 0,
    }))
  } catch { return [] }
}

// Get a single collection with products
export async function getCollectionById(id: string): Promise<Collection | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_collections')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return data as unknown as Collection
  } catch { return null }
}

// Get user's own collections
export async function getUserCollections(userId: string): Promise<Collection[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_collections')
      .select('*, collection_products(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return (data as unknown as Array<Collection & { collection_products: [{ count: number }] }>).map(r => ({
      ...r,
      product_count: r.collection_products?.[0]?.count ?? 0,
    }))
  } catch { return [] }
}

// Create a new collection for a user
export async function createCollection(
  userId: string,
  name: string,
  description?: string,
  isPublic = true,
): Promise<Collection> {
  const { data, error } = await supabaseAdmin
    .from('user_collections')
    .insert({ user_id: userId, name, description: description ?? null, is_public: isPublic })
    .select()
    .single()
  if (error) throw error
  return data as unknown as Collection
}

// Delete a collection by ID, verifying ownership
export async function deleteCollection(userId: string, collectionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('user_collections')
    .delete()
    .eq('id', collectionId)
    .eq('user_id', userId)
  if (error) throw error
}
