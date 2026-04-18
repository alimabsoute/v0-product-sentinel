/**
 * lib/db/evolution.ts
 *
 * Query functions for the /evolution page.
 * All functions return empty arrays on error — never throw.
 *
 * Note: The products table stores launched_year (INT) + launched_month (INT),
 * not a launched_at timestamp. Queries use these integer columns.
 */

import { supabaseAdmin } from '@/lib/supabase-server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductTimeline = {
  year: number
  month: number
  count: number
  category: string
}

export type CategoryEvolutionYear = {
  year: number
  count: number
  avgSignal: number
}

export type CategoryEvolution = {
  category: string
  years: CategoryEvolutionYear[]
}

export type DeathTimeline = {
  year: number
  count: number
}

/** Minimal shape for displaying products in the evolution page grids. */
export type EvolutionProduct = {
  id: string
  slug: string
  name: string
  tagline: string
  logo: string
  launchDate: string
  status: 'active' | 'dead'
  statusReason?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FALLBACK_LOGO = 'https://placehold.co/48x48/e2e8f0/64748b?text=P'

function toEvolutionProduct(row: {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  launched_year: number | null
  launched_month: number | null
  created_at: string
  status: string
}): EvolutionProduct {
  const launchDate = row.launched_year
    ? new Date(row.launched_year, (row.launched_month ?? 1) - 1, 1).toISOString()
    : row.created_at

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.description ? row.description.split('.')[0].trim() : row.name,
    logo: row.logo_url ?? FALLBACK_LOGO,
    launchDate,
    status: row.status === 'active' ? 'active' : 'dead',
  }
}

// ─── Query functions ──────────────────────────────────────────────────────────

/**
 * Product counts grouped by launched_year + launched_month.
 * Only includes years 2015-present.
 * Optionally filtered by category.
 */
export async function getProductTimeline(category?: string): Promise<ProductTimeline[]> {
  try {
    const currentYear = new Date().getFullYear()
    let query = supabaseAdmin
      .from('products')
      .select('launched_year, launched_month, category')
      .gte('launched_year', 2015)
      .lte('launched_year', currentYear)
      .not('launched_year', 'is', null)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error || !data) return []

    // Group by year + month + category
    const map = new Map<string, number>()
    for (const row of data as Array<{ launched_year: number; launched_month: number | null; category: string }>) {
      const key = `${row.launched_year}|${row.launched_month ?? 1}|${row.category}`
      map.set(key, (map.get(key) ?? 0) + 1)
    }

    return Array.from(map.entries()).map(([key, count]) => {
      const [year, month, cat] = key.split('|')
      return {
        year: Number(year),
        month: Number(month),
        count,
        category: cat,
      }
    }).sort((a, b) => a.year - b.year || a.month - b.month)
  } catch {
    return []
  }
}

/**
 * Per-category counts and avg signal score grouped by launched_year.
 * Only includes years 2015-present.
 */
export async function getCategoryEvolution(): Promise<CategoryEvolution[]> {
  try {
    const currentYear = new Date().getFullYear()

    // Fetch products with their latest signal scores
    const { data: products, error: pErr } = await supabaseAdmin
      .from('products')
      .select('id, category, launched_year')
      .gte('launched_year', 2015)
      .lte('launched_year', currentYear)
      .not('launched_year', 'is', null)
      .eq('status', 'active')

    if (pErr || !products) return []

    // Build a lookup of product_id → signal_score from latest scores
    const productIds = (products as Array<{ id: string; category: string; launched_year: number }>).map(p => p.id)

    let signalMap: Record<string, number> = {}
    if (productIds.length > 0) {
      const { data: scores } = await supabaseAdmin
        .from('product_signal_scores')
        .select('product_id, signal_score')
        .in('product_id', productIds.slice(0, 500)) // cap for safety

      if (scores) {
        for (const s of scores as Array<{ product_id: string; signal_score: number | null }>) {
          // Keep highest score per product (approximates latest)
          if (!signalMap[s.product_id] || (s.signal_score ?? 0) > signalMap[s.product_id]) {
            signalMap[s.product_id] = s.signal_score ?? 0
          }
        }
      }
    }

    // Aggregate by category + launched_year
    type AggKey = { total: number; signalSum: number }
    const map = new Map<string, AggKey>()

    for (const p of products as Array<{ id: string; category: string; launched_year: number }>) {
      const key = `${p.category}|${p.launched_year}`
      const existing = map.get(key) ?? { total: 0, signalSum: 0 }
      map.set(key, {
        total: existing.total + 1,
        signalSum: existing.signalSum + (signalMap[p.id] ?? 0),
      })
    }

    // Reshape into CategoryEvolution[]
    const byCategory = new Map<string, Map<number, AggKey>>()
    for (const [key, agg] of map.entries()) {
      const [category, yearStr] = key.split('|')
      const year = Number(yearStr)
      if (!byCategory.has(category)) byCategory.set(category, new Map())
      byCategory.get(category)!.set(year, agg)
    }

    return Array.from(byCategory.entries()).map(([category, yearMap]) => ({
      category,
      years: Array.from(yearMap.entries())
        .map(([year, agg]) => ({
          year,
          count: agg.total,
          avgSignal: agg.total > 0 ? Math.round(agg.signalSum / agg.total) : 0,
        }))
        .sort((a, b) => a.year - b.year),
    }))
  } catch {
    return []
  }
}

