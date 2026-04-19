/**
 * lib/db/analytics.ts
 *
 * Analytics query functions powering the /markets Bloomberg dashboard.
 * All functions return empty arrays/objects on error — never throw.
 *
 * Depends on views created in supabase/migrations/0006_analytics_views.sql:
 *   - latest_signal_scores
 *   - category_monthly_launches
 *   - cohort_survival
 */

import { supabaseAdmin } from '@/lib/supabase-server'

// ─── Category display name helper ────────────────────────────────────────────

const CATEGORY_DISPLAY: Record<string, string> = {
  'ai-tools': 'AI Tools',
  'dev-tools': 'Developer Tools',
  'developer-tools': 'Developer Tools',
  'productivity': 'Productivity',
  'design': 'Design',
  'marketing': 'Marketing',
  'analytics': 'Analytics',
  'finance': 'Finance',
  'communication': 'Communication',
  'security': 'Security',
  'hardware': 'Hardware',
  'entertainment': 'Entertainment',
  'education': 'Education',
  'health': 'Health',
  'e-commerce': 'E-commerce',
  'gaming': 'Gaming',
}

function categoryDisplay(slug: string): string {
  return CATEGORY_DISPLAY[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type CategoryDistributionItem = {
  category: string
  count: number
  display: string
}

export type SignalDistributionItem = {
  bucket: string
  count: number
}

export type VelocityLeader = {
  product_id: string
  name: string
  slug: string
  logo_url: string | null
  wow_velocity: number
  signal_score: number
}

export type NewProductRateItem = {
  period: string
  count: number
}

export type CategoryGrowthItem = {
  category: string
  month: string
  count: number
}

export type SurvivalRateItem = {
  launched_year: number
  total: number
  alive: number
  survival_rate: number
}

export type MarketStats = {
  totalProducts: number
  activeProducts: number
  avgSignalScore: number
  totalCategories: number
}

// ─── Query functions ──────────────────────────────────────────────────────────

/**
 * Product count by category (active products only), ordered by count desc.
 */
export async function getCategoryDistribution(): Promise<CategoryDistributionItem[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('category')
      .eq('status', 'active')

    if (error || !data) return []

    const counts: Record<string, number> = {}
    for (const row of data) {
      counts[row.category] = (counts[row.category] ?? 0) + 1
    }

    return Object.entries(counts)
      .map(([category, count]) => ({
        category,
        count,
        display: categoryDisplay(category),
      }))
      .sort((a, b) => b.count - a.count)
  } catch {
    return []
  }
}

/**
 * Top products where is_breakout = true, ordered by signal_score desc.
 */
export async function getTopBreakouts(limit = 10): Promise<VelocityLeader[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_signal_scores')
      .select(`
        product_id,
        signal_score,
        velocity_score,
        score_date,
        products!inner ( name, slug, logo_url, status )
      `)
      .eq('is_breakout', true)
      .eq('products.status', 'active')
      .order('signal_score', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return data.map((row) => {
      const product = (row as unknown as {
        product_id: string
        signal_score: number
        velocity_score: number
        products: { name: string; slug: string; logo_url: string | null }
      })
      return {
        product_id: product.product_id,
        name: product.products.name,
        slug: product.products.slug,
        logo_url: product.products.logo_url,
        wow_velocity: product.velocity_score ?? 0,
        signal_score: product.signal_score ?? 0,
      }
    })
  } catch {
    return []
  }
}

/**
 * Distribution of signal scores bucketed into 0-20, 20-40, 40-60, 60-80, 80-100 ranges.
 * Queries the latest score per product (via latest_signal_scores view).
 */
export async function getSignalDistribution(): Promise<SignalDistributionItem[]> {
  const buckets = ['0–20', '20–40', '40–60', '60–80', '80–100']
  const empty = buckets.map(bucket => ({ bucket, count: 0 }))

  try {
    const { data, error } = await supabaseAdmin
      .from('latest_signal_scores')
      .select('signal_score')

    if (error || !data) return empty

    const counts = [0, 0, 0, 0, 0]
    for (const row of data) {
      const score = row.signal_score ?? 0
      const idx = Math.min(Math.floor(score / 20), 4)
      counts[idx]++
    }

    return buckets.map((bucket, i) => ({ bucket, count: counts[i] }))
  } catch {
    return empty
  }
}

/**
 * Top velocity leaders — products with highest velocity_score, joined with product info.
 * Queries latest_signal_scores view joined to products table.
 */
export async function getVelocityLeaders(limit = 10): Promise<VelocityLeader[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('latest_signal_scores')
      .select(`
        product_id,
        signal_score,
        velocity_score,
        products!inner ( name, slug, logo_url, status )
      `)
      .eq('products.status', 'active')
      .order('velocity_score', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return (data as unknown as Array<{
      product_id: string
      signal_score: number
      velocity_score: number
      products: { name: string; slug: string; logo_url: string | null }
    }>).map(row => ({
      product_id: row.product_id,
      name: row.products.name,
      slug: row.products.slug,
      logo_url: row.products.logo_url,
      wow_velocity: row.velocity_score ?? 0,
      signal_score: row.signal_score ?? 0,
    }))
  } catch {
    return []
  }
}

/**
 * Count of new products launched in last 7d, 30d, 90d, 365d.
 * Uses created_at as proxy for launch date when launched_year is set.
 */
export async function getNewProductRate(): Promise<NewProductRateItem[]> {
  const periods = [
    { label: 'Last 7d', days: 7 },
    { label: 'Last 30d', days: 30 },
    { label: 'Last 90d', days: 90 },
    { label: 'Last 365d', days: 365 },
  ]

  try {
    const results = await Promise.all(
      periods.map(async ({ label, days }) => {
        const since = new Date()
        since.setDate(since.getDate() - days)
        const { count, error } = await supabaseAdmin
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('created_at', since.toISOString())

        return { period: label, count: error ? 0 : (count ?? 0) }
      })
    )
    return results
  } catch {
    return periods.map(p => ({ period: p.label, count: 0 }))
  }
}

/**
 * Category growth by month — last 12 months from category_monthly_launches view.
 * Returns rows sorted by category + month.
 */
export async function getCategoryGrowth(): Promise<CategoryGrowthItem[]> {
  try {
    const since = new Date()
    since.setFullYear(since.getFullYear() - 1)

    const { data, error } = await supabaseAdmin
      .from('category_monthly_launches')
      .select('category, month, product_count')
      .gte('month', since.toISOString())
      .order('month', { ascending: true })

    if (error || !data) return []

    return (data as Array<{ category: string; month: string; product_count: number }>).map(row => ({
      category: row.category,
      month: row.month,
      count: row.product_count,
    }))
  } catch {
    return []
  }
}

/**
 * Survival rates by launch year from cohort_survival view.
 * Aggregates across all categories per year.
 */
export async function getSurvivalRates(): Promise<SurvivalRateItem[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('cohort_survival')
      .select('launched_year, total, alive, dead')
      .order('launched_year', { ascending: true })

    if (error || !data) return []

    // Aggregate across categories per year
    const byYear: Record<number, { total: number; alive: number }> = {}
    for (const row of data as Array<{ launched_year: number; total: number; alive: number }>) {
      if (!byYear[row.launched_year]) {
        byYear[row.launched_year] = { total: 0, alive: 0 }
      }
      byYear[row.launched_year].total += row.total
      byYear[row.launched_year].alive += row.alive
    }

    return Object.entries(byYear)
      .map(([year, { total, alive }]) => ({
        launched_year: Number(year),
        total,
        alive,
        survival_rate: total > 0 ? Math.round((alive / total) * 100) : 0,
      }))
      .sort((a, b) => a.launched_year - b.launched_year)
  } catch {
    return []
  }
}

