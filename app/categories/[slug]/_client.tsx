'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ProductCard } from '@/components/product-card'
import {
  Filter,
  SortAsc,
  Grid3X3,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
} from 'lucide-react'
import type { CategoryStats } from './page'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/mock-data'

// Hardcoded historical context per category slug (static content, no DB needed)
const categoryHistory: Record<string, {
  years: { year: number; productCount: number; avgBuzz: number; topTrend: string }[]
  characteristics: { name: string; trend: 'rising' | 'falling' | 'stable'; percentage: number }[]
  notableEvents: { date: string; event: string }[]
}> = {
  'ai-tools': {
    years: [
      { year: 2022, productCount: 156, avgBuzz: 340, topTrend: 'Image Generation' },
      { year: 2023, productCount: 412, avgBuzz: 890, topTrend: 'ChatGPT Wrappers' },
      { year: 2024, productCount: 687, avgBuzz: 720, topTrend: 'AI Agents' },
      { year: 2025, productCount: 890, avgBuzz: 650, topTrend: 'Multi-Modal AI' },
    ],
    characteristics: [
      { name: 'Multi-modal', trend: 'rising', percentage: 68 },
      { name: 'Agent-capable', trend: 'rising', percentage: 52 },
      { name: 'Self-hosted option', trend: 'rising', percentage: 34 },
      { name: 'Enterprise focus', trend: 'stable', percentage: 41 },
    ],
    notableEvents: [
      { date: 'Nov 2022', event: 'ChatGPT launches, sparking AI tool explosion' },
      { date: 'Mar 2023', event: 'GPT-4 released, capabilities leap forward' },
      { date: 'Feb 2024', event: 'Agent frameworks gain mainstream adoption' },
    ],
  },
  'dev-tools': {
    years: [
      { year: 2022, productCount: 298, avgBuzz: 290, topTrend: 'Edge Computing' },
      { year: 2023, productCount: 345, avgBuzz: 420, topTrend: 'AI Code Assistants' },
      { year: 2024, productCount: 389, avgBuzz: 380, topTrend: 'AI-Native IDEs' },
      { year: 2025, productCount: 412, avgBuzz: 340, topTrend: 'Vibe Coding' },
    ],
    characteristics: [
      { name: 'AI-assisted', trend: 'rising', percentage: 72 },
      { name: 'Open source', trend: 'stable', percentage: 45 },
      { name: 'Cloud-native', trend: 'stable', percentage: 88 },
      { name: 'TypeScript support', trend: 'rising', percentage: 91 },
    ],
    notableEvents: [
      { date: 'Jun 2021', event: 'GitHub Copilot preview launches' },
      { date: 'Mar 2023', event: 'AI coding assistants become mainstream' },
    ],
  },
}

type SortOption = 'newest' | 'az'
type ViewMode = 'grid' | 'list'

const LIMIT = 50

// ─── Era chip definitions ────────────────────────────────────────────────────

type EraKey = 'all' | 'pioneer' | 'growth' | 'boom' | 'now'

const ERA_CHIPS: { key: EraKey; label: string }[] = [
  { key: 'all',     label: 'All' },
  { key: 'pioneer', label: 'Pioneer (–2014)' },
  { key: 'growth',  label: 'Growth (15–19)' },
  { key: 'boom',    label: 'Boom (20–22)' },
  { key: 'now',     label: 'Now (23+)' },
]

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: CategoryStats }) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="rounded-xl border bg-card p-4">
        <div className="text-xs font-mono uppercase text-muted-foreground tracking-wide">Products</div>
        <div className="text-2xl font-mono font-semibold mt-1">{stats.total.toLocaleString()}</div>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <div className="text-xs font-mono uppercase text-muted-foreground tracking-wide">Launched 2023+</div>
        <div className="text-2xl font-mono font-semibold mt-1">{stats.recentCount.toLocaleString()}</div>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <div className="text-xs font-mono uppercase text-muted-foreground tracking-wide">Avg Signal</div>
        <div className="text-2xl font-mono font-semibold mt-1">
          {stats.avgSignal !== null ? stats.avgSignal.toFixed(1) : '—'}
        </div>
      </div>
    </div>
  )
}

// ─── Era chips (reads/writes ?era= URL param) ─────────────────────────────────