/**
 * Count of non-active products grouped by launched_year (dead/sunset/acquired).
 * Used as a proxy "death timeline" since we have no explicit death date column.
 */
export async function getDeathTimeline(): Promise<DeathTimeline[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('launched_year')
      .in('status', ['dead', 'sunset', 'acquired'])
      .not('launched_year', 'is', null)
      .gte('launched_year', 2000)

    if (error || !data) return []

    const counts: Record<number, number> = {}
    for (const row of data as Array<{ launched_year: number }>) {
      counts[row.launched_year] = (counts[row.launched_year] ?? 0) + 1
    }

    return Object.entries(counts)
      .map(([year, count]) => ({ year: Number(year), count }))
      .sort((a, b) => a.year - b.year)
  } catch {
    return []
  }
}

/**
 * Recent notable active products (for "Products of the 2020s" section).
 */
export async function getRecentActiveProducts(limit = 6): Promise<EvolutionProduct[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, slug, name, description, logo_url, launched_year, launched_month, created_at, status')
      .eq('status', 'active')
      .gte('launched_year', 2020)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return (data as Parameters<typeof toEvolutionProduct>[0][]).map(toEvolutionProduct)
  } catch {
    return []
  }
}

/**
 * Recent dead/sunset products (for "Recent Casualties" section).
 */
export async function getRecentDeadProducts(limit = 12): Promise<EvolutionProduct[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, slug, name, description, logo_url, launched_year, launched_month, created_at, status')
      .in('status', ['dead', 'sunset', 'acquired'])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return (data as Parameters<typeof toEvolutionProduct>[0][]).map(toEvolutionProduct)
  } catch {
    return []
  }
}

/**
 * Category growth data shaped to match the mock categoryGrowthData format
 * used in the evolution page: { category, years: { 2020: N, 2021: N, ... } }
 *
 * Returns top 6 categories by total count in the 2020-present window.
 */
export async function getCategoryGrowthByYear(
  startYear = 2020,
  endYear?: number
): Promise<Array<{ category: string; years: Record<number, number> }>> {
  try {
    const end = endYear ?? new Date().getFullYear()

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('category, launched_year')
      .gte('launched_year', startYear)
      .lte('launched_year', end)
      .not('launched_year', 'is', null)
      .eq('status', 'active')

    if (error || !data) return []

    // Group by category + year
    const map = new Map<string, Record<number, number>>()
    for (const row of data as Array<{ category: string; launched_year: number }>) {
      if (!map.has(row.category)) {
        map.set(row.category, {})
      }
      const years = map.get(row.category)!
      years[row.launched_year] = (years[row.launched_year] ?? 0) + 1
    }

    // Fill missing years with 0 for each category
    const allYears = Array.from({ length: end - startYear + 1 }, (_, i) => startYear + i)
    const result = Array.from(map.entries()).map(([category, years]) => {
      const filled: Record<number, number> = {}
      for (const y of allYears) filled[y] = years[y] ?? 0
      return { category, years: filled, total: Object.values(years).reduce((a, b) => a + b, 0) }
    })

    // Top 6 categories by total
    return result
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map(({ category, years }) => ({ category, years }))
  } catch {
    return []
  }
}
