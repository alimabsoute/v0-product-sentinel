import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Skull, ArrowLeft, Calendar, Clock, Tag } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Badge } from '@/components/ui/badge'
import { brandTitle } from '@/lib/branding'
import { getDeadProduct } from '@/lib/db/graveyard'

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
  outcompeted: 'text-red-400 border-red-900/40 bg-red-950/30',
  acquired_shutdown: 'text-orange-400 border-orange-900/40 bg-orange-950/30',
  strategic_pivot: 'text-yellow-400 border-yellow-900/40 bg-yellow-950/30',
  execution: 'text-purple-400 border-purple-900/40 bg-purple-950/30',
  funding_failure: 'text-blue-400 border-blue-900/40 bg-blue-950/30',
  market_timing: 'text-green-400 border-green-900/40 bg-green-950/30',
  platform_dependency: 'text-pink-400 border-pink-900/40 bg-pink-950/30',
  regulatory: 'text-teal-400 border-teal-900/40 bg-teal-950/30',
}

const DEATH_REASON_CONTEXT: Record<string, string> = {
  outcompeted: 'A superior competitor captured the market. Signal scores typically decline for 12–24 months before the shutdown announcement.',
  acquired_shutdown: 'The company was acquired and the product discontinued. Often the team is the asset, not the product.',
  strategic_pivot: 'An internal decision ended this product — the company survived. The market was real; the product was a wrong bet.',
  execution: 'The product failed on its own terms. Bad product-market fit, technical debt, or leadership failure.',
  funding_failure: 'Capital dried up before the product reached escape velocity. The most common early-stage killer.',
  market_timing: 'The idea was right but the market wasn\'t ready. A successor captured the demand years later.',
  platform_dependency: 'The product relied on a third-party platform that pulled access. API risk realized.',
  regulatory: 'Government action or compliance costs made the product nonviable.',
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const product = await getDeadProduct(slug)
  if (!product) return {}
  return {
    title: brandTitle(`${product.name} — Postmortem`),
    description: `${product.name} (${product.launched_year}–${product.discontinued_year}): ${product.description ?? 'A documented product failure.'}`,
  }
}

export default async function GraveyardSlugPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getDeadProduct(slug)
  if (!product) notFound()

  const reasonLabel = product.death_reason ? (DEATH_REASON_LABELS[product.death_reason] ?? product.death_reason) : null
  const reasonColor = product.death_reason ? (DEATH_REASON_COLORS[product.death_reason] ?? 'text-zinc-400 border-zinc-700 bg-zinc-900') : 'text-zinc-400 border-zinc-700 bg-zinc-900'
  const reasonContext = product.death_reason ? (DEATH_REASON_CONTEXT[product.death_reason] ?? '') : ''

  const lifespan = product.lifespan_months
    ? product.lifespan_months < 12
      ? `${product.lifespan_months} months`
      : `${(product.lifespan_months / 12).toFixed(1)} years`
    : null

  const launchDate = product.launched_year
    ? [product.launched_month ? new Date(product.launched_year, product.launched_month - 1).toLocaleString('default', { month: 'long' }) : null, product.launched_year].filter(Boolean).join(' ')
    : null

  const deathDate = product.discontinued_year
    ? [product.discontinued_month ? new Date(product.discontinued_year, product.discontinued_month - 1).toLocaleString('default', { month: 'long' }) : null, product.discontinued_year].filter(Boolean).join(' ')
    : null

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* ── Dark hero ── */}
      <section className="bg-zinc-950 border-b border-zinc-800">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <Link
            href="/graveyard"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Product Graveyard
          </Link>

          <div className="flex items-start gap-5">
            {product.logo_url ? (
              <img
                src={product.logo_url}
                alt={product.name}
                className="h-16 w-16 rounded-xl object-cover grayscale opacity-40 shrink-0 mt-1"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-1">
                <Skull className="h-7 w-7 text-zinc-700" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                  Postmortem
                </span>
                {product.era && (
                  <span className="text-[10px] font-mono text-zinc-700 border border-zinc-800 px-1.5 py-0.5 rounded">
                    {product.era}
                  </span>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100 leading-tight">
                {product.name}
              </h1>

              {product.description && (
                <p className="mt-2 text-zinc-400 max-w-2xl text-sm leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>
          </div>

          {/* ── Vital stats ── */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {launchDate && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5">
                <div className="flex items-center gap-1.5 text-zinc-600 mb-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">Launched</span>
                </div>
                <p className="font-mono text-sm font-bold text-zinc-100">{launchDate}</p>
              </div>
            )}
            {deathDate && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5">
                <div className="flex items-center gap-1.5 text-zinc-600 mb-1.5">
                  <Skull className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">Discontinued</span>
                </div>
                <p className="font-mono text-sm font-bold text-zinc-100">{deathDate}</p>
              </div>
            )}
            {lifespan && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5">
                <div className="flex items-center gap-1.5 text-zinc-600 mb-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">Lifespan</span>
                </div>
                <p className="font-mono text-sm font-bold text-zinc-100">{lifespan}</p>
              </div>
            )}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5">
              <div className="flex items-center gap-1.5 text-zinc-600 mb-1.5">
                <Tag className="h-3.5 w-3.5" />
                <span className="text-[10px] uppercase tracking-wider">Category</span>
              </div>
              <p className="font-mono text-sm font-bold text-zinc-100 capitalize">{product.category}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-6 py-10 space-y-8">

        {/* ── Cause of death ── */}
        {reasonLabel && (
          <div className={`rounded-xl border p-5 ${reasonColor}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">Cause of Death</span>
            </div>
            <p className="text-lg font-semibold">{reasonLabel}</p>
            {reasonContext && (
              <p className="mt-1.5 text-sm opacity-70 leading-relaxed">{reasonContext}</p>
            )}
          </div>
        )}

        {/* ── Postmortem ── */}
        {product.postmortem && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="font-serif text-base font-semibold text-zinc-100 mb-4">
              What Happened
            </h2>
            <p className="text-zinc-300 leading-relaxed text-sm">
              {product.postmortem}
            </p>
          </div>
        )}

        {/* ── Footer nav ── */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <Link
            href="/graveyard"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Graveyard
          </Link>
          <Link
            href="/products"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Browse active products →
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
