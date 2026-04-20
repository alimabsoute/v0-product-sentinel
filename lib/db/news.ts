/**
 * lib/db/news.ts
 *
 * Query functions for press_mentions table.
 *
 * Actual schema columns:
 *   id, product_id, publication, headline, snippet, url,
 *   mention_year, mention_date, sentiment, is_vintage, source, metadata
 */

import { supabaseAdmin } from '@/lib/supabase-server'

export type PressMention = {
  id: string
  headline: string | null
  url: string | null
  publication: string | null
  mention_date: string | null
  sentiment: string | null
  product_id: string
  snippet: string | null
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

const MENTION_SELECT = 'id, headline, snippet, url, publication, mention_date, sentiment, product_id'
const MENTION_WITH_PRODUCT = `${MENTION_SELECT}, products ( name, slug, logo_url )`

function mapRow(row: Record<string, unknown>): PressMentionWithProduct {
  const p = row.products as { name: string; slug: string; logo_url: string | null } | null
  return {
    id: row.id as string,
    headline: row.headline as string | null,
    snippet: row.snippet as string | null,
    url: row.url as string | null,
    publication: row.publication as string | null,
    mention_date: row.mention_date as string | null,
    sentiment: row.sentiment as string | null,
    product_id: row.product_id as string,
    product_name: p?.name ?? '',
    product_slug: p?.slug ?? '',
    product_logo: p?.logo_url ?? null,
  }
}

// ─── Per-product ──────────────────────────────────────────────────────────────

export async function getPressMentionsForProduct(
  productId: string,
  limit = 5,
): Promise<PressMention[]> {
  const { data, error } = await supabaseAdmin
    .from('press_mentions')
    .select(MENTION_SELECT)
    .eq('product_id', productId)
    .order('mention_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[news] getPressMentionsForProduct:', error.message)
    return []
  }
  return (data ?? []) as PressMention[]
}

// ─── Global feed ──────────────────────────────────────────────────────────────

export async function getRecentPressMentions(limit = 10): Promise<PressMentionWithProduct[]> {
  const { data, error } = await supabaseAdmin
    .from('press_mentions')
    .select(MENTION_WITH_PRODUCT)
    .order('mention_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[news] getRecentPressMentions:', error.message)
    return []
  }
  return (data ?? []).map(mapRow)
}

export async function getPressMentionsFeed({
  category,
  source,
  page = 1,
  limit = 20,
  days,
}: {
  category?: string
  source?: string
  page?: number
  limit?: number
  days?: number
} = {}): Promise<PressMentionFeedResult> {
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('press_mentions')
    .select(`${MENTION_SELECT}, products ( name, slug, logo_url, category )`, { count: 'exact' })
    .order('mention_date', { ascending: false })

  if (source) query = query.eq('publication', source)

  if (days && days > 0) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    query = query.gte('mention_date', cutoff.toISOString().split('T')[0])
  }

  if (category) {
    query = query.eq('products.category', category.toLowerCase().replace(/\s+/g, '-'))
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('[news] getPressMentionsFeed:', error.message)
    return { items: [], total: 0, page, totalPages: 0 }
  }

  const total = count ?? 0
  return {
    items: (data ?? []).map(mapRow),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

// ─── News Archive ─────────────────────────────────────────────────────────────

export type NewsArchiveItem = {
  id: string
  headline: string | null
  url: string | null
  publication: string | null
  mention_date: string | null
  sentiment: number | null
  product_id: string | null
  product_name: string
  product_slug: string
  snippet: string | null
  metadata: {
    condensed_title?: string | null
    blurb?: string | null
    published_at?: string | null
    importance_score?: number | null
    event_type?: string | null
  } | null
}

export type NewsArchiveResult = {
  items: NewsArchiveItem[]
  total: number
  page: number
  totalPages: number
}

export type NewsArchiveFilters = {
  page?: number
  limit?: number
  source?: string
  sentiment?: -1 | 0 | 1
  dateFrom?: string
  dateTo?: string
  sort?: 'newest' | 'importance'
}

export async function getNewsArchive({
  page = 1,
  limit = 50,
  source,
  sentiment,
  dateFrom,
  dateTo,
  sort = 'newest',
}: NewsArchiveFilters = {}): Promise<NewsArchiveResult> {
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('press_mentions')
    .select('id, headline, snippet, url, publication, mention_date, sentiment, product_id, metadata, products ( name, slug )', { count: 'exact' })
    .order('mention_date', { ascending: false })

  if (source) query = query.eq('publication', source)
  if (sentiment !== undefined) query = query.eq('sentiment', sentiment)
  if (dateFrom) query = query.gte('mention_date', dateFrom)
  if (dateTo) query = query.lte('mention_date', dateTo)

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('[news] getNewsArchive:', error.message)
    return { items: [], total: 0, page, totalPages: 0 }
  }

  let items: NewsArchiveItem[] = (data ?? []).map((row) => {
    const p = row.products as { name: string; slug: string } | null
    return {
      id: row.id as string,
      headline: row.headline as string | null,
      snippet: row.snippet as string | null,
      url: row.url as string | null,
      publication: row.publication as string | null,
      mention_date: row.mention_date as string | null,
      sentiment: row.sentiment as number | null,
      product_id: row.product_id as string | null,
      product_name: p?.name ?? '',
      product_slug: p?.slug ?? '',
      metadata: row.metadata as NewsArchiveItem['metadata'],
    }
  })

  if (sort === 'importance') {
    items = items.sort(
      (a, b) => (b.metadata?.importance_score ?? 0) - (a.metadata?.importance_score ?? 0)
    )
  }

  const total = count ?? 0
  return { items, total, page, totalPages: Math.ceil(total / limit) }
}

export async function getNewsPublications(): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('press_mentions')
    .select('publication')
    .not('publication', 'is', null)

  const unique = [...new Set((data ?? []).map((r) => r.publication as string))]
  return unique.sort()
}

export async function getPressMentionStats(): Promise<PressMentionStats> {
  const { count: totalMentions } = await supabaseAdmin
    .from('press_mentions')
    .select('id', { count: 'exact', head: true })

  const { data: sourceData } = await supabaseAdmin
    .from('press_mentions')
    .select('publication')

  const sourceMap: Record<string, number> = {}
  for (const row of sourceData ?? []) {
    const src = (row.publication as string | null) ?? 'Unknown'
    sourceMap[src] = (sourceMap[src] ?? 0) + 1
  }

  return {
    totalMentions: totalMentions ?? 0,
    sourceBreakdown: Object.entries(sourceMap)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
  }
}
