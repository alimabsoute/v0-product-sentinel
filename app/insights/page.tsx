export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { BookOpen, ExternalLink, Clock } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getPressMentionsFeed, getPressMentionStats } from '@/lib/db/news'
import { brandTitle } from '@/lib/branding'
import { cn } from '@/lib/utils'

export const metadata = {
  title: brandTitle('Insights'),
  description: 'Market analysis, trend reports, and press coverage across tracked products.',
}

interface InsightsPageProps {
  searchParams: Promise<{
    source?: string
    days?: string
    page?: string
  }>
}

function formatRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const sentimentColors: Record<string, string> = {
  positive: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  negative: 'bg-red-100 text-red-800 border-red-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  const sp = await searchParams
  const source = sp.source ?? undefined
  const days = sp.days ? Number(sp.days) : undefined
  const page = sp.page ? Number(sp.page) : 1

  const [feed, stats] = await Promise.all([
    getPressMentionsFeed({ source, days, page, limit: 20 }),
    getPressMentionStats(),
  ])

  const topSources = stats.sourceBreakdown.slice(0, 8)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">Press &amp; Insights</h1>
          <p className="mt-2 text-muted-foreground">
            Press coverage across {stats.totalMentions.toLocaleString()} tracked mentions
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{stats.totalMentions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Mentions</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{topSources.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Sources</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center col-span-2">
            <p className="text-sm font-medium mb-2">Top Sources</p>
            <div className="flex flex-wrap gap-1 justify-center">
              {topSources.slice(0, 4).map((s) => (
                <Link
                  key={s.source}
                  href={`/insights?source=${encodeURIComponent(s.source)}`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {s.source} ({s.count})
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar filters */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Date range filter */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-medium mb-3 text-sm">Date Range</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'All', value: undefined },
                  { label: '7d', value: '7' },
                  { label: '30d', value: '30' },
                ].map((opt) => {
                  const isActive = (sp.days ?? undefined) === opt.value
                  return (
                    <Link
                      key={opt.label}
                      href={`/insights?${new URLSearchParams({
                        ...(source ? { source } : {}),
                        ...(opt.value ? { days: opt.value } : {}),
                      }).toString()}`}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary/40 text-muted-foreground',
                      )}
                    >
                      {opt.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Source filter */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-medium mb-3 text-sm">Source</h3>
              <div className="space-y-1">
                <Link
                  href={`/insights?${days ? `days=${days}` : ''}`}
                  className={cn(
                    'block w-full rounded-lg px-3 py-1.5 text-sm transition-colors',
                    !source
                      ? 'bg-secondary font-medium'
                      : 'text-muted-foreground hover:bg-secondary/60',
                  )}
                >
                  All Sources
                </Link>
                {topSources.map((s) => (
                  <Link
                    key={s.source}
                    href={`/insights?source=${encodeURIComponent(s.source)}${days ? `&days=${days}` : ''}`}
                    className={cn(
                      'flex items-center justify-between w-full rounded-lg px-3 py-1.5 text-sm transition-colors',
                      source === s.source
                        ? 'bg-secondary font-medium'
                        : 'text-muted-foreground hover:bg-secondary/60',
                    )}
                  >
                    <span className="truncate">{s.source}</span>
                    <span className="ml-2 text-xs tabular-nums opacity-60">{s.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Main feed */}
          <div className="lg:col-span-3">
            {feed.total > 0 && (
              <p className="text-sm text-muted-foreground mb-4">
                {feed.total.toLocaleString()} mention{feed.total !== 1 ? 's' : ''}
                {source ? ` from ${source}` : ''}
                {days ? ` in the last ${days} days` : ''}
              </p>
            )}

            {feed.items.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No mentions found</p>
                <p className="text-sm mt-1">Try adjusting the filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feed.items.map((item) => (
                  <a
                    key={item.id}
                    href={item.url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      {/* Product logo */}
                      {item.product_logo && (
                        <img
                          src={item.product_logo}
                          alt={item.product_name}
                          className="h-10 w-10 rounded-lg object-cover shrink-0 mt-0.5"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {item.headline}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {item.publication && (
                            <span className="font-medium text-foreground">{item.publication}</span>
                          )}
                          {item.product_name && (
                            <>
                              <span>·</span>
                              <Link
                                href={`/products/${item.product_slug}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-primary transition-colors"
                              >
                                {item.product_name}
                              </Link>
                            </>
                          )}
                          {item.mention_date && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatRelativeTime(item.mention_date)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {item.sentiment && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5 py-0',
                              sentimentColors[item.sentiment] ?? sentimentColors.neutral,
                            )}
                          >
                            {item.sentiment}
                          </Badge>
                        )}
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Pagination */}
            {feed.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                  {page > 1 ? (
                    <Link href={`/insights?${new URLSearchParams({
                      ...(source ? { source } : {}),
                      ...(days ? { days: String(days) } : {}),
                      page: String(page - 1),
                    }).toString()}`}>
                      Previous
                    </Link>
                  ) : (
                    <span>Previous</span>
                  )}
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {page} of {feed.totalPages}
                </span>

                <Button variant="outline" size="sm" disabled={page >= feed.totalPages} asChild={page < feed.totalPages}>
                  {page < feed.totalPages ? (
                    <Link href={`/insights?${new URLSearchParams({
                      ...(source ? { source } : {}),
                      ...(days ? { days: String(days) } : {}),
                      page: String(page + 1),
                    }).toString()}`}>
                      Next
                    </Link>
                  ) : (
                    <span>Next</span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