export type CohortShareItem = {
  tag_slug: string
  tag_group: string
  launched_year: number
  share_pct: number
}

export async function getCohortShare(tagGroup = 'capability'): Promise<CohortShareItem[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('attribute_cohort_share')
      .select('tag_slug, tag_group, launched_year, share_pct')
      .eq('tag_group', tagGroup)
      .gte('launched_year', 2015)
      .order('launched_year', { ascending: true })
    if (error || !data) return []
    return (data as unknown as Array<{
      tag_slug: string
      tag_group: string
      launched_year: number
      share_pct: string | number
    }>).map(r => ({
      tag_slug: r.tag_slug,
      tag_group: r.tag_group,
      launched_year: r.launched_year,
      share_pct: parseFloat(String(r.share_pct)),
    }))
  } catch {
    return []
  }
}

/**
 * High-level market aggregate stats.
 */
export async function getMarketStats(): Promise<MarketStats> {
  const fallback: MarketStats = {
    totalProducts: 0,
    activeProducts: 0,
    avgSignalScore: 0,
    totalCategories: 0,
  }

  try {
    const [totalResult, activeResult, scoreResult, categoryResult] = await Promise.all([
      supabaseAdmin
        .from('products')
        .select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabaseAdmin
        .from('latest_signal_scores')
        .select('signal_score'),
      supabaseAdmin
        .from('products')
        .select('category')
        .eq('status', 'active'),
    ])

    const totalProducts = totalResult.count ?? 0
    const activeProducts = activeResult.count ?? 0

    const scores = (scoreResult.data ?? []) as Array<{ signal_score: number | null }>
    const validScores = scores.map(s => s.signal_score ?? 0).filter(s => s > 0)
    const avgSignalScore = validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 0

    const categories = new Set((categoryResult.data ?? []).map((r: { category: string }) => r.category))
    const totalCategories = categories.size

    return { totalProducts, activeProducts, avgSignalScore, totalCategories }
  } catch {
    return fallback
  }
}
