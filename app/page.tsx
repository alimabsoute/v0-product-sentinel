'use client'

import Link from 'next/link'
import { ArrowRight, TrendingUp, Skull, Sparkles, Activity } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductCard } from '@/components/product-card'
import { NewsFeed } from '@/components/news-feed'
import { MarketPulse } from '@/components/market-pulse'
import { ArticleCard } from '@/components/article-card'
import { Button } from '@/components/ui/button'
import {
  getFeaturedProducts,
  getTrendingProducts,
  getDeadProducts,
  articles,
  products,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const trendingProducts = getTrendingProducts(6).slice(0, 6)
  const newProductsToday = products.filter(p => p.status === 'active').slice(0, 6)
  const latestArticle = articles[0]
  const deadProducts = getDeadProducts().slice(0, 3)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        {/* Compact Hero - Minimal Space */}
        <section className="relative pt-8 pb-12 overflow-hidden border-b border-border/30">
          <div className="relative mx-auto max-w-7xl px-6">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
              What&apos;s trending
              <span className="text-primary"> now</span>
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Real-time buzz tracking. See what&apos;s rising in tech and product.
            </p>
          </div>
        </section>

        {/* Main Content - Two Column Layout */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-10 lg:grid-cols-12">
              {/* Left Column - Trending & New Products + Content */}
              <div className="lg:col-span-7 space-y-8">
                
                {/* TRENDING PRODUCTS - TOP ROW */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-8 bg-[var(--sentinel-rising)] rounded-full" />
                      <h2 className="font-serif text-lg font-semibold">Hottest Right Now</h2>
                    </div>
                    <Link
                      href="/trending"
                      className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      View all
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  
                  {/* Liquid glass separator - decorative blur shape */}
                  <div className="relative mb-4">
                    <div className="absolute -inset-x-12 -top-6 h-20 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-full blur-3xl" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {trendingProducts.slice(0, 3).map((product) => (
                      <ProductCard key={product.id} product={product} variant="featured" />
                    ))}
                  </div>
                </div>

                {/* NEW TODAY - SECOND ROW */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-8 bg-primary rounded-full" />
                      <h2 className="font-serif text-lg font-semibold">Added Today</h2>
                    </div>
                    <Link
                      href="/new"
                      className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      View all
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {/* Liquid glass separator */}
                  <div className="relative mb-4">
                    <div className="absolute -inset-x-12 -top-6 h-20 bg-gradient-to-r from-transparent via-primary/3 to-transparent rounded-full blur-3xl" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {newProductsToday.slice(0, 3).map((product) => (
                      <ProductCard key={product.id} product={product} variant="featured" />
                    ))}
                  </div>
                </div>

                {/* MORE TRENDING - THIRD ROW */}
                <div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {trendingProducts.slice(3, 6).map((product) => (
                      <ProductCard key={product.id} product={product} variant="featured" />
                    ))}
                  </div>
                </div>

                {/* Glass Divider */}
                <div className="relative h-20 flex items-center">
                  <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                  <div className="absolute inset-x-0 h-16 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent blur-2xl rounded-full" />
                </div>

                {/* LATEST INSIGHT ARTICLE */}
                {latestArticle && (
                  <div>
                    <div className="flex items-center gap-2 mb-5">
                      <div className="h-1 w-8 bg-primary/60 rounded-full" />
                      <h2 className="font-serif text-lg font-semibold">Latest Insight</h2>
                    </div>
                    <ArticleCard article={latestArticle} variant="featured" />
                  </div>
                )}

                {/* Market Pulse */}
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="h-1 w-8 bg-primary/40 rounded-full" />
                    <h2 className="font-serif text-lg font-semibold">Market Pulse</h2>
                  </div>
                  <MarketPulse />
                </div>
              </div>

              {/* Right Column - Live Stream (Sticky) */}
              <div className="lg:col-span-5">
                <div className="lg:sticky lg:top-6 space-y-6">
                  <NewsFeed limit={8} showNewsletter={true} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* More Trending - Below fold */}
        <section className="py-16 border-t border-border/30">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Trending This Week */}
              <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-white to-secondary/20 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-lg bg-[var(--sentinel-rising)]/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-[var(--sentinel-rising)]" />
                  </div>
                  <div>
                    <h2 className="font-serif font-semibold">Trending This Week</h2>
                    <p className="text-xs text-muted-foreground">Most discussed</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {getTrendingProducts(5).map((product, i) => (
                    <div key={product.id} className="flex items-center gap-3 group">
                      <span className="w-6 text-sm font-medium text-muted-foreground text-right">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <ProductCard product={product} variant="compact" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Graveyard */}
              <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-white to-secondary/20 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-lg bg-[var(--sentinel-dead)]/10 flex items-center justify-center">
                    <Skull className="h-5 w-5 text-[var(--sentinel-dead)]" />
                  </div>
                  <div>
                    <h2 className="font-serif font-semibold">Graveyard</h2>
                    <p className="text-xs text-muted-foreground">Lessons learned</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {deadProducts.map((product) => (
                    <ProductCard key={product.id} product={product} variant="compact" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 border-t border-border/30">
          <div className="mx-auto max-w-4xl px-6">
            <div className="relative rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/90 p-12 text-center text-primary-foreground overflow-hidden">
              {/* Liquid glass effect background */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
              </div>
              
              <div className="relative">
                <Sparkles className="h-8 w-8 mx-auto mb-4 opacity-80" />
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
                  Have a product to share?
                </h2>
                <p className="mt-4 text-primary-foreground/80 max-w-lg mx-auto">
                  Submit your product to get tracked with real-time buzz analytics.
                </p>
                <div className="mt-8 flex justify-center gap-3">
                  <Button variant="secondary" size="lg" className="rounded-full px-8" asChild>
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
