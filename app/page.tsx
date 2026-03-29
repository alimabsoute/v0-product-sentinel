import Link from 'next/link'
import { ArrowRight, Zap, TrendingUp, Skull, Sparkles } from 'lucide-react'
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
        {/* Hero Section with Gradient Mesh */}
        <section className="relative overflow-hidden py-20 lg:py-28">
          {/* Gradient mesh background */}
          <div className="absolute inset-0 gradient-mesh" />
          
          {/* Floating decorative elements */}
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-gradient-to-tl from-primary/15 to-transparent blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-r from-primary/5 via-transparent to-primary/5 blur-3xl" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center">
              <Badge 
                variant="secondary" 
                className="mb-6 glass px-4 py-1.5 text-sm font-medium animate-fade-in-up"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
                Tracking 500+ products in real-time
              </Badge>
              
              <h1 className="max-w-4xl font-serif text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl animate-fade-in-up stagger-1">
                <span className="block">Discover what the</span>
                <span className="block mt-2">
                  internet is{' '}
                  <span className="relative">
                    <span className="relative z-10 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                      talking about
                    </span>
                    <span className="absolute bottom-2 left-0 right-0 h-3 bg-primary/10 -z-10 rounded" />
                  </span>
                </span>
              </h1>
              
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed animate-fade-in-up stagger-2">
                Real-time social buzz monitoring for products and tools. 
                Track trends, discover rising stars, and see what&apos;s fading away.
              </p>
              
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-in-up stagger-3">
                <Button asChild size="lg" className="h-12 px-8 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  <Link href="/products">
                    Browse Products
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-xl glass hover:bg-white/80 transition-all">
                  <Link href="/explore">
                    Explore the Graph
                  </Link>
                </Button>
              </div>

              {/* Stats row */}
              <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4 animate-fade-in-up stagger-4">
                {[
                  { value: '500+', label: 'Products tracked' },
                  { value: '24/7', label: 'Live monitoring' },
                  { value: '50K+', label: 'Data points daily' },
                  { value: '9', label: 'Categories' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-3xl font-bold tabular-nums text-foreground">{stat.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="relative py-16">
          {/* Section separator gradient */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Left Column - Featured Products & Market Pulse */}
              <div className="lg:col-span-7 space-y-8">
                {/* Featured Article */}
                {latestArticle && (
                  <div className="animate-fade-in-up">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="font-serif text-xl font-semibold">Latest Insight</h2>
                      <Link
                        href="/insights"
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        All insights
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                    <div className="glass rounded-2xl p-1">
                      <ArticleCard article={latestArticle} variant="featured" />
                    </div>
                  </div>
                )}

                {/* Market Pulse */}
                <div className="animate-fade-in-up stagger-1">
                  <MarketPulse />
                </div>

                {/* Quick Stats */}
                <div className="glass rounded-2xl p-5 animate-fade-in-up stagger-2">
                  <h3 className="font-medium text-muted-foreground">Platform Overview</h3>
                  <div className="mt-4 grid grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-xl bg-secondary/50">
                      <p className="text-2xl font-bold tabular-nums">{products.filter(p => p.status === 'active').length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Active</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-secondary/50">
                      <p className="text-2xl font-bold tabular-nums">{deadProducts.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Graveyard</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-secondary/50">
                      <p className="text-2xl font-bold tabular-nums">9</p>
                      <p className="text-xs text-muted-foreground mt-1">Categories</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-secondary/50">
                      <p className="text-2xl font-bold tabular-nums text-[var(--sentinel-rising)]">24/7</p>
                      <p className="text-xs text-muted-foreground mt-1">Monitoring</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Live News Feed */}
              <div className="lg:col-span-5">
                <div className="lg:sticky lg:top-24 animate-fade-in-up stagger-2">
                  <NewsFeed limit={6} showNewsletter={true} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="relative py-16">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-secondary/50 to-secondary/30" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-semibold">Featured Today</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hand-picked products making waves right now
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-xl glass">
                <Link href="/products">
                  View all products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product, i) => (
                <div 
                  key={product.id} 
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <ProductCard product={product} variant="featured" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trending & Graveyard */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Trending */}
              <div className="glass rounded-2xl p-6">
                <div className="mb-6 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sentinel-rising)]/10">
                    <TrendingUp className="h-5 w-5 text-[var(--sentinel-rising)]" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-semibold">Trending This Week</h2>
                    <p className="text-sm text-muted-foreground">Most discussed products</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {trendingProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-3 group">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
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
              <div className="glass rounded-2xl p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sentinel-dead)]/10">
                      <Skull className="h-5 w-5 text-[var(--sentinel-dead)]" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl font-semibold">Product Graveyard</h2>
                      <p className="text-sm text-muted-foreground">Learn from the past</p>
                    </div>
                  </div>
                  <Link
                    href="/graveyard"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {deadProducts.map((product) => (
                    <ProductCard key={product.id} product={product} variant="compact" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* More Insights */}
        <section className="relative py-16">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-semibold">Market Insights</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Analysis, comparisons, and trend reports
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-xl glass">
                <Link href="/insights">
                  All articles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recentArticles.map((article, i) => (
                <div 
                  key={article.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <ArticleCard article={article} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/90 p-10 text-center text-primary-foreground sm:p-16">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              
              <div className="relative">
                <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
                  Have a product to share?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 text-lg">
                  Submit your product to get tracked on Product Sentinel. 
                  Verified products get featured placement and enhanced analytics.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Button variant="secondary" size="lg" className="h-12 px-8 rounded-xl shadow-lg" asChild>
                    <Link href="/submit">Submit a Product</Link>
                  </Button>
                  <Button variant="ghost" size="lg" className="h-12 px-8 rounded-xl text-primary-foreground hover:text-primary-foreground hover:bg-white/10" asChild>
                    <Link href="/signup">Create an Account</Link>
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