function EraChips() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentEra = (searchParams.get('era') ?? 'all') as EraKey

  function setEra(key: EraKey) {
    const params = new URLSearchParams(searchParams.toString())
    if (key === 'all') {
      params.delete('era')
    } else {
      params.set('era', key)
    }
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }

  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {ERA_CHIPS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setEra(key)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-mono border transition-colors',
            currentEra === key
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ─── Sub-category pills ───────────────────────────────────────────────────────

function SubCategoryPills({ subCategories, active, onChange }: {
  subCategories: string[]
  active: string | null
  onChange: (v: string | null) => void
}) {
  if (subCategories.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      <button
        onClick={() => onChange(null)}
        className={cn(
          'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
          active === null
            ? 'bg-secondary text-secondary-foreground border-transparent'
            : 'bg-card text-muted-foreground border-border hover:border-primary/40',
        )}
      >
        All
      </button>
      {subCategories.map(sub => (
        <button
          key={sub}
          onClick={() => onChange(sub)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
            active === sub
              ? 'bg-secondary text-secondary-foreground border-transparent'
              : 'bg-card text-muted-foreground border-border hover:border-primary/40',
          )}
        >
          {sub.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </button>
      ))}
    </div>
  )
}

// ─── Main client ──────────────────────────────────────────────────────────────

interface CategoryClientProps {
  slug: string
  displayName: string
  initialProducts: Product[]
  totalCount: number
  totalPages: number
  stats: CategoryStats
  subCategories: string[]
}

export function CategoryClient({
  slug,
  displayName,
  initialProducts,
  totalCount,
  totalPages: initialTotalPages,
  stats,
  subCategories,
}: CategoryClientProps) {
  const searchParams = useSearchParams()
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showHistory, setShowHistory] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'dead'>('active')
  const [activeSubCat, setActiveSubCat] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [total, setTotal] = useState(totalCount)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [loading, setLoading] = useState(false)

  const era = searchParams.get('era') ?? ''

  const history = categoryHistory[slug]

  // Fetch when filters/sort/page change (skip initial load)
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        category: slug,
        sort: sortBy === 'az' ? 'az' : 'newest',
        page: String(page),
        limit: String(LIMIT),
        status: statusFilter,
        ...(activeSubCat ? { sub_category: activeSubCat } : {}),
        ...(era ? { era } : {}),
      })
      const res = await fetch(`/api/products/search?${params}`)
      const data = await res.json()
      setProducts(data.products ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 0)
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false)
    }
  }, [slug, sortBy, page, statusFilter, activeSubCat, era])

  // Re-fetch on filter/sort/page change (but not on initial mount)
  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    if (!initialized) {
      setInitialized(true)
      return
    }
    fetchProducts()
  }, [fetchProducts, initialized])

  // Reset page on filter/sort/subcat/era change
  useEffect(() => {
    setPage(1)
  }, [statusFilter, sortBy, activeSubCat, era])

  const activeCount = statusFilter === 'active' ? total : null
  const deadCount = statusFilter === 'dead' ? total : null

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
        <span>/</span>
        <span>{displayName}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-4xl font-medium">{displayName}</h1>
      </div>

      {/* Stats bar */}
      <StatsBar stats={stats} />

      {/* Era chips */}
      <EraChips />

      {/* Sub-category pills */}
      <SubCategoryPills
        subCategories={subCategories}
        active={activeSubCat}
        onChange={setActiveSubCat}
      />

      {/* Historical Section */}
      {history && showHistory && (
        <div className="mb-10 bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl">Category Evolution</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)} className="text-muted-foreground">
              Hide
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {history.years.map((yearData, i) => {
              const prev = history.years[i - 1]
              const change = prev
                ? (((yearData.productCount - prev.productCount) / prev.productCount) * 100).toFixed(0)
                : null
              return (
                <div key={yearData.year} className="p-4 bg-secondary/50 rounded-lg text-center">
                  <div className="text-lg font-medium mb-1">{yearData.year}</div>
                  <div className="text-2xl font-serif text-primary">{yearData.productCount}</div>
                  <div className="text-xs text-muted-foreground mb-2">products</div>
                  {change && (
                    <div className={cn('text-xs', Number(change) > 0 ? 'text-green-600' : 'text-red-600')}>
                      {Number(change) > 0 ? '+' : ''}{change}%
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2 truncate">{yearData.topTrend}</div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Current Characteristics</h3>
              <div className="space-y-3">
                {history.characteristics.map((char) => (
                  <div key={char.name} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{char.name}</span>
                        <span className="text-sm text-muted-foreground">{char.percentage}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            char.trend === 'rising' && 'bg-green-500',
                            char.trend === 'falling' && 'bg-red-400',
                            char.trend === 'stable' && 'bg-primary',
                          )}
                          style={{ width: `${char.percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      char.trend === 'rising' && 'bg-green-500/10 text-green-600',
                      char.trend === 'falling' && 'bg-red-500/10 text-red-600',
                      char.trend === 'stable' && 'bg-muted text-muted-foreground',
                    )}>
                      {char.trend}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Notable Events</h3>
              <div className="space-y-3">
                {history.notableEvents.map((event, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-20 text-sm text-muted-foreground shrink-0">{event.date}</div>
                    <div className="text-sm">{event.event}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {statusFilter === 'all' ? 'All Products' : statusFilter === 'active' ? 'Active Only' : 'Dead Only'}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Products</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')}>Active Only</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('dead')}>Dead Only</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SortAsc className="h-4 w-4" />
                Sort: {sortBy === 'newest' ? 'Newest' : 'Name A-Z'}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('newest')}>Newest First</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('az')}>Name A-Z</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {!showHistory && history && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)} className="gap-2">
              <Calendar className="h-4 w-4" />
              Show History
            </Button>
          )}
          <div className="flex border rounded-lg">
            <button onClick={() => setViewMode('grid')} className={cn('p-2', viewMode === 'grid' ? 'bg-secondary' : 'hover:bg-secondary/50')}>
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={cn('p-2', viewMode === 'list' ? 'bg-secondary' : 'hover:bg-secondary/50')}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        {loading ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
          </span>
        ) : (
          <>Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()} products</>
        )}
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((p) => <ProductCard key={p.id} product={p} variant="list" />)}
        </div>
      )}

      {products.length === 0 && !loading && (
        <div className="text-center py-20 text-muted-foreground">
          <p>No products found in this category yet.</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {getPageNumbers(page, totalPages).map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted-foreground">...</span>
            ) : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setPage(p as number)}
              >
                {p}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </main>
  )
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}
