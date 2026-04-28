export const revalidate = 300  // revalidate every 5 minutes

import Link from 'next/link'
import {
  ArrowRight,
  TrendingUp,
  Skull,
  BarChart3,
  Zap,
  Newspaper,
  Activity,
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductCard } from '@/components/product-card'
import { NewsFeed } from '@/components/news-feed'
import { MarketPulse } from '@/components/market-pulse'
import { TickerStrip } from '@/components/ticker-strip'
import { Button } from '@/components/ui/button'
import {
  getFeaturedProducts,
  getTrendingProducts,
  getDeadProducts,
  getMarketStats,
} from '@/lib/db/products'
import { getRecentPressMentions } from '@/lib/db/news'

export default async function HomePage() {
  const [featuredProducts, trendingProducts, deadProducts, recentNews, stats] =
    await Promise.all([
      getFeaturedProducts(6),
      getTrendingProducts(6),
      getDeadProducts(3),
      getRecentPressMentions(10),
      getMarketStats(),
    ])

  // Split featured: first 1 for hero card, next 5 for grid
  const heroProduct = featuredProducts[0]
  const gridProducts = featuredProducts.slice(1, 6)

  return (
    <div className="min-h-screen bg-background">
      {/* Bloomberg-style data ticker */}
      <TickerStrip stats={stats} />

      <SiteHeader />

      <main>
        {/* ── Value Prop Hero ─────────────────────────────────────────────────── */}
        <section className="border-b border-border/50 py-10">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                  Tech product intelligence,
                  <br />
                  <span className="text-primary">quantified.</span>
                </h1>
                <p className="mt-3 text-muted-foreground max-w-lg">
                  Signal scores, press velocity, death predictions — across{' '}
                  <span className="font-semibold text-foreground">
                    {stats.totalProducts.toLocaleString()} products
                  </span>{' '}
                  in real time.
                </p>
              </div>

              {/* Three capability callouts */}
              <div className="flex gap-4 lg:gap-6 shrink-0">
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground leading-tight">Signal<br/>Scoring</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Newspaper className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground leading-tight">Press<br/>Velocity</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-destructive" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground leading-tight">Death<br/>Prediction</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main Two-Column Layout ───────────────────────────────────────────── */}
        <section className="py-8">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-8 lg:grid-cols-12">

              {/* ── Left: Three differentiated sections ── */}
              <div className="lg:col-span-7 space-y-10">

                {/* SECTION 1 — Signal Leaders (big featured + small grid) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <h2 className="font-serif text-base font-semibold uppercase tracking-wide text-foreground/80">
                        Signal Leaders
                      </h2>
                    </div>
                    <Link
                      href="/trending"
                      className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      View all <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {heroProduct && (
                    <div className="mb-3">
                      <ProductCard product={heroProduct} variant="featured" />
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {gridProducts.slice(0, 4).map(p => (
                      <ProductCard key={p.id} product={p} variant="compact" />
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                {/* SECTION 2 — Fastest Rising (horizontal ranked list) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <h2 className="font-serif text-base font-semibold uppercase tracking-wide text-foreground/80">
                        Fastest Rising
                      </h2>
                    </div>
                    <Link
                      href="/trending"
                      className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      View all <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="space-y-1.5">
                    {trendingProducts.slice(0, 5).map((product, i) => (
                      <div key={product.id} className="flex items-center gap-3 group">
                        <span className="w-5 text-sm font-mono font-bold text-muted-foreground/40 shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <ProductCard product={product} variant="compact" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                {/* SECTION 3 — Just Launched (compact grid, no duplicate of section 1) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <h2 className="font-serif text-base font-semibold uppercase tracking-wide text-foreground/80">
                        Just Launched
                      </h2>
                    </div>
                    <Link
                      href="/new"
                      className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      View all <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {trendingProducts.slice(0, 6).map(p => (
                      <ProductCard key={p.id} product={p} variant="compact" />
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                {/* Market Pulse */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <h2 className="font-serif text-base font-semibold uppercase tracking-wide text-foreground/80">
                      Market Pulse
                    </h2>
                  </div>
                  <MarketPulse />
                </div>
              </div>

              {/* ── Right: Sticky news feed ── */}
              <div className="lg:col-span-5">
                <div className="lg:sticky lg:top-6 space-y-6">
                  <NewsFeed initialItems={recentNews} limit={8} showNewsletter={true} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Death Feed (dark section) ─────────────────────────────────────── */}
        {deadProducts.length > 0 && (
          <section className="py-12 bg-zinc-950">
            <div className="mx-auto max-w-7xl px-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <Skull className="h-5 w-5 text-zinc-400" />
                  <h2 className="font-serif text-lg font-semibold text-zinc-100">
                    Recent Casualties
                  </h2>
                </div>
                <Link
                  href="/graveyard"
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
                >
                  Full graveyard <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {deadProducts.map(product => (
                  <div
                    key={product.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {product.logo ? (
                        <img
                          src={product.logo}
                          alt={product.name}
                          className="h-8 w-8 rounded object-cover grayscale opacity-60"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-zinc-800 flex items-center justify-center">
                          <Skull className="h-4 w-4 text-zinc-600" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-300 truncate">{product.name}</p>
                        <p className="text-xs text-zinc-600 capitalize">{product.category}</p>
                      </div>
                    </div>
                    {product.description && (
                      <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <p className="mt-6 text-center text-xs text-zinc-700">
                {stats.deathsThisWeek} products flagged as dead this week
              </p>
            </div>
          </section>
        )}

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section className="py-20 bg-background">
          <div className="mx-auto max-w-4xl px-6">
            <div className="relative rounded-2xl border border-primary/20 bg-primary/5 p-10 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="relative">
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold">
                  Have a product to share?
                </h2>
                <p className="mt-3 text-muted-foreground max-w-md mx-auto text-sm">
                  Submit your product to get tracked with real-time signal analytics.
                </p>
                <div className="mt-6">
                  <Button size="lg" className="rounded-full px-8" asChild>
                    <Link href="/submit">
                      Submit Product
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
