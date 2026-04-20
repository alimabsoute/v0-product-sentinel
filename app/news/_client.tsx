'use client'

import { useState, useCallback, useTransition } from 'react'
import Link from 'next/link'
import { ExternalLink, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { NewsArchiveItem, NewsArchiveResult, NewsArchiveFilters } from '@/lib/db/news'

type SortOption = 'newest' | 'importance'

const SENTIMENT_LABELS: Record<number, { label: string; className: string }> = {
  1:  { label: 'positive', className: 'text-emerald-600' },
  0:  { label: 'neutral',  className: 'text-muted-foreground' },
  [-1]: { label: 'negative', className: 'text-red-500' },
}

function formatTime(item: NewsArchiveItem): string {
  const iso = item.metadata?.published_at ?? item.mention_date
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(diff / 86400000)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function fetchNews(filters: NewsArchiveFilters): Promise<NewsArchiveResult> {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.source) params.set('source', filters.source)
  if (filters.sentiment !== undefined) params.set('sentiment', String(filters.sentiment))
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  if (filters.sort) params.set('sort', filters.sort)
  const res = await fetch(`/api/news?${params}`)
  if (!res.ok) return { items: [], total: 0, page: 1, totalPages: 0 }
  return res.json()
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = []
  pages.push(1)
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

// ─── Row component ────────────────────────────────────────────────────────────

function NewsArchiveRow({ item, rank }: { item: NewsArchiveItem; rank: number }) {
  const title = item.metadata?.condensed_title ?? item.headline ?? 'Untitled'
  const blurb = item.metadata?.blurb ?? item.snippet ?? null
  const timeStr = formatTime(item)
  const sent = SENTIMENT_LABELS[item.sentiment as number] ?? SENTIMENT_LABELS[0]
  const importanceScore = item.metadata?.importance_score

  return (
    <li className="group flex gap-4 py-4 hover:bg-muted/30 -mx-4 px-4 rounded-lg transition-colors">
      <span className="w-7 shrink-0 pt-0.5 text-right text-sm font-mono text-muted-foreground/40 select-none tabular-nums">
        {rank}.
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <a
            href={item.url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm text-foreground leading-snug hover:text-primary transition-colors flex-1 group-hover:underline underline-offset-2 decoration-muted-foreground/30"
          >
            {title}
          </a>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="rounded bg-secondary px-1.5 py-0.5 font-medium text-foreground/60 text-[10px] uppercase tracking-wide">
            {item.publication}
          </span>

          {item.product_name && (
            <>
              <span className="opacity-30">·</span>
              <Link
                href={`/products/${item.product_slug}`}
                className="hover:text-primary transition-colors font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {item.product_name}
              </Link>
            </>
          )}

          <span className="opacity-30">·</span>
          <span className={cn('font-medium', sent.className)}>{sent.label}</span>

          {importanceScore && importanceScore >= 4 && (
            <>
              <span className="opacity-30">·</span>
              <span className="text-amber-600 font-semibold">
                {importanceScore === 5 ? '★ major' : '↑ high'}
              </span>
            </>
          )}

          <span className="opacity-30">·</span>
          <span>{timeStr}</span>
        </div>

        {blurb && (
          <p className="mt-1.5 text-xs text-muted-foreground/70 leading-relaxed line-clamp-2">
            {blurb}
          </p>
        )}
      </div>
    </li>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface NewsArchiveClientProps {
  initialData: NewsArchiveResult
  totalMentions: number
  publications: string[]
}

export function NewsArchiveClient({ initialData, totalMentions, publications }: NewsArchiveClientProps) {
  const [data, setData] = useState(initialData)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortOption>('newest')
  const [source, setSource] = useState<string | undefined>()
  const [sentiment, setSentiment] = useState<-1 | 0 | 1 | undefined>()
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()

  const load = useCallback(async (overrides: Partial<NewsArchiveFilters> = {}) => {
    setLoading(true)
    const result = await fetchNews({ page, sort, source, sentiment, limit: 50, ...overrides })
    setData(result)
    setLoading(false)
  }, [page, sort, source, sentiment])

  function applySource(s: string | undefined) {
    setSource(s)
    setPage(1)
    startTransition(() => load({ source: s, page: 1 }))
  }

  function applySort(s: SortOption) {
    setSort(s)
    setPage(1)
    startTransition(() => load({ sort: s, page: 1 }))
  }

  function applySentiment(v: -1 | 0 | 1 | undefined) {
    setSentiment(v)
    setPage(1)
    startTransition(() => load({ sentiment: v, page: 1 }))
  }

  function goPage(p: number) {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    startTransition(() => load({ page: p }))
  }

  function clearFilters() {
    setSource(undefined)
    setSentiment(undefined)
    setPage(1)
    startTransition(() => load({ source: undefined, sentiment: undefined, page: 1 }))
  }

  const hasActiveFilters = source !== undefined || sentiment !== undefined
  const offset = (page - 1) * 50

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">News Archive</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalMentions.toLocaleString()} articles · permanently stored · never deleted
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn('h-7 text-xs', source && 'border-primary/40 bg-primary/5 text-primary')}
            >
              <Filter className="mr-1.5 h-3 w-3" />
              {source ?? 'All Sources'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
            <DropdownMenuItem onClick={() => applySource(undefined)}>All Sources</DropdownMenuItem>
            {publications.map((p) => (
              <DropdownMenuItem key={p} onClick={() => applySource(p)}>
                {p}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1">
          {([undefined, 1, 0, -1] as const).map((v) => (
            <button
              key={String(v)}
              onClick={() => applySentiment(v)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                sentiment === v
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              )}
            >
              {v === undefined ? 'All' : v === 1 ? 'Positive' : v === 0 ? 'Neutral' : 'Negative'}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {(['newest', 'importance'] as const).map((s) => (
            <button
              key={s}
              onClick={() => applySort(s)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                sort === s
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              )}
            >
              {s === 'newest' ? 'Newest' : 'Top Score'}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {loading ? (
          <span className="animate-pulse">Loading…</span>
        ) : data.total === 0 ? (
          'No articles match these filters'
        ) : (
          <>
            {offset + 1}–{Math.min(offset + 50, data.total)} of {data.total.toLocaleString()} articles
          </>
        )}
      </p>

      {/* List */}
      {loading ? (
        <div className="divide-y divide-border/60">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-4 animate-pulse">
              <div className="w-6 h-4 rounded bg-muted shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <div className="py-20 text-center rounded-xl border border-dashed border-border">
          <p className="font-medium">No articles match these filters</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different source or sentiment filter</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <ol className="divide-y divide-border/60">
          {data.items.map((item, idx) => (
            <NewsArchiveRow key={item.id} item={item} rank={offset + idx + 1} />
          ))}
        </ol>
      )}

      {/* Pagination */}
      {!loading && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2 pb-4">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => goPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {getPageNumbers(page, data.totalPages).map((p, i) =>
            p === '...' ? (
              <span key={`el-${i}`} className="px-2 text-sm text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                className="h-8 w-8 p-0 text-xs"
                onClick={() => goPage(p as number)}
              >
                {p}
              </Button>
            )
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= data.totalPages}
            onClick={() => goPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
