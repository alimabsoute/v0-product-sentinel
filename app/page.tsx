import Link from 'next/link'
import { ArrowRight, Zap, TrendingUp, Skull } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductCard } from '@/components/product-card'
import { NewsFeed } from '@/components/news-feed'
import { MarketPulse } from '@/components/market-pulse'
import { ArticleCard } from '@/components/article-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
        {/* Hero Section */}
        <section className="border-b border-border bg-secondary/20 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center">
              <Badge variant="secondary" className="mb-4">
                <Zap className="mr-1 h-3 w-3" />
                Tracking 500+ products
              </Badge>
              <h1 className="max-w-3xl font-serif text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Discover what the internet is{' '}
                <span className="text-primary">talking about</span>
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                Real-time social buzz monitoring for products and tools. 
                Track trends, discover rising stars, and see what&apos;s fading away.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Button asChild size="lg">
                  <Link href="/products">
                    Browse Products
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/explore">
                    Explore the Graph
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Left Column - Featured Products & Market Pulse */}
              <div className="lg:col-span-7 space-y-8">
                {/* Featured Article */}
                {latestArticle && (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="font-serif text-xl font-semibold">Latest Insight</h2>
                      <Link
                        href="/insights"
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                      >
                        All insights
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                    <ArticleCard article={latestArticle} variant="featured" />
                  </div>
                )}

                {/* Market Pulse */}
                <MarketPulse />

                {/* Quick Stats */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="font-medium text-muted-foreground">Platform Stats</h3>
                  <div className="mt-4 grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-2xl font-bold tabular-nums">{products.filter(p => p.status === 'active').length}</p>
                      <p className="text-xs text-muted-foreground">Active products</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums">{deadProducts.length}</p>
                      <p className="text-xs text-muted-foreground">In graveyard</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums">9</p>
                      <p className="text-xs text-muted-foreground">Categories</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums">24/7</p>
                      <p className="text-xs text-muted-foreground">Monitoring</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Live News Feed (prominently displayed) */}
              <div className="lg:col-span-5">
                <div className="lg:sticky lg:top-4">
                  <NewsFeed limit={6} showNewsletter={true} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="border-t border-border bg-secondary/10 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-semibold">Featured Today</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hand-picked products making waves right now
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/products">
                  View all products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} variant="featured" />
              ))}
            </div>
          </div>
        </section>

        {/* Trending & Rising */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Trending */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[var(--sentinel-rising)]" />
                  <h2 className="font-serif text-xl font-semibold">Trending This Week</h2>
                </div>
                <div className="space-y-2">
                  {trendingProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <ProductCard product={product} variant="compact" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graveyard Preview */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skull className="h-5 w-5 text-[var(--sentinel-dead)]" />
                    <h2 className="font-serif text-xl font-semibold">Product Graveyard</h2>
                  </div>
                  <Link
                    href="/graveyard"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Products that have been discontinued or sunset. Learn from the past.
                </p>
                <div className="space-y-2">
                  {deadProducts.map((product) => (
                    <ProductCard key={product.id} product={product} variant="compact" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* More Insights */}
        <section className="border-t border-border bg-secondary/10 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-semibold">Market Insights</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Analysis, comparisons, and trend reports
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/insights">
                  All articles
                  <ArrowRight className="ml-2 h-4 w-4" />
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

        {/* CTA Section */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-primary p-8 text-center text-primary-foreground sm:p-12">
              <h2 className="font-serif text-2xl font-semibold sm:text-3xl">
                Have a product to share?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
                Submit your product to get tracked on Product Sentinel. 
                Verified products get featured placement and enhanced analytics.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/submit">Submit a Product</Link>
                </Button>
                <Button variant="ghost" size="lg" className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10" asChild>
                  <Link href="/signup">Create an Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
