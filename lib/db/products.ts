/**
 * lib/db/products.ts
 *
 * Supabase query functions for the products table.
 * Returns data shaped to match the `Product` interface that UI components
 * already consume — so no component changes are needed for the Day 5 cut-over.
 *
 * Fields not yet in the DB (buzz, badges, characteristics detail, etc.) are
 * stubbed with safe defaults and will be filled in as signal scoring lands.
 */

import { supabaseAdmin } from '@/lib/supabase-server'
import type { Product } from '@/lib/mock-data'

// ─── Category slug → display name ────────────────────────────────────────────

const CATEGORY_DISPLAY: Record<string, string> = {
  'ai-tools':       'AI Tools',
  'dev-tools':      'Developer Tools',
  'productivity':   'Productivity',
  'design':         'Design',
  'marketing':      'Marketing',
  'analytics':      'Analytics',
  'finance':        'Finance',
  'communication':  'Communication',
  'security':       'Security',
  'hardware':       'Hardware',
  'entertainment':  'Entertainment',
  'education':      'Education',
  'health':         'Health',
  'e-commerce':     'E-commerce',
  'gaming':         'Gaming',
}

function categoryDisplay(slug: string): string {
  return CATEGORY_DISPLAY[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── DB row type (what Supabase returns) ──────────────────────────────────────

type DbSignalScore = {
  signal_score: number | null
  mention_score: number | null
  sentiment_score: number | null
  velocity_score: number | null
  press_score: number | null
  funding_score: number | null
  wow_velocity: number | null
  mom_velocity: number | null
  is_breakout: boolean | null
  score_date: string | null
}

type DbProduct = {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  category: string
  sub_category: string | null
  platform: string | null
  business_model: string | null
  status: string
  source_url: string | null
  website_url: string | null
  twitter_handle: string | null
  github_repo: string | null
  launched_year: number | null
  launched_month: number | null
  task_search_tags: string[] | null
  functionality_scores: Record<string, number> | null
  screenshots: string[] | null
  created_at: string
  product_tags: { tags: { slug: string; tag_group: string } | null }[]
  product_signal_scores: DbSignalScore[]
}

// ─── Signal score helpers ─────────────────────────────────────────────────────

function getLatestScore(scores: DbSignalScore[]): DbSignalScore | null {
  const valid = scores.filter(s => s.score_date !== null && s.signal_score !== null)
  if (valid.length === 0) return null
  return valid.sort((a, b) => (b.score_date! > a.score_date! ? 1 : -1))[0]
}

function buildSparkline(scores: DbSignalScore[]): number[] {
  const valid = scores
    .filter(s => s.score_date !== null && s.signal_score !== null)
    .sort((a, b) => (a.score_date! > b.score_date! ? 1 : -1))
    .slice(-7)
    .map(s => Math.round((s.signal_score ?? 0) * 10))

  // Pad left with zeros to always return 7 elements
  while (valid.length < 7) valid.unshift(0)
  return valid.slice(-7)
}

function buildSources(score: DbSignalScore | null): Product['buzz']['sources'] {
  if (!score) return { twitter: 0, reddit: 0, hackerNews: 0, news: 0 }
  const social = Math.round(score.mention_score ?? 0)
  const third = Math.floor(social / 3)
  return {
    twitter:    third,
    reddit:     third,
    hackerNews: social - third - third,  // absorbs rounding
    news:       Math.round(score.press_score ?? 0),
  }
}

// ─── Adapter: DB row → Product (UI shape) ────────────────────────────────────

const FALLBACK_LOGO = 'https://placehold.co/48x48/e2e8f0/64748b?text=P'

function toProduct(row: DbProduct): Product {
  const launchDate = row.launched_year
    ? new Date(row.launched_year, (row.launched_month ?? 1) - 1, 1).toISOString()
    : row.created_at

  // Derive tags from product_tags join (tag slugs as strings)
  const tags = row.product_tags
    .map(pt => pt.tags?.slug)
    .filter((s): s is string => Boolean(s))

  // Derive basic characteristics from what we have
  const pricingMap: Record<string, Product['characteristics']['pricing']> = {
    freemium: 'freemium',
    free: 'free',
    paid: 'paid',
    saas: 'paid',
    'open-source': 'free',
  }
  const pricing = pricingMap[row.business_model ?? ''] ?? 'freemium'

  const platformMap: Record<string, Product['characteristics']['platforms'][number]> = {
    web: 'web',
    mobile: 'ios',
    desktop: 'mac',
    'cross-platform': 'web',
    hardware: 'web',
  }
  const platforms: Product['characteristics']['platforms'] = row.platform
    ? [platformMap[row.platform] ?? 'web']
    : ['web']

  const isOpenSource = tags.includes('open-source') || row.business_model === 'open-source'
  const hasAPI = tags.includes('api-first')
  const isAI = row.category === 'ai-tools' || tags.some(t => t.startsWith('ai-'))

  // Real signal scores from product_signal_scores join
  const latestScore  = getLatestScore(row.product_signal_scores)
  const rawScore     = latestScore?.signal_score ?? 0
  const wowVelocity  = latestScore?.wow_velocity ?? 0

  const buzzTrend: Product['buzz']['trend'] =
    wowVelocity > 5 ? 'rising' :
    wowVelocity < -5 ? 'falling' :
    'stable'

  const buzz: Product['buzz'] = {
    score:       Math.round(rawScore * 10),   // 0–100 DB → 0–1000 display
    trend:       buzzTrend,
    weeklyChange: +wowVelocity.toFixed(1),
    sparkline:   buildSparkline(row.product_signal_scores),
    sources:     buildSources(latestScore),
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.description ? row.description.split('.')[0].trim() : row.name,
    description: row.description ?? '',
    logo: row.logo_url ?? FALLBACK_LOGO,
    url: row.website_url ?? row.source_url ?? '#',
    source_url: row.source_url ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    category: categoryDisplay(row.category) as any,
    tags,
    characteristics: {
      pricing,
      platforms,
      teamSize: '2-5',
      openSource: isOpenSource,
      hasAPI,
      aiPowered: isAI,
      targetAudience: ['developers'],
      funding: 'bootstrapped' as const,
      founded: row.launched_year ?? new Date().getFullYear(),
    },
    launchDate,
    lastUpdated: row.created_at,
    status: row.status === 'active' ? 'active' : 'dead',
    buzz,
    screenshots: row.screenshots ?? [],
    competitors: [],
    integrations: [],
    badges: [],
    saves: 0,
    views: 0,
  }
}

// ─── Shared select string ─────────────────────────────────────────────────────

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

// ─── Query functions ──────────────────────────────────────────────────────────

/** All active products, most recently added first. */
export async function getActiveProducts(limit = 100): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data as unknown as DbProduct[]).map(toProduct)
}

