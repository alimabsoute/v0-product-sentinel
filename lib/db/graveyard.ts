/**
 * lib/db/graveyard.ts
 *
 * Statistical intelligence functions for the graveyard page.
 * Implements Kaplan-Meier survival analysis, hazard rates, actuarial tables,
 * and death wave timeline — all computed from the products corpus.
 */

import { supabaseAdmin } from '@/lib/supabase-server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeadProduct = {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  category: string
  launched_year: number | null
  launched_month: number | null
  discontinued_year: number | null
  discontinued_month: number | null
  lifespan_months: number | null
  status: string
  death_reason: string | null
  postmortem: string | null
  era: string | null
}

export type KMPoint = {
  timeYears: number
  survival: number
}

export type KMCurve = {
  label: string
  color: string
  points: KMPoint[]
}

export type ActuarialRow = {
  category: string
  displayName: string
  count: number
  medianMonths: number
  oneYearSurvival: number
  threeYearSurvival: number
  fiveYearSurvival: number
  avgLifespanYears: number
}

export type DeathCause = {
  reason: string
  label: string
  count: number
  pct: number
  color: string
}

export type DeathWavePoint = {
  year: number
  [key: string]: number
}

export type HazardCell = {
  category: string
  displayName: string
  ageBucket: string
  count: number
  pct: number
  intensity: number  // 0-1 for color scaling
}

export type GraveyardStats = {
  totalDead: number
  oldestYear: number
  avgLifespanMonths: number
  fastestDeath: { name: string; months: number }
  longestSurvivor: { name: string; months: number }
  topKiller: string
}

// ─── Display helpers ──────────────────────────────────────────────────────────

const CATEGORY_DISPLAY: Record<string, string> = {
  'social': 'Social',
  'productivity': 'Productivity',
  'media': 'Media',
  'hardware': 'Hardware',
  'gaming': 'Gaming',
  'analytics': 'Analytics',
  'communication': 'Communication',
  'dev-tools': 'Dev Tools',
  'health': 'Health',
  'e-commerce': 'E-Commerce',
  'design': 'Design',
  'mobile': 'Mobile',
  'finance': 'Finance',
  'entertainment': 'Entertainment',
  'web': 'Web',
}

const DEATH_REASON_LABELS: Record<string, string> = {
  'outcompeted': 'Outcompeted',
  'acquired_shutdown': 'Acquired & Killed',
  'strategic_pivot': 'Strategic Pivot',
  'execution': 'Execution Failure',
  'funding_failure': 'Funding Failure',
  'market_timing': 'Market Timing',
  'platform_dependency': 'Platform Pulled Rug',
  'regulatory': 'Regulatory',
}

const DEATH_REASON_COLORS: Record<string, string> = {
  'outcompeted': '#ef4444',
  'acquired_shutdown': '#f97316',
  'strategic_pivot': '#eab308',
  'execution': '#a855f7',
  'funding_failure': '#3b82f6',
  'market_timing': '#22c55e',
  'platform_dependency': '#ec4899',
  'regulatory': '#14b8a6',
}

const CATEGORY_COLORS: Record<string, string> = {
  'social': '#ef4444',
  'productivity': '#3b82f6',
  'media': '#f97316',
  'hardware': '#a855f7',
  'e-commerce': '#22c55e',
  'communication': '#eab308',
  'gaming': '#ec4899',
}

const AGE_BUCKETS = [
  { key: '0-1yr', label: '0-1 yr', minMonths: 0, maxMonths: 12 },
  { key: '1-3yr', label: '1-3 yr', minMonths: 12, maxMonths: 36 },
  { key: '3-5yr', label: '3-5 yr', minMonths: 36, maxMonths: 60 },
  { key: '5-10yr', label: '5-10 yr', minMonths: 60, maxMonths: 120 },
  { key: '10yr+', label: '10+ yr', minMonths: 120, maxMonths: Infinity },
]

