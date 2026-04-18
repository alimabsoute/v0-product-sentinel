/**
 * lib/db/news.ts
 *
 * Query functions for press_mentions table.
 */

import { supabaseAdmin } from '@/lib/supabase-server'

export type PressMention = {
  id: string
  title: string
  url: string
  source: string | null
  published_at: string | null
  sentiment: string | null
  product_id: string
}

export type PressMentionWithProduct = PressMention & {
  product_name: string
  product_slug: string
  product_logo: string | null
}

export type PressMentionFeedResult = {
  items: PressMentionWithProduct[]
  total: number
  page: number
  totalPages: number
}

export type PressMentionStats = {
  totalMentions: number
  sourceBreakdown: { source: string; count: number }[]
}

// ─── Per-product queries ───────────────────────────────────────────────────────

/** Get press mentions for a single product, newest first. */
export async function getPressMentionsForProduct(
  productId: string,
  limit = 5,
): Promise<PressMention[]> {
  const { data, error } = await supabaseAdmin
    .from('press_mentions')
    .select('id, title, url, source, published_at, sentiment, product_id')
    .eq('product_id', productId)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[news] getPressMentionsForProduct error:', error.message)
    return []
  }
  return (data ?? []) as PressMention[]
}

// ─── Global feed queries ───────────────────────────────────────────────────────

/** Get recent press mentions across all products, joined with product info. */
export async function getRecentPressMentions(limit = 10): Promise<PressMentionWithProduct[]> {
  const { data, error } = await supabaseAdmin
    .from('press_mentions')
    .select(`
      id, title, url, source, published_at, sentiment, product_id,
      products ( name, slug, logo_url )
    `)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[news] getRecentPressMentions error:', error.message)
    return []
  }

  return ((data ?? []) as Array<{
    id: string
    title: string
    url: string
    source: string | null
    published_at: string | null
    sentiment: string | null
    product_id: string
    products: { name: string; slug: string; logo_url: string | null } | null
  }>).map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    source: row.source,
    published_at: row.published_at,
    sentiment: row.sentiment,
    product_id: row.product_id,
    product_name: row.products?.name ?? '',
    product_slug: row.products?.slug ?? '',
    product_logo: row.products?.logo_url ?? null,
  }))
}

// ─── Sprint 6 additions ────────────────────────────────────────────────────────

type FeedFilters = {
  category?: string
  source?: string
  page?: number
  limit?: number
  days?: number
}

/** Paginated press mentions feed with optional source/category/date filtering. */
export async function getPressMentionsFeed({
  category,
  source,
  page = 1,
  limit = 20,
  days,
}: FeedFilters = {}): Promise<PressMentionFeedResult> {
  const offset = (page - 1) * limit

  // Build base query with count
  let query = supabaseAdmin
    .from('press_mentions')
    .select(
      `
      id, title, url, source, published_at, sentiment, product_id,
      products ( name, slug, logo_url, category )
    `,
      { count: 'exact' },
    )
    .order('published_at', { ascending: false })

  if (source) {
    query = query.eq('source', source)
  }

  if (days && days > 0) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    query = query.gte('published_at', cutoff.toISOString())
  }

  if (category) {
    // Filter via products join — requires using `products.category`
    query = query.eq('products.category', category.toLowerCase().replace(/\s+/g, '-'))
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('[news] getPressMentionsFeed error:', error.message)
    return { items: [], total: 0, page, totalPages: 0 }
  }

  const total = count ?? 0
  const items = ((data ?? []) as Array<{
    id: string
    title: string
    url: string
    source: string | null
    published_at: string | null
    sentiment: string | null
    product_id: string
    products: { name: string; slug: string; logo_url: string | null; category: string } | null
  }>).map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    source: row.source,
    published_at: row.published_at,
    sentiment: row.sentiment,
    product_id: row.product_id,
    product_name: row.products?.name ?? '',
    product_slug: row.products?.slug ?? '',
    product_logo: row.products?.logo_url ?? null,
  }))

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

/** Aggregate stats about press mentions. */
export async function getPressMentionStats(): Promise<PressMentionStats> {
  const { count: totalMentions, error: countError } = await supabaseAdmin
    .from('press_mentions')
    .select('id', { count: 'exact', head: true })

  if (countError) {
    console.error('[news] getPressMentionStats count error:', countError.message)
  }

  // Source breakdown
  const { data: sourceData, error: sourceError } = await supabaseAdmin
    .from('press_mentions')
    .select('source')

  if (sourceError) {
    console.error('[news] getPressMentionStats source error:', sourceError.message)
  }

  const sourceMap: Record<string, number> = {}
  for (const row of sourceData ?? []) {
    const src = (row.source as string | null) ?? 'unknown'
    sourceMap[src] = (sourceMap[src] ?? 0) + 1
  }

  const sourceBreakdown = Object.entries(sourceMap)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)

  return {
    totalMentions: totalMentions ?? 0,
    sourceBreakdown,
  }
}