/** Featured = highest signal_score today. Falls back to recency if no scores. */
export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const today = new Date().toISOString().split('T')[0]

  // Step 1: get top product_ids by today's signal_score
  const { data: scores } = await supabaseAdmin
    .from('product_signal_scores')
    .select('product_id')
    .eq('score_date', today)
    .order('signal_score', { ascending: false })
    .limit(limit)

  const ids = (scores ?? []).map(s => s.product_id)

  if (ids.length > 0) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('status', 'active')
      .in('id', ids)
    if (!error && data) return (data as unknown as DbProduct[]).map(toProduct)
  }

  // Fallback: most recently added
  return getActiveProducts(limit)
}

/** Trending = highest velocity_score today. Falls back to recency if no scores. */
export async function getTrendingProducts(limit = 6): Promise<Product[]> {
  const today = new Date().toISOString().split('T')[0]

  // Step 1: get top product_ids by today's velocity_score
  const { data: scores } = await supabaseAdmin
    .from('product_signal_scores')
    .select('product_id')
    .eq('score_date', today)
    .order('velocity_score', { ascending: false })
    .limit(limit * 2)  // fetch extra so featured ≠ trending

  const ids = (scores ?? []).map(s => s.product_id)

  if (ids.length > 0) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('status', 'active')
      .in('id', ids)
      .limit(limit)
    if (!error && data) return (data as unknown as DbProduct[]).map(toProduct)
  }

  // Fallback: rotated slice so trending ≠ featured on homepage
  const all = await getActiveProducts(20)
  return [...all.slice(limit), ...all.slice(0, limit)].slice(0, limit)
}

/** Dead/sunset products. */
export async function getDeadProducts(limit = 10): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(PRODUCT_SELECT)
    .in('status', ['sunset', 'dead', 'acquired'])
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data as unknown as DbProduct[]).map(toProduct)
}

/** Single product by slug. Returns null if not found. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data ? toProduct(data as unknown as DbProduct) : null
}

/** Products in the same category (for the "More like this" section). */
export async function getProductsByCategory(categorySlug: string, limit = 8): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('category', categorySlug)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data as unknown as DbProduct[]).map(toProduct)
}

/** Total active product count (for the Products page subtitle). */
export async function getProductCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
  if (error) throw error
  return count ?? 0
}

/** Distinct active category slugs (for filter pills). */
export async function getDistinctCategories(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('category')
    .eq('status', 'active')
  if (error) throw error
  const slugs = [...new Set((data ?? []).map(r => r.category as string))].sort()
  return slugs.map(categoryDisplay)
}