function catDisplay(slug: string): string {
  return CATEGORY_DISPLAY[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Kaplan-Meier survival estimator ─────────────────────────────────────────

function computeKMCurve(lifespanMonths: number[]): KMPoint[] {
  if (lifespanMonths.length === 0) return [{ timeYears: 0, survival: 1 }]

  const sorted = [...lifespanMonths].filter(m => m > 0).sort((a, b) => a - b)
  const n = sorted.length
  const points: KMPoint[] = [{ timeYears: 0, survival: 1 }]

  let s = 1.0
  let idx = 0

  while (idx < sorted.length) {
    const t = sorted[idx]
    let deaths = 0
    while (idx < sorted.length && sorted[idx] === t) {
      deaths++
      idx++
    }
    const nAtRisk = n - (idx - deaths)
    s = s * (1 - deaths / nAtRisk)
    points.push({ timeYears: parseFloat((t / 12).toFixed(2)), survival: parseFloat(s.toFixed(4)) })
  }

  // Extend to 20 years if the last point is before that
  const lastPoint = points[points.length - 1]
  if (lastPoint.timeYears < 20) {
    points.push({ timeYears: 20, survival: lastPoint.survival })
  }

  return points
}

// Sample KM points at regular year intervals for clean chart rendering
function sampleKMAtYears(points: KMPoint[], years: number[]): KMPoint[] {
  return years.map(yr => {
    // Find the survival value just before or at this year
    let survival = 1.0
    for (const p of points) {
      if (p.timeYears <= yr) survival = p.survival
      else break
    }
    return { timeYears: yr, survival }
  })
}

// ─── Main analytics functions ─────────────────────────────────────────────────

export async function getGraveyardOverviewStats(): Promise<GraveyardStats> {
  const { data } = await supabaseAdmin
    .from('products')
    .select('name, lifespan_months, death_reason')
    .eq('status', 'dead')
    .not('lifespan_months', 'is', null)

  const rows = (data ?? []) as { name: string; lifespan_months: number; death_reason: string | null }[]

  const lifespans = rows.map(r => r.lifespan_months)
  const avgLifespan = lifespans.length ? Math.round(lifespans.reduce((a, b) => a + b, 0) / lifespans.length) : 0

  const sorted = [...rows].sort((a, b) => a.lifespan_months - b.lifespan_months)
  const fastest = sorted[0]
  const longest = sorted[sorted.length - 1]

  // Find top killer
  const reasonCounts: Record<string, number> = {}
  for (const r of rows) {
    if (r.death_reason) reasonCounts[r.death_reason] = (reasonCounts[r.death_reason] ?? 0) + 1
  }
  const topKiller = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown'

  return {
    totalDead: rows.length,
    oldestYear: 1994,
    avgLifespanMonths: avgLifespan,
    fastestDeath: { name: fastest?.name ?? '', months: fastest?.lifespan_months ?? 0 },
    longestSurvivor: { name: longest?.name ?? '', months: longest?.lifespan_months ?? 0 },
    topKiller: DEATH_REASON_LABELS[topKiller] ?? topKiller,
  }
}

export async function getKMSurvivalCurves(): Promise<KMCurve[]> {
  const { data } = await supabaseAdmin
    .from('products')
    .select('category, lifespan_months')
    .eq('status', 'dead')
    .not('lifespan_months', 'is', null)

  const rows = (data ?? []) as { category: string; lifespan_months: number }[]
  const yearSamples = [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 18, 20]

  // Overall curve
  const overall = sampleKMAtYears(
    computeKMCurve(rows.map(r => r.lifespan_months)),
    yearSamples
  )

  const curves: KMCurve[] = [
    { label: 'All Products', color: '#ffffff', points: overall },
  ]

  // Category-specific curves for top categories
  const catTargets = ['social', 'productivity', 'hardware', 'e-commerce', 'media']
  for (const cat of catTargets) {
    const catRows = rows.filter(r => r.category === cat)
    if (catRows.length < 3) continue
    const pts = sampleKMAtYears(
      computeKMCurve(catRows.map(r => r.lifespan_months)),
      yearSamples
    )
    curves.push({
      label: catDisplay(cat),
      color: CATEGORY_COLORS[cat] ?? '#94a3b8',
      points: pts,
    })
  }

  return curves
}

export async function getDeathCauses(): Promise<DeathCause[]> {
  const { data } = await supabaseAdmin
    .from('products')
    .select('death_reason')
    .eq('status', 'dead')
    .not('death_reason', 'is', null)

  const rows = (data ?? []) as { death_reason: string }[]
  const total = rows.length

  const counts: Record<string, number> = {}
  for (const r of rows) {
    counts[r.death_reason] = (counts[r.death_reason] ?? 0) + 1
  }

  return Object.entries(counts)
    .map(([reason, count]) => ({
      reason,
      label: DEATH_REASON_LABELS[reason] ?? reason,
      count,
      pct: parseFloat(((count / total) * 100).toFixed(1)),
      color: DEATH_REASON_COLORS[reason] ?? '#94a3b8',
    }))
    .sort((a, b) => b.count - a.count)
}

export async function getActuarialTable(): Promise<ActuarialRow[]> {
  const { data } = await supabaseAdmin
    .from('products')
    .select('category, lifespan_months')
    .eq('status', 'dead')
    .not('lifespan_months', 'is', null)

  const rows = (data ?? []) as { category: string; lifespan_months: number }[]

  const byCategory: Record<string, number[]> = {}
  for (const r of rows) {
    if (!byCategory[r.category]) byCategory[r.category] = []
    byCategory[r.category].push(r.lifespan_months)
  }

  return Object.entries(byCategory)
    .filter(([, lifespans]) => lifespans.length >= 3)
    .map(([category, lifespans]) => {
      const sorted = [...lifespans].sort((a, b) => a - b)
      const n = sorted.length
      const mid = Math.floor(n / 2)
      const median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
      const avg = lifespans.reduce((a, b) => a + b, 0) / n

      return {
        category,
        displayName: catDisplay(category),
        count: n,
        medianMonths: Math.round(median),
        avgLifespanYears: parseFloat((avg / 12).toFixed(1)),
        oneYearSurvival: Math.round((lifespans.filter(m => m > 12).length / n) * 100),
        threeYearSurvival: Math.round((lifespans.filter(m => m > 36).length / n) * 100),
        fiveYearSurvival: Math.round((lifespans.filter(m => m > 60).length / n) * 100),
      }
    })
    .sort((a, b) => b.count - a.count)
}

export async function getDeathWaveTimeline(): Promise<{ years: number[]; series: Record<string, number[]>; categories: string[] }> {
  const { data } = await supabaseAdmin
    .from('products')
    .select('category, discontinued_year')
    .eq('status', 'dead')
    .not('discontinued_year', 'is', null)
    .gte('discontinued_year', 2000)

  const rows = (data ?? []) as { category: string; discontinued_year: number }[]

  const topCats = ['social', 'productivity', 'media', 'hardware', 'e-commerce', 'communication', 'gaming']
  const years = Array.from({ length: 2025 - 2000 }, (_, i) => 2000 + i)

  const series: Record<string, number[]> = {}
  for (const cat of topCats) {
    series[cat] = years.map(yr =>
      rows.filter(r => r.category === cat && r.discontinued_year === yr).length
    )
  }

  // Other category
  series['other'] = years.map(yr =>
    rows.filter(r => !topCats.includes(r.category) && r.discontinued_year === yr).length
  )

  return { years, series, categories: [...topCats, 'other'] }
}

export async function getHazardHeatmap(): Promise<HazardCell[]> {
  const { data } = await supabaseAdmin
    .from('products')
    .select('category, lifespan_months')
    .eq('status', 'dead')
    .not('lifespan_months', 'is', null)

  const rows = (data ?? []) as { category: string; lifespan_months: number }[]

  const byCategory: Record<string, number[]> = {}
  for (const r of rows) {
    if (!byCategory[r.category]) byCategory[r.category] = []
    byCategory[r.category].push(r.lifespan_months)
  }

  const topCats = Object.entries(byCategory)
    .filter(([, ls]) => ls.length >= 3)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10)

  const cells: HazardCell[] = []
  let maxPct = 0

  for (const [category, lifespans] of topCats) {
    const n = lifespans.length
    for (const bucket of AGE_BUCKETS) {
      const count = lifespans.filter(m => m >= bucket.minMonths && m < bucket.maxMonths).length
      const pct = n > 0 ? parseFloat(((count / n) * 100).toFixed(1)) : 0
      if (pct > maxPct) maxPct = pct
      cells.push({ category, displayName: catDisplay(category), ageBucket: bucket.key, count, pct, intensity: 0 })
    }
  }

  // Normalize intensity 0-1
  for (const cell of cells) {
    cell.intensity = maxPct > 0 ? cell.pct / maxPct : 0
  }

  return cells
}

export async function getDeadProducts(page = 1, limit = 24): Promise<{
  products: DeadProduct[]
  total: number
  totalPages: number
}> {
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count } = await supabaseAdmin
    .from('products')
    .select('id, slug, name, description, logo_url, category, launched_year, launched_month, discontinued_year, discontinued_month, lifespan_months, status, death_reason, postmortem, era', { count: 'exact' })
    .eq('status', 'dead')
    .not('lifespan_months', 'is', null)
    .order('discontinued_year', { ascending: false })
    .order('lifespan_months', { ascending: true })
    .range(from, to)

  return {
    products: (data ?? []) as DeadProduct[],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
  }
}
