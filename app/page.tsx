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

export default function HomePage() {
  const featuredProducts = getFeaturedProducts(4)
  const trendingProducts = getTrendingProducts(5)
  const deadProducts = getDeadProducts().slice(0, 3)
  const recentArticles = articles.slice(0, 3)
  const latestArticle = articles[0]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        {/* Hero - Clean & Minimal */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          {/* Subtle gradient orbs */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[80px]" />
          
          <div className="relative mx-auto max-w-5xl px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 text-sm text-muted-foreground mb-8 animate-fade-in-up">
              <Activity className="h-4 w-4 text-primary" />
              <span>Tracking 500+ products in real-time</span>
            </div>
            
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1] animate-fade-in-up stagger-1">
              Discover what&apos;s
              <br />
              <span className="text-primary">gaining momentum</span>
            </h1>
            
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up stagger-2">
              Real-time social buzz tracking for products and tools. 
              See what&apos;s rising, what&apos;s fading, and what people are saying.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up stagger-3">
              <Button asChild size="lg" className="h-12 px-8 rounded-full text-base">
                <Link href="/products">
                  Explore Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="h-12 px-8 rounded-full text-base text-muted-foreground">
                <Link href="/explore">
                  View Graph
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <section className="py-12 border-t border-border/50">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Left - Content */}
              <div className="lg:col-span-7 space-y-10">
                {/* Latest Insight */}
                {latestArticle && (
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-serif text-xl font-semibold">Latest Insight</h2>
                      <Link
                        href="/insights"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        All insights <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <ArticleCard article={latestArticle} variant="featured" />
                  </div>
                )}

                {/* Market Pulse */}
                <MarketPulse />

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { value: products.filter(p => p.status === 'active').length, label: 'Active' },
                    { value: deadProducts.length, label: 'Graveyard' },
                    { value: 9, label: 'Categories' },
                    { value: '24/7', label: 'Monitoring', highlight: true },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center py-4 px-3 rounded-2xl bg-secondary/50">
                      <p className={`text-2xl font-semibold tabular-nums ${stat.highlight ? 'text-primary' : ''}`}>
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - News Feed */}
              <div className="lg:col-span-5">
                <div className="lg:sticky lg:top-24">
                  <NewsFeed limit={6} showNewsletter={true} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 bg-secondary/30">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-serif text-2xl font-semibold">Featured Today</h2>
                <p className="text-muted-foreground mt-1">Products making waves right now</p>
              </div>
              <Button asChild variant="ghost" className="text-muted-foreground">
                <Link href="/products">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} variant="featured" />
              ))}
            </div>
          </div>
        </section>

        {/* Trending & Graveyard */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Trending */}
              <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-[var(--sentinel-rising)]/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-[var(--sentinel-rising)]" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-semibold">Trending This Week</h2>
                    <p className="text-sm text-muted-foreground">Most discussed</p>
                  </div>
                </div>
                <div className="space-y-1">
                  {trendingProducts.map((product, i) => (
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

              {/* Graveyard */}
              <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[var(--sentinel-dead)]/10 flex items-center justify-center">
                      <Skull className="h-5 w-5 text-[var(--sentinel-dead)]" />
                    </div>
                    <div>
                      <h2 className="font-serif text-lg font-semibold">Product Graveyard</h2>
                      <p className="text-sm text-muted-foreground">Learn from the past</p>
                    </div>
                  </div>
                  <Link
                    href="/graveyard"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View all
                  </Link>
                </div>
                <div className="space-y-1">
                  {deadProducts.map((product) => (
                    <ProductCard key={product.id} product={product} variant="compact" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Insights */}
        <section className="py-16 border-t border-border/50">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-serif text-2xl font-semibold">Market Insights</h2>
                <p className="text-muted-foreground mt-1">Analysis and trend reports</p>
              </div>
              <Button asChild variant="ghost" className="text-muted-foreground">
                <Link href="/insights">
                  All articles <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recentArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="relative rounded-3xl bg-primary p-12 text-center text-primary-foreground overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.08),transparent_50%)]" />
              
              <div className="relative">
                <Sparkles className="h-8 w-8 mx-auto mb-4 opacity-80" />
                <h2 className="font-serif text-3xl font-semibold">
                  Have a product to share?
                </h2>
                <p className="mt-3 text-primary-foreground/70 max-w-md mx-auto">
                  Submit your product to get tracked on Product Sentinel with enhanced analytics.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Button variant="secondary" size="lg" className="rounded-full px-8" asChild>
                    <Link href="/submit">Submit Product</Link>
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