// ─── Server-side search + pagination ─────────────────────────────────────────

export type SortOption = 'newest' | 'oldest' | 'az' | 'score' | 'trending'

export type SearchParams = {
  q?: string
  category?: string         // display name OR slug both accepted
  sort?: SortOption
  page?: number
  limit?: number
  status?: 'active' | 'dead' | 'all'
}

export type SearchResult = {
  products: Product[]
  total: number
  page: number
  totalPages: number
}

/**
 * Server-side paginated search with full-text and category filtering.
 * Sort by 'score' or 'trending' requires a signal score JOIN done via
 * a two-step query (fetch IDs ranked by score, then fetch full rows).
 */
export async function searchProducts(params: SearchParams = {}): Promise<SearchResult> {
  const {
    q,
    category,
    sort = 'newest',
    page = 1,
    limit = 50,
    status = 'active',
  } = params

  const offset = (page - 1) * limit

  // ── Score / velocity sorts need a two-step approach ──────────────────────
  if (sort === 'score' || sort === 'trending') {
    const today = new Date().toISOString().split('T')[0]
    const scoreCol = sort === 'score' ? 'signal_score' : 'velocity_score'

    // Step 1: get ranked product IDs from signal scores table
    let scoreQ = supabaseAdmin
      .from('product_signal_scores')
      .select('product_id')
      .eq('score_date', today)
      .order(scoreCol, { ascending: false })
      .limit(1000)

    const { data: scoreRows } = await scoreQ
    const rankedIds = (scoreRows ?? []).map(r => r.product_id)

    // Step 2: count matching products
    let countQ = supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })

    if (status !== 'all') {
      if (status === 'dead') {
        countQ = countQ.in('status', ['dead', 'sunset', 'acquired'])
      } else {
        countQ = countQ.eq('status', 'active')
      }
    }
    if (category) {
      // Accept both display name ("AI Tools") and slug ("ai-tools")
      const slug = category.toLowerCase().replace(/\s+/g, '-')
      countQ = countQ.eq('category', slug)
    }
    if (q) {
      countQ = countQ.textSearch('search_vector', q, { type: 'plain', config: 'english' })
    }

    const { count } = await countQ
    const total = count ?? 0

    if (rankedIds.length > 0) {
      let dataQ = supabaseAdmin
        .from('products')
        .select(PRODUCT_SELECT)
        .in('id', rankedIds)

      if (status !== 'all') {
        if (status === 'dead') {
          dataQ = dataQ.in('status', ['dead', 'sunset', 'acquired'])
        } else {
          dataQ = dataQ.eq('status', 'active')
        }
      }
      if (category) {
        const slug = category.toLowerCase().replace(/\s+/g, '-')
        dataQ = dataQ.eq('category', slug)
      }
      if (q) {
        dataQ = dataQ.textSearch('search_vector', q, { type: 'plain', config: 'english' })
      }

      dataQ = dataQ.range(offset, offset + limit - 1)
      const { data, error } = await dataQ
      if (!error && data) {
        // Re-sort to match signal score ranking
        const idOrder = new Map(rankedIds.map((id, i) => [id, i]))
        const sorted = (data as unknown as DbProduct[])
          .sort((a, b) => (idOrder.get(a.id) ?? 999) - (idOrder.get(b.id) ?? 999))
        return {
          products: sorted.map(toProduct),
          total,
          page,
          totalPages: Math.ceil(total / limit),
        }
      }
    }

    // Fallback to newest if no signal scores
    return searchProducts({ ...params, sort: 'newest' })
  }

  // ── Standard sorts (newest / oldest / az) ────────────────────────────────
  let query = supabaseAdmin.from('products').select(PRODUCT_SELECT, { count: 'exact' })

  if (status !== 'all') {
    if (status === 'dead') {
      query = query.in('status', ['dead', 'sunset', 'acquired'])
    } else {
      query = query.eq('status', 'active')
    }
  }

  if (category) {
    const slug = category.toLowerCase().replace(/\s+/g, '-')
    query = query.eq('category', slug)
  }

  if (q && q.trim().length >= 3) {
    // Full-text search for 3+ chars
    query = query.textSearch('search_vector', q.trim(), { type: 'plain', config: 'english' })
  } else if (q && q.trim().length > 0) {
    // Trigram / ilike fallback for short queries
    query = query.ilike('name', `%${q.trim()}%`)
  }

  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'az':
      query = query.order('name', { ascending: true })
      break
    default: // newest
      query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw error

  const total = count ?? 0
  return {
    products: (data as unknown as DbProduct[]).map(toProduct),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}
