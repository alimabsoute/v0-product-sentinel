'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search, Filter, Grid3X3, List,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Loader2, X,
} from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/mock-data'

type SortOption = 'newest' | 'oldest' | 'az' | 'score' | 'trending'
type ViewMode = 'grid' | 'list'

const sortLabels: Record<SortOption, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  az: 'Name A–Z',
  score: 'Top Score',
  trending: 'Trending',
}

type TagItem = { slug: string; label: string; count: number }
type TagGroup = { group: string; label: string; tags: TagItem[] }

interface ProductsClientProps {
  categories: string[]
  totalCount: number
}

function slugToLabel(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function TagGroupSection({
  group,
  selectedTags,
  onToggle,
}: {
  group: TagGroup
  selectedTags: Set<string>
  onToggle: (slug: string) => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border-b border-border pb-3 last:border-0 last:pb-0">
      <button
        className="flex w-full items-center justify-between py-2 text-sm font-medium text-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        {group.label}
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="mt-1 space-y-1.5">
          {group.tags.map((tag) => (
            <label
              key={tag.slug}
              className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-muted/50"
            >
              <Checkbox
                id={`tag-${tag.slug}`}
                checked={selectedTags.has(tag.slug)}
                onCheckedChange={() => onToggle(tag.slug)}
                className="h-3.5 w-3.5"
              />
              <span className="flex-1 text-muted-foreground leading-none">{tag.label}</span>
              <span className="text-xs text-muted-foreground/60">{tag.count}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export function ProductsClient({ categories, totalCount }: ProductsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const initialQ = searchParams.get('q') || ''
  const initialCategory = searchParams.get('category') || 'All'
  const initialSort = (searchParams.get('sort') as SortOption) || 'newest'
  const initialPage = parseInt(searchParams.get('page') || '1', 10)
  const initialTags = new Set<string>(
    (searchParams.get('tags') || '').split(',').filter(Boolean)
  )

  const [search, setSearch] = useState(initialQ)
  const [debouncedSearch, setDebouncedSearch] = useState(initialQ)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [sort, setSort] = useState<SortOption>(initialSort)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [page, setPage] = useState(initialPage)
  const [selectedTags, setSelectedTags] = useState<Set<string>>(initialTags)

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  const [tagGroups, setTagGroups] = useState<TagGroup[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const LIMIT = 50

  useEffect(() => {
    fetch('/api/products/tags')
      .then((r) => r.json())
      .then((d) => setTagGroups(d.groups ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [selectedCategory, sort])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('q', debouncedSearch)
      if (selectedCategory !== 'All') {
        const slug = selectedCategory.toLowerCase().replace(/\s+/g, '-')
        params.set('category', slug)
      }
      params.set('sort', sort)
      params.set('page', String(page))
      params.set('limit', String(LIMIT))
      if (selectedTags.size > 0) {
        params.set('tags', [...selectedTags].join(','))
      }

      const res = await fetch(`/api/products/search?${params}`)
      const data = await res.json()

      setProducts(data.products ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 0)
    } catch {
      setProducts([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, selectedCategory, sort, page, selectedTags])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('q', debouncedSearch)
    if (selectedCategory !== 'All') params.set('category', selectedCategory.toLowerCase().replace(/\s+/g, '-'))
    if (sort !== 'newest') params.set('sort', sort)
    if (page > 1) params.set('page', String(page))
    if (selectedTags.size > 0) params.set('tags', [...selectedTags].join(','))
    const qs = params.toString()
    const url = qs ? `/products?${qs}` : '/products'
    startTransition(() => {
      router.replace(url, { scroll: false })
    })
  }, [debouncedSearch, selectedCategory, sort, page, selectedTags, router])

  function toggleTag(slug: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) {
        next.delete(slug)
      } else {
        next.add(slug)
      }
      return next
    })
    setPage(1)
  }

  function clearTags() {
    setSelectedTags(new Set())
    setPage(1)
  }

  const pageNumbers = getPageNumbers(page, totalPages)

  const sidebar = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Filters</span>
        {selectedTags.size > 0 && (
          <button
            onClick={clearTags}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
      {tagGroups.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {tagGroups.map((group) => (
            <TagGroupSection
              key={group.group}
              group={group}
              selectedTags={selectedTags}
              onToggle={toggleTag}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold">Products</h1>
        <p className="mt-2 text-muted-foreground">
          Discover and track {totalCount.toLocaleString()} products across {categories.length} categories
        </p>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile sidebar toggle */}
          <Button
            variant="outline"
            size="sm"
            className="sm:hidden"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {selectedTags.size > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">
                {selectedTags.size}
              </Badge>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {sortLabels[sort]}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(sortLabels).map(([key, label]) => (
                <DropdownMenuItem key={key} onClick={() => setSort(key as SortOption)}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden sm:flex items-center border border-border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-none rounded-l-md"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-none rounded-r-md"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['All', ...categories].map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Badge>
        ))}
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 sm:hidden">
          {sidebar}
        </div>
      )}

      {/* Desktop: sidebar + content */}
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 sm:block">
          <div className="sticky top-6 rounded-xl border border-border bg-card p-4">
            {sidebar}
          </div>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Active tag pills */}
          {selectedTags.size > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {[...selectedTags].map((slug) => (
                <Badge
                  key={slug}
                  variant="secondary"
                  className="cursor-pointer gap-1 pr-1.5"
                  onClick={() => toggleTag(slug)}
                >
                  {slugToLabel(slug)}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}

          {/* Results count */}
          <div className="mb-4 flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching...
                </span>
              ) : (
                <>
                  Showing {total === 0 ? 0 : ((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of{' '}
                  {total.toLocaleString()} products
                </>
              )}
            </p>
          </div>

          {/* Product grid/list */}
          {loading ? (
            <div className={cn(
              'grid gap-6',
              viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3' : 'grid-cols-1',
            )}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-1.5">
                    <div className="h-5 w-16 rounded-full bg-muted" />
                    <div className="h-5 w-12 rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} variant="list" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && products.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-lg font-medium">No products found</p>
              <p className="mt-1 text-muted-foreground">Try adjusting your search or filter criteria</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearch('')
                  setSelectedCategory('All')
                  setSort('newest')
                  clearTags()
                }}
              >
                Clear filters
              </Button>
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

              {pageNumbers.map((p, i) =>
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
        </div>
      </div>
    </>
  )
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
