export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Skull, Calendar, ChevronLeft, ChevronRight, TrendingDown, Activity, Clock, Zap } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { brandTitle } from '@/lib/branding'
import {
  getGraveyardOverviewStats,
  getKMSurvivalCurves,
  getDeathCauses,
  getActuarialTable,
  getDeathWaveTimeline,
  getHazardHeatmap,
  getDeadProducts,
  type DeadProduct,
} from '@/lib/db/graveyard'
import {
  KMSurvivalChart,
  DeathCauseChart,
  DeathWaveChart,
  HazardHeatmap,
  ActuarialTable,
} from '@/components/graveyard-charts'

export const metadata = {
  title: brandTitle('Product Graveyard'),
  description: 'Kaplan-Meier survival analysis of 120+ dead tech products. Statistical mortality intelligence since 1994.',
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
  outcompeted: 'text-red-400 border-red-900/40',
  acquired_shutdown: 'text-orange-400 border-orange-900/40',
  strategic_pivot: 'text-yellow-400 border-yellow-900/40',
  execution: 'text-purple-400 border-purple-900/40',
  funding_failure: 'text-blue-400 border-blue-900/40',
  market_timing: 'text-green-400 border-green-900/40',
  platform_dependency: 'text-pink-400 border-pink-900/40',
  regulatory: 'text-teal-400 border-teal-900/40',
}

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function GraveyardPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = sp.page ? Number(sp.page) : 1

  const [stats, kmCurves, deathCauses, actuarial, wave, heatmap, deadResult] =
    await Promise.all([
      getGraveyardOverviewStats(),
      getKMSurvivalCurves(),
      getDeathCauses(),
      getActuarialTable(),
      getDeathWaveTimeline(),
      getHazardHeatmap(),
      getDeadProducts(page, 24),
    ])

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* ── Dark hero header ─────────────────────────────────────────────── */}
      <section className="bg-zinc-950 border-b border-zinc-800">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
                  <Skull className="h-5 w-5 text-zinc-400" />
                </div>
                <span className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
                  Mortality Intelligence · Kaplan-Meier Analysis
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100">
                Product Graveyard
              </h1>
              <p className="mt-2 text-zinc-500 max-w-lg text-sm leading-relaxed">
                Survival analysis of {stats.totalDead}+ documented tech product failures,{' '}
                {stats.oldestYear}–present. Understand when products die, why, and which categories
                carry the highest mortality risk.
              </p>
            </div>

            {/* ── Stat strip ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              <StatBlock icon={<Skull className="h-4 w-4" />} value={`${stats.totalDead}`} label="Dead Products" />
              <StatBlock
                icon={<Clock className="h-4 w-4" />}
                value={`${(stats.avgLifespanMonths / 12).toFixed(1)}yr`}
                label="Avg Lifespan"
              />
              <StatBlock
                icon={<Zap className="h-4 w-4" />}
                value={`${stats.fastestDeath.months}mo`}
                label={`Fastest Death`}
                sub={stats.fastestDeath.name}
              />
              <StatBlock
                icon={<TrendingDown className="h-4 w-4" />}
                value={stats.topKiller}
                label="Top Killer"
              />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-10 space-y-12">

        {/* ── Section 1: KM Curve + Death Causes ──────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-5">

          {/* KM Survival Curve */}
          <div className="lg:col-span-3 rounded-2xl bg-zinc-950 border border-zinc-800 p-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-zinc-400" />
                <h2 className="font-serif text-base font-semibold text-zinc-100">
                  Kaplan-Meier Survival Curve
                </h2>
              </div>
              <p className="text-xs text-zinc-600 font-mono">
                S(t) = ∏<sub>i:tᵢ≤t</sub> (1 − dᵢ/nᵢ) · Probability of surviving to age t given eventual death
              </p>
            </div>
            <KMSurvivalChart curves={kmCurves} />
          </div>

          {/* Death Causes */}
          <div className="lg:col-span-2 rounded-2xl bg-zinc-950 border border-zinc-800 p-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Skull className="h-4 w-4 text-zinc-400" />
                <h2 className="font-serif text-base font-semibold text-zinc-100">
                  Cause of Death
                </h2>
              </div>
              <p className="text-xs text-zinc-600">Distribution across {stats.totalDead} products</p>
            </div>
            <DeathCauseChart causes={deathCauses} />
          </div>
        </div>

        {/* ── Section 2: Hazard Heatmap ────────────────────────────────────── */}
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6">
          <div className="mb-5">
            <h2 className="font-serif text-base font-semibold text-zinc-100 mb-1">
              Empirical Hazard Heatmap
            </h2>
            <p className="text-xs text-zinc-600 font-mono">
              h(t,category) = P(death in age window | death observed) · Where do products die across their life?
            </p>
          </div>
          <HazardHeatmap cells={heatmap} />
        </div>

        {/* ── Section 3: Death Wave Timeline ──────────────────────────────── */}
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6">
          <div className="mb-4">
            <h2 className="font-serif text-base font-semibold text-zinc-100 mb-1">
              Death Wave Timeline
            </h2>
            <p className="text-xs text-zinc-600">
              Product shutdowns per year by category · 2000–2024
            </p>
          </div>
          <DeathWaveChart
            years={wave.years}
            series={wave.series}
            categories={wave.categories}
          />
        </div>

        {/* ── Section 4: Actuarial Table ───────────────────────────────────── */}
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6">
          <div className="mb-5">
            <h2 className="font-serif text-base font-semibold text-zinc-100 mb-1">
              Actuarial Table — Survival by Category
            </h2>
            <p className="text-xs text-zinc-600 font-mono">
              Conditional survival rates for the dead cohort only · Risk = 5-year mortality rate
            </p>
          </div>
          <ActuarialTable rows={actuarial} />
        </div>

        {/* ── Section 5: Dead Product Cards ───────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-lg font-semibold">The Fallen</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {deadResult.total} documented failures · Page {page} of {deadResult.totalPages}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {deadResult.products.map(product => (
              <GraveyardCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {deadResult.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? (
                  <Link href={`/graveyard?page=${page - 1}`}>
                    <ChevronLeft className="h-4 w-4 mr-1" />Previous
                  </Link>
                ) : (
                  <span><ChevronLeft className="h-4 w-4 mr-1" />Previous</span>
                )}
              </Button>
              <span className="text-xs text-muted-foreground font-mono">
                {deadResult.total} products · {page}/{deadResult.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= deadResult.totalPages} asChild={page < deadResult.totalPages}>
                {page < deadResult.totalPages ? (
                  <Link href={`/graveyard?page=${page + 1}`}>
                    Next<ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                ) : (
                  <span>Next<ChevronRight className="h-4 w-4 ml-1" /></span>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="text-center py-4">
          <Link href="/products" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to active products
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatBlock({ icon, value, label, sub }: { icon: React.ReactNode; value: string; label: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5">
      <div className="flex items-center gap-1.5 text-zinc-500 mb-1.5">{icon}<span className="text-[10px] uppercase tracking-wider">{label}</span></div>
      <p className="font-mono text-xl font-bold text-zinc-100 leading-none">{value}</p>
      {sub && <p className="text-[10px] text-zinc-600 mt-1 truncate">{sub}</p>}
    </div>
  )
}

function GraveyardCard({ product }: { product: DeadProduct }) {
  const reasonLabel = product.death_reason ? (DEATH_REASON_LABELS[product.death_reason] ?? product.death_reason) : null
  const reasonColor = product.death_reason ? (DEATH_REASON_COLORS[product.death_reason] ?? 'text-zinc-400 border-zinc-700') : 'text-zinc-400 border-zinc-700'
  const lifespan = product.lifespan_months
    ? product.lifespan_months < 12
      ? `${product.lifespan_months}mo`
      : `${(product.lifespan_months / 12).toFixed(1)}yr`
    : null

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition-all hover:border-zinc-600 hover:bg-zinc-900"
    >
      <div className="flex items-start gap-3 mb-3">
        {product.logo_url ? (
          <div className="relative shrink-0">
            <img
              src={product.logo_url}
              alt={product.name}
              className="h-10 w-10 rounded-lg object-cover grayscale opacity-60 group-hover:opacity-80 transition-opacity"
            />
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800">
              <Skull className="h-2.5 w-2.5 text-zinc-500" />
            </div>
          </div>
        ) : (
          <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
            <Skull className="h-4 w-4 text-zinc-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-zinc-200 truncate group-hover:text-zinc-100 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-zinc-600 capitalize truncate">{product.category}</p>
        </div>
      </div>

      {product.description && (
        <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed mb-3">
          {product.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {product.launched_year && product.discontinued_year && (
            <span className="flex items-center gap-1 text-[10px] text-zinc-600 font-mono">
              <Calendar className="h-3 w-3" />
              {product.launched_year}–{product.discontinued_year}
            </span>
          )}
          {lifespan && (
            <span className="text-[10px] font-mono text-zinc-600">{lifespan}</span>
          )}
        </div>
        {reasonLabel && (
          <Badge
            variant="outline"
            className={`text-[9px] px-1.5 py-0 h-4 shrink-0 border ${reasonColor}`}
          >
            {reasonLabel}
          </Badge>
        )}
      </div>
    </Link>
  )
}
