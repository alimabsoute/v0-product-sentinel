import Link from 'next/link'
import { ArrowRight, BookOpen, TrendingUp, BarChart3 } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ArticleCard } from '@/components/article-card'
import { Badge } from '@/components/ui/badge'
import { articles } from '@/lib/mock-data'
import { brandTitle } from '@/lib/branding'

export const metadata = {
  title: brandTitle('Insights'),
  description: 'Market analysis, trend reports, and in-depth product comparisons.',
}

export default function InsightsPage() {
  const featuredArticle = articles[0]
  const trendReports = articles.filter(a => a.type === 'trend-report')
  const comparisons = articles.filter(a => a.type === 'comparison')
  const deepDives = articles.filter(a => a.type === 'deep-dive')
  const recentArticles = articles.slice(1, 7)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">Insights</h1>
          <p className="mt-2 text-muted-foreground">
            Market analysis, trend reports, and in-depth product comparisons
          </p>
        </div>

        {/* Featured */}
        {featuredArticle && (
          <div className="mb-12">
            <ArticleCard article={featuredArticle} variant="featured" />
          </div>
        )}

        {/* Content Types */}
        <div className="grid gap-8 lg:grid-cols-3 mb-12">
          {/* Trend Reports */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--sentinel-rising)]/10">
                <TrendingUp className="h-4 w-4 text-[var(--sentinel-rising)]" />
              </div>
              <h2 className="font-semibold">Trend Reports</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Weekly and monthly analysis of what&apos;s trending across categories
            </p>
            <div className="space-y-2">
              {trendReports.slice(0, 3).map(article => (
                <Link
                  key={article.id}
                  href={`/insights/${article.slug}`}
                  className="block text-sm hover:text-primary transition-colors"
                >
                  {article.title}
                </Link>
              ))}
            </div>
            {trendReports.length > 3 && (
              <Link
                href="/insights?type=trend-report"
                className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                View all {trendReports.length} reports
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* Comparisons */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-semibold">Comparisons</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Head-to-head product comparisons with detailed breakdowns
            </p>
            <div className="space-y-2">
              {comparisons.slice(0, 3).map(article => (
                <Link
                  key={article.id}
                  href={`/insights/${article.slug}`}
                  className="block text-sm hover:text-primary transition-colors"
                >
                  {article.title}
                </Link>
              ))}
            </div>
            {comparisons.length > 3 && (
              <Link
                href="/insights?type=comparison"
                className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                View all {comparisons.length} comparisons
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* Deep Dives */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--sentinel-stable)]/10">
                <BookOpen className="h-4 w-4 text-[var(--sentinel-stable)]" />
              </div>
              <h2 className="font-semibold">Deep Dives</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              In-depth analysis of specific products and market segments
            </p>
            <div className="space-y-2">
              {deepDives.slice(0, 3).map(article => (
                <Link
                  key={article.id}
                  href={`/insights/${article.slug}`}
                  className="block text-sm hover:text-primary transition-colors"
                >
                  {article.title}
                </Link>
              ))}
            </div>
            {deepDives.length > 3 && (
              <Link
                href="/insights?type=deep-dive"
                className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                View all {deepDives.length} deep dives
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Recent Articles Grid */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold">Recent Articles</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentArticles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
