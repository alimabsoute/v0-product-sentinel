export const revalidate = 300  // revalidate every 5 minutes

import Link from 'next/link'
import { ArrowRight, TrendingUp, Skull, Sparkles, BarChart3 } from 'lucide-react'
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
} from '@/lib/db/products'
import { getRecentPressMentions } from '@/lib/db/news'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const [featuredProducts, trendingProducts, deadProducts, recentNews] = await Promise.all([
    getFeaturedProducts(6),
    getTrendingProducts(6),
    getDeadProducts(3),
    getRecentPressMentions(10),
  ])
  const latestArticle = null // articles ingestion is Day 7

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        {/* Compact Hero */}
        <section className="relative pt-8 pb-8 overflow-hidden">
          <div className="relative mx-auto max-w-7xl px-6">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
              What&apos;s trending
              <span className="text-primary"> now</span>
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl text-sm">
              Real-time buzz tracking. See what&apos;s rising in tech and product.
            </p>
          </div>
        </section>

        {/* Main Content - Two Column Layout */}
        <section className="py-8">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Left Column - Products & Content */}
              <div className="lg:col-span-7 space-y-8">
                
                {/* HOTTEST RIGHT NOW - SECTION 1 */}
                <div className="relative">
                  {/* Colored background with gradient */}
                  <div className="absolute inset-0 -mx-6 bg-gradient-to-br from-[hsl(var(--section-blue))] to-blue-50/30 rounded-2xl -z-10" />
                  <div className="relative px-6 py-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[var(--sentinel-rising)] animate-pulse" />
                        <h2 className="font-serif text-lg font-semibold">Hottest Right Now</h2>
                      </div>
                      <Link
                        href="/trending"
                        className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        View all <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {featuredProducts.slice(0, 3).map((product, i) => (
                        <div key={product.id} className="animate-fade-in-up stagger-{i+1}">
                          <ProductCard product={product} variant="featured" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Liquid Glass Separator - Blue to Purple */}
                <div className="relative h-12 flex items-center">
                  <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                  <div className="absolute -inset-x-12 h-20 bg-gradient-to-b from-blue-400/5 via-purple-500/5 to-transparent blur-3xl rounded-full" />
                </div>

                {/* ADDED TODAY - SECTION 2 */}
                <div className="relative">
                  {/* Purple gradient background */}
                  <div className="absolute inset-0 -mx-6 bg-gradient-to-br from-[hsl(var(--section-purple))] to-purple-50/30 rounded-2xl -z-10" />
                  <div className="relative px-6 py-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <h2 className="font-serif text-lg font-semibold">Added Today</h2>
                      </div>
                      <Link
                        href="/new"
                        className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        View all <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {trendingProducts.slice(0, 3).map((product, i) => (
                        <div key={product.id} className="animate-fade-in-up stagger-{i+1}">
                          <ProductCard product={product} variant="featured" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Liquid Glass Separator - Purple to Emerald */}
                <div className="relative h-12 flex items-center">
                  <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
                  <div className="absolute -inset-x-12 h-20 bg-gradient-to-b from-purple-400/5 via-emerald-500/5 to-transparent blur-3xl rounded-full" />
                </div>

                {/* MORE TRENDING - SECTION 3 */}
                <div className="relative">
                  {/* Emerald gradient background */}
                  <div className="absolute inset-0 -mx-6 bg-gradient-to-br from-[hsl(var(--section-emerald))] to-emerald-50/30 rounded-2xl -z-10" />
                  <div className="relative px-6 py-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-accent" />
                        <h2 className="font-serif text-lg font-semibold">More Trending</h2>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {featuredProducts.slice(3, 6).map((product, i) => (
                        <div key={product.id} className="animate-fade-in-up stagger-{i+1}">
                          <ProductCard product={product} variant="featured" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Liquid Glass Separator - Emerald to Amber */}
                <div className="relative h-12 flex items-center">
                  <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                  <div className="absolute -inset-x-12 h-20 bg-gradient-to-b from-emerald-400/5 via-amber-500/5 to-transparent blur-3xl rounded-full" />
                </div>

                {/* LATEST INSIGHT ARTICLE - SECTION 4 */}
                {latestArticle && (
                  <div className="relative">
                    <div className="absolute inset-0 -mx-6 bg-gradient-to-br from-[hsl(var(--section-amber))] to-amber-50/30 rounded-2xl -z-10" />
                    <div className="relative px-6 py-6">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="h-2 w-2 rounded-full bg-amber-600" />
                        <h2 className="font-serif text-lg font-semibold">Latest Insight</h2>
                      </div>
                      <ArticleCard article={latestArticle} variant="featured" />
                    </div>
                  </div>
                )}

                {/* Liquid Glass Separator - Amber back to Blue */}
                <div className="relative h-12 flex items-center">
                  <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                  <div className="absolute -inset-x-12 h-20 bg-gradient-to-b from-amber-400/5 via-blue-400/5 to-transparent blur-3xl rounded-full" />
                </div>

                {/* MARKET PULSE - ANALYTICS SECTION */}
                <div className="relative">
                  <div className="absolute inset-0 -mx-6 bg-gradient-to-br from-blue-50 to-indigo-50/20 rounded-2xl -z-10" />
                  <div className="relative px-6 py-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-serif font-semibold">Market Pulse</h2>
                        <p className="text-xs text-muted-foreground">Category trends & analytics</p>
                      </div>
                    </div>
                    <MarketPulse />
                  </div>
                </div>
              </div>

              {/* Right Column - Live Stream (Sticky) */}
              <div className="lg:col-span-5">
                <div className="lg:sticky lg:top-6 space-y-6">
                  <NewsFeed initialItems={recentNews} limit={8} showNewsletter={true} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Below Fold - Two Column Grid */}
        <section className="py-16 bg-gradient-to-b from-background to-secondary/10">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Trending This Week */}
              <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-blue-50 to-blue-50/30 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-lg bg-[var(--sentinel-rising)]/15 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-[var(--sentinel-rising)]" />
                  </div>
                  <div>
                    <h2 className="font-serif font-semibold">Trending This Week</h2>
                    <p className="text-xs text-muted-foreground">Most discussed</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {trendingProducts.slice(0, 5).map((product, i) => (
                    <div key={product.id} className="flex items-center gap-3 group">
                      <span className="w-6 text-sm font-semibold text-primary/50">
                        #{i + 1}
                      </span>
                      <div className="flex-1">
                        <ProductCard product={product} variant="compact" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Graveyard */}
              <div className="rounded-2xl border border-destructive/10 bg-gradient-to-br from-red-50 to-red-50/30 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-lg bg-destructive/15 flex items-center justify-center">
                    <Skull className="h-5 w-5 text-destructive" />
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
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="relative rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 p-12 text-center text-primary-foreground overflow-hidden">
              {/* Liquid glass effects */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/3 w-56 h-56 bg-white/5 rounded-full blur-2xl" />
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
