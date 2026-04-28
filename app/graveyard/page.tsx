export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Skull, ChevronLeft, ChevronRight, Clock, Zap, TrendingDown, AlertTriangle } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { brandTitle } from '@/lib/branding'
import {
  getGraveyardStats,
  getDeathVelocityByCause,
  getDangerWindows,
  getDeathCauses,
  getDeathWaveTimeline,
  getHazardHeatmap,
  getDeadProducts,
  type DeadProduct,
} from '@/lib/db/graveyard'
import {
  DeathVelocityChart,
  DeathCauseChart,
  DangerWindowsChart,
  DeathWaveChart,
  HazardHeatmap,
} from '@/components/graveyard-charts'

export const metadata = {
  title: brandTitle('Product Graveyard'),
  description: 'Empirical mortality intelligence — when do products die, why, and which failure mode kills fastest. 120 documented failures, 1994–2024.',
}

const DEATH_REASON_LABELS: Record<string, string> = {
  outcompeted: 'Outcompeted', acquired_shutdown: 'Acquired & Killed',
  strategic_pivot: 'Strategic Pivot', execution: 'Execution Failure',
  funding_failure: 'Funding Failure', market_timing: 'Market Timing',
  platform_dependency: 'Platform Pulled Rug', regulatory: 'Regulatory',
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

  const [stats, velocity, dangerWindows, causes, wave, heatmap, deadResult] =
    await Promise.all([
      getGraveyardStats(),
      getDeathVelocityByCause(),
      getDangerWindows(),
      getDeathCauses(),
      getDeathWaveTimeline(),
      getHazardHeatmap(),
      getDeadProducts(page, 24),
    ])

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* ── Dark hero ───────────────────────────────────────────────────── */}
      <section className="bg-zinc-950 border-b border-zinc-800">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
                  <Skull className="h-5 w-5 text-zinc-400" />
                </div>
                <span className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
                  Empirical Failure Intelligence · {stats.spanYears}
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100">
                Product Graveyard
              </h1>
              <p className="mt-2 text-zinc-500 max-w-lg text-sm leading-relaxed">
                {stats.totalDead} documented product deaths analyzed. How long do products live before they die,
                what kills them, and when in their lifecycle are they most vulnerable?
              </p>
              <p className="mt-2 text-[11px] text-zinc-700 font-mono">
                ⚠ All statistics are conditional on observed failures — not population survival rates.
                Data reflects curated famous failures, not a random sample.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              <StatBlock icon={<Skull />} value={`${stats.totalDead}`} label="Failures Analyzed" />
              <StatBlock icon={<Clock />} value={`${(stats.avgLifespanMonths / 12).toFixed(1)}yr`} label="Avg Age at Death" />
              <StatBlock icon={<Zap />} value={`${stats.fastestDeath.months}mo`} label="Fastest Death" sub={stats.fastestDeath.name} />
              <StatBlock icon={<TrendingDown />} value={`${stats.topKillerPct}%`} label={stats.topKiller} />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-10 space-y-12">

        {/* ── Section 1: Death Velocity — the most useful professional chart ── */}
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6">
          <div className="mb-2">
            <h2 className="font-serif text-base font-semibold text-zinc-100">
              Death Velocity by Kill Mechanism
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              How much time does each failure mode give you? Bar = interquartile range of age-at-death.
              Dot = median. Hover for professional read.
            </p>
          </div>
          <div className="mt-5">
            <DeathVelocityChart rows={velocity} />
          </div>

          {/* Key insight callout */}
          <div className="mt-5 grid sm:grid-cols-3 gap-3">
            {velocity.slice(0, 3).map(r => (
              <div key={r.reason} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                  <span className="text-xs font-medium text-zinc-300">{r.label}</span>
                </div>
                <p className="font-mono text-lg font-bold text-zinc-100">
                  {r.medianMonths < 12 ? `${r.medianMonths}mo` : `${(r.medianMonths / 12).toFixed(1)}yr`}
                  <span className="text-xs font-normal text-zinc-600 ml-1">median</span>
                </p>
                <p className="text-[11px] text-zinc-600 mt-1">{r.insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 2: What kills them + Danger windows ─────────────────── */}
        <div className="grid gap-6 lg:grid-cols-5">

          <div className="lg:col-span-2 rounded-2xl bg-zinc-950 border border-zinc-800 p-6">
            <h2 className="font-serif text-base font-semibold text-zinc-100 mb-1">
              What Kills Products
            </h2>
            <p className="text-xs text-zinc-500 mb-4">Share of {stats.totalDead} documented failures</p>
            <DeathCauseChart causes={causes} />
          </div>

          <div className="lg:col-span-3 rounded-2xl bg-zinc-950 border border-zinc-800 p-6">
            <h2 className="font-serif text-base font-semibold text-zinc-100 mb-1">
              When in the Lifecycle Do They Die?
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              Of products that died in each category, what % died in each phase?
              Red = startup killer zone (0–2yr). Orange = growth stage (2–5yr). Yellow = established (5yr+).
            </p>
            <DangerWindowsChart rows={dangerWindows} />
          </div>
        </div>

        {/* ── Section 3: Hazard concentration heatmap ─────────────────────── */}
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6">
          <h2 className="font-serif text-base font-semibold text-zinc-100 mb-1">
            Failure Concentration Heatmap
          </h2>
          <p className="text-xs text-zinc-500 mb-5">
            Where in a product's life are failures concentrated, by category?
            Red intensity = % of that category's failures occurring in that age window.
          </p>
          <HazardHeatmap cells={heatmap} />
        </div>

        {/* ── Section 4: Death wave timeline ──────────────────────────────── */}
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6">
          <h2 className="font-serif text-base font-semibold text-zinc-100 mb-1">
            Death Waves — Failures Per Year
          </h2>
          <p className="text-xs text-zinc-500 mb-4">
            When did the crash years happen? 2012–2017 was the great mobile startup culling.
          </p>
          <DeathWaveChart years={wave.years} series={wave.series} categories={wave.categories} />
        </div>

        {/* ── Section 5: Product cards ─────────────────────────────────────── */}
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
            {deadResult.products.map(p => <GraveyardCard key={p.id} product={p} />)}
          </div>
          {deadResult.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1
                  ? <Link href={`/graveyard?page=${page - 1}`}><ChevronLeft className="h-4 w-4 mr-1" />Previous</Link>
                  : <span><ChevronLeft className="h-4 w-4 mr-1" />Previous</span>}
              </Button>
              <span className="text-xs text-muted-foreground font-mono">{page}/{deadResult.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= deadResult.totalPages} asChild={page < deadResult.totalPages}>
                {page < deadResult.totalPages
                  ? <Link href={`/graveyard?page=${page + 1}`}>Next<ChevronRight className="h-4 w-4 ml-1" /></Link>
                  : <span>Next<ChevronRight className="h-4 w-4 ml-1" /></span>}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBlock({ icon, value, label, sub }: { icon: React.ReactNode; value: string; label: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5">
      <div className="flex items-center gap-1.5 text-zinc-600 mb-1.5 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
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
              className="h-10 w-10 rounded-lg object-cover grayscale opacity-50 group-hover:opacity-70 transition-opacity"
            />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
            <Skull className="h-4 w-4 text-zinc-700" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-zinc-300 truncate group-hover:text-zinc-100 transition-colors text-sm">
            {product.name}
          </h3>
          <p className="text-[11px] text-zinc-600 capitalize">{product.category}</p>
        </div>
      </div>

      {product.description && (
        <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed mb-3">
          {product.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {product.launched_year && product.discontinued_year && (
            <span className="text-[10px] text-zinc-700 font-mono">
              {product.launched_year}–{product.discontinued_year}
            </span>
          )}
          {lifespan && (
            <span className="text-[10px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded">
              {lifespan}
            </span>
          )}
        </div>
        {reasonLabel && (
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 shrink-0 border ${reasonColor}`}>
            {reasonLabel}
          </Badge>
        )}
      </div>
    </Link>
  )
}
