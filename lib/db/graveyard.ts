/**
 * lib/db/graveyard.ts
 *
 * Empirical mortality analysis for the graveyard page.
 * All data is from our curated corpus of 120 documented failures — results
 * are conditional on eventual death, not population survival rates.
 * Methodology note is surfaced in the UI wherever numbers are displayed.
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

export type DeathVelocityRow = {
  reason: string
  label: string
  color: string
  count: number
  medianMonths: number
  p25Months: number   // 25th percentile
  p75Months: number   // 75th percentile
  minMonths: number
  maxMonths: number
  fastestName: string
  slowestName: string
  insight: string     // what this tells a professional
}

export type DangerWindowRow = {
  category: string
  displayName: string
  count: number
  earlyPct: number   // % dying 0-2yr (startup killer window)
  midPct: number     // % dying 2-5yr (growth stage)
  latePct: number    // % dying 5yr+ (established stage)
  medianMonths: number
  peakWindow: string // 'early' | 'mid' | 'late'
}

export type DeathCause = {
  reason: string
  label: string
  count: number
  pct: number
  color: string
  medianMonths: number
}

export type DeathWaveData = {
  years: number[]
  series: Record<string, number[]>
  categories: string[]
}

export type HazardCell = {
  category: string
  displayName: string
  ageBucket: string
  count: number
  pct: number
  intensity: number
}

export type GraveyardStats = {
  totalDead: number
  spanYears: string
  avgLifespanMonths: number
  fastestDeath: { name: string; months: number }
  longestSurvivor: { name: string; months: number }
  topKiller: string
  topKillerPct: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_DISPLAY: Record<string, string> = {
  social: 'Social', productivity: 'Productivity', media: 'Media',
  hardware: 'Hardware', gaming: 'Gaming', analytics: 'Analytics',
  communication: 'Communication', 'dev-tools': 'Dev Tools',
  health: 'Health', 'e-commerce': 'E-Commerce', design: 'Design',
  mobile: 'Mobile', finance: 'Finance', entertainment: 'Entertainment', web: 'Web',
}

const DEATH_REASON_LABELS: Record<string, string> = {
  outcompeted: 'Outcompeted',
  acquired_shutdown: 'Acquired & Killed',
  strategic_pivot: 'Strategic Pivot',
  execution: 'Execution Failure',
  funding_failure: 'Funding Failure',
  market_timing: 'Market Timing',
  platform_dependency: 'Platform Pulled Rug',
  regulatory: 'Regulatory',
}

const DEATH_REASON_COLORS: Record<string, string> = {
  outcompeted: '#ef4444',
  acquired_shutdown: '#f97316',
  strategic_pivot: '#eab308',
  execution: '#a855f7',
  funding_failure: '#3b82f6',
  market_timing: '#22c55e',
  platform_dependency: '#ec4899',
  regulatory: '#14b8a6',
}

// Professional insight per death cause — what does this mean for a founder/VC?
const DEATH_REASON_INSIGHTS: Record<string, string> = {
  outcompeted: 'Slow death — years of signal decline before the end. You\'ll see it coming.',
  acquired_shutdown: 'Often a forced exit after years of operation. The acquirer kills the brand.',
  strategic_pivot: 'Internal decision, not market failure. Company survives; product doesn\'t.',
  execution: 'Fastest killer. Bad product-market fit surfaces in months, not years.',
  funding_failure: 'Early-stage phenomenon. Most funding deaths happen before year 2.',
  market_timing: 'Market was real — just 5-10 years ahead. The second mover won.',
  platform_dependency: 'API/platform risk. Death is sudden once the rug gets pulled.',
  regulatory: 'External shock. Little warning, unpredictable timing.',
}

const AGE_BUCKETS = [
  { key: '0-1yr', label: '< 1 yr', minMonths: 0, maxMonths: 12 },
  { key: '1-3yr', label: '1–3 yr', minMonths: 12, maxMonths: 36 },
  { key: '3-5yr', label: '3–5 yr', minMonths: 36, maxMonths: 60 },
  { key: '5-10yr', label: '5–10 yr', minMonths: 60, maxMonths: 120 },
  { key: '10yr+', label: '10+ yr', minMonths: 120, maxMonths: Infinity },
]

function catDisplay(slug: string): string {
  return CATEGORY_DISPLAY[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

// ─── Analytics functions ──────────────────────────────────────────────────────

export async function getGraveyardStats(): Promise<GraveyardStats> {
  const { data } = await supabaseAdmin
    .from('products')
    .select('name, lifespan_months, death_reason, launched_year, discontinued_year')
    .eq('status', 'dead')
    .not('lifespan_months', 'is', null)

  const rows = (data ?? []) as {
    name: string; lifespan_months: number; death_reason: string | null
    launched_year: number | null; discontinued_year: number | null
  }[]

  const lifespans = rows.map(r => r.lifespan_months)
  const avg = lifespans.length ? Math.round(lifespans.reduce((a, b) => a + b, 0) / lifespans.length) : 0
  const sorted = [...rows].sort((a, b) => a.lifespan_months - b.lifespan_months)

  const reasonCounts: Record<string, number> = {}
  for (const r of rows) {
    if (r.death_reason) reasonCounts[r.death_reason] = (reasonCounts[r.death_reason] ?? 0) + 1
  }
  const [[topKiller, topCount]] = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])

  const years = rows.flatMap(r => [r.launched_year, r.discontinued_year]).filter(Boolean) as number[]
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)

  return {
    totalDead: rows.length,
    spanYears: `${minYear}–${maxYear}`,
    avgLifespanMonths: avg,
    fastestDeath: { name: sorted[0]?.name ?? '', months: sorted[0]?.lifespan_months ?? 0 },
    longestSurvivor: { name: sorted[sorted.length - 1]?.name ?? '', months: sorted[sorted.length - 1]?.lifespan_months ?? 0 },
    topKiller: DEATH_REASON_LABELS[topKiller] ?? topKiller,
    topKillerPct: Math.round((topCount / rows.length) * 100),
  }
}

export async function getDeathVelocityByCause(): Promise<DeathVelocityRow[]> {
  const { data } = await supabaseAdmin
    .from('products')
    .select('name, death_reason, lifespan_months')
    .eq('status', 'dead')
    .not('death_reason', 'is', null)
    .not('lifespan_months', 'is', null)

  const rows = (data ?? []) as { name: string; death_reason: string; lifespan_months: number }[]

  const byReason: Record<string, { name: string; months: number }[]> = {}
  for (const r of rows) {
    if (!byReason[r.death_reason]) byReason[r.death_reason] = []
    byReason[r.death_reason].push({ name: r.name, months: r.lifespan_months })
  }

  return Object.entries(byReason)
    .filter(([, items]) => items.length >= 2)
    .map(([reason, items]) => {
      const sorted = [...items].sort((a, b) => a.months - b.months)
      const months = sorted.map(s => s.months)
      return {
        reason,
        label: DEATH_REASON_LABELS[reason] ?? reason,
        color: DEATH_REASON_COLORS[reason] ?? '#94a3b8',
        count: items.length,
        medianMonths: Math.round(percentile(months, 50)),
        p25Months: Math.round(percentile(months, 25)),
        p75Months: Math.round(percentile(months, 75)),
        minMonths: months[0],
        maxMonths: months[months.length - 1],
        fastestName: sorted[0].name,
        slowestName: sorted[sorted.length - 1].name,
        insight: DEATH_REASON_INSIGHTS[reason] ?? '',
      }
    })
    .sort((a, b) => a.medianMonths - b.medianMonths)
}

export async function getDangerWindows(): Promise<DangerWindowRow[]> {
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
    .filter(([, ls]) => ls.length >= 3)
    .map(([category, lifespans]) => {
      const n = lifespans.length
      const sorted = [...lifespans].sort((a, b) => a - b)
      const median = Math.round(percentile(sorted, 50))
      const earlyPct = Math.round((lifespans.filter(m => m <= 24).length / n) * 100)
      const midPct = Math.round((lifespans.filter(m => m > 24 && m <= 60).length / n) * 100)
      const latePct = 100 - earlyPct - midPct
      const peakWindow = earlyPct >= midPct && earlyPct >= latePct ? 'early'
        : midPct >= latePct ? 'mid' : 'late'
      return { category, displayName: catDisplay(category), count: n, earlyPct, midPct, latePct, medianMonths: median, peakWindow }
    })
    .sort((a, b) => b.count - a.count)
}

export async function getDeathCauses(): Promise<DeathCause[]> {
  const { data } = await supabaseAdmin
    .from('products')
    .select('death_reason, lifespan_months')
    .eq('status', 'dead')
    .not('death_reason', 'is', null)

  const rows = (data ?? []) as { death_reason: string; lifespan_months: number | null }[]
  const total = rows.length

  const acc: Record<string, number[]> = {}
  for (const r of rows) {
    if (!acc[r.death_reason]) acc[r.death_reason] = []
    if (r.lifespan_months != null) acc[r.death_reason].push(r.lifespan_months)
  }

  return Object.entries(acc)
    .map(([reason, months]) => {
      const sorted = [...months].sort((a, b) => a - b)
      return {
        reason,
        label: DEATH_REASON_LABELS[reason] ?? reason,
        count: months.length,
        pct: parseFloat(((months.length / total) * 100).toFixed(1)),
        color: DEATH_REASON_COLORS[reason] ?? '#94a3b8',
        medianMonths: sorted.length ? Math.round(percentile(sorted, 50)) : 0,
      }
    })
    .sort((a, b) => b.count - a.count)
}

export async function getDeathWaveTimeline(): Promise<DeathWaveData> {
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
    series[cat] = years.map(yr => rows.filter(r => r.category === cat && r.discontinued_year === yr).length)
  }
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
      const pct = parseFloat(((count / n) * 100).toFixed(1))
      if (pct > maxPct) maxPct = pct
      cells.push({ category, displayName: catDisplay(category), ageBucket: bucket.key, count, pct, intensity: 0 })
    }
  }

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
  const { data, count } = await supabaseAdmin
    .from('products')
    .select('id, slug, name, description, logo_url, category, launched_year, launched_month, discontinued_year, discontinued_month, lifespan_months, status, death_reason, postmortem, era', { count: 'exact' })
    .eq('status', 'dead')
    .not('lifespan_months', 'is', null)
    .order('discontinued_year', { ascending: false })
    .order('lifespan_months', { ascending: true })
    .range(from, from + limit - 1)

  return {
    products: (data ?? []) as DeadProduct[],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
  }
}
