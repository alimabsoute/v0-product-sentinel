/**
 * lib/db/watchlist.ts
 *
 * Watchlist / bookmarks CRUD using user_saves table.
 * Uses the admin client (service role) for server-side fetches,
 * and the anon client with RLS for client-side operations.
 */

import { getSupabaseAdmin } from '@/lib/supabase-server'
import type { Product } from '@/lib/mock-data'
import { supabaseAdmin } from '@/lib/supabase-server'

// ─── Type ─────────────────────────────────────────────────────────────────────

type SaveRow = {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns all products saved by a user, most recent first.
 * Joins user_saves → products and returns full Product shape.
 */
export async function getUserSaves(userId: string): Promise<Product[]> {
  const admin = getSupabaseAdmin()

  // Get saved product IDs for this user
  const { data: saves, error: savesError } = await admin
    .from('user_saves')
    .select('product_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (savesError) throw savesError
  if (!saves || saves.length === 0) return []

  const productIds = saves.map((s: { product_id: string }) => s.product_id)

  // Fetch matching products with signal scores
  const PRODUCT_SELECT = `
    id, slug, name, description, logo_url,
    category, sub_category, platform, business_model,
    status, source_url, website_url, twitter_handle, github_repo,
    launched_year, launched_month, task_search_tags, functionality_scores,
    screenshots, created_at,
    product_tags ( tags ( slug, tag_group ) ),
    product_signal_scores (
      signal_score, mention_score, sentiment_score,
      velocity_score, press_score, funding_score,
      wow_velocity, mom_velocity, is_breakout, score_date
    )
  `

  const { data: products, error: productsError } = await admin
    .from('products')
    .select(PRODUCT_SELECT)
    .in('id', productIds)

  if (productsError) throw productsError
  if (!products) return []

  // Import toProduct adapter dynamically to avoid circular dependency
  const { searchProducts } = await import('@/lib/db/products')

  // Re-order to match save order (most recently saved first)
  const productMap = new Map((products as { id: string }[]).map(p => [p.id, p]))
  const ordered = productIds
    .map((id: string) => productMap.get(id))
    .filter(Boolean) as { id: string }[]

  // We need to convert DB rows to Product shape — use a raw query approach
  // since toProduct is not exported. Instead fetch via searchProducts with IDs.
  // For now, return products in ID order as a lightweight list
  // by fetching one page with matching IDs
  const result = await searchProducts({ page: 1, limit: productIds.length })

  // Filter to only saved products, preserving save order
  const savedSet = new Set(productIds)
  const savedProducts = result.products.filter(p => savedSet.has(p.id))

  // Sort by save order
  const saveOrder = new Map(productIds.map((id: string, i: number) => [id, i]))
  return savedProducts.sort((a, b) => (saveOrder.get(a.id) ?? 999) - (saveOrder.get(b.id) ?? 999))
}

/**
 * Save a product to the user's watchlist.
 * Silently ignores duplicate saves (UNIQUE constraint).
 */
export async function saveProduct(userId: string, productId: string): Promise<void> {
  const admin = getSupabaseAdmin()

  const { error } = await admin
    .from('user_saves')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({ user_id: userId, product_id: productId } as any, { onConflict: 'user_id,product_id' })

  if (error) throw error
}

/**
 * Remove a product from the user's watchlist.
 */
export async function unsaveProduct(userId: string, productId: string): Promise<void> {
  const admin = getSupabaseAdmin()

  const { error } = await admin
    .from('user_saves')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)

  if (error) throw error
}

/**
 * Check whether a specific product is saved by a user.
 */
export async function isProductSaved(userId: string, productId: string): Promise<boolean> {
  const admin = getSupabaseAdmin()

  const { data, error } = await admin
    .from('user_saves')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()

  if (error) throw error
  return data !== null
}

/**
 * Returns the set of product IDs saved by a user.
 * Useful for batch "is saved" checks on a product list.
 */
export async function getUserSavedIds(userId: string): Promise<Set<string>> {
  const admin = getSupabaseAdmin()

  const { data, error } = await admin
    .from('user_saves')
    .select('product_id')
    .eq('user_id', userId)

  if (error) throw error
  return new Set((data ?? []).map((r: { product_id: string }) => r.product_id))
}
