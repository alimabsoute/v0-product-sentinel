'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, Grid3X3, List, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

interface ProductsClientProps {
  categories: string[]
  totalCount: number
}

export function ProductsClient({ categories, totalCount }: ProductsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Read initial state from URL
  const initialQ = searchParams.get('q') || ''
  const initialCategory = searchParams.get('category') || 'All'
  const initialSort = (searchParams.get('sort') as SortOption) || 'newest'
  const initialPage = parseInt(searchParams.get('page') || '1', 10)

  const [search, setSearch] = useState(initialQ)
  const [debouncedSearch, setDebouncedSearch] = useState(initialQ)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [sort, setSort] = useState<SortOption>(initialSort)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [page, setPage] = useState(initialPage)

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  const LIMIT = 50

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 on new search
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page on filter changes
  useEffect(() => {
    setPage(1)
  }, [selectedCategory, sort])

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('q', debouncedSearch)
      if (selectedCategory !== 'All') {
        // Convert display name back to slug for API
        const slug = selectedCategory.toLowerCase().replace(/\s+/g, '-')
        params.set('category', slug)
      }
      params.set('sort', sort)
      params.set('page', String(page))
      params.set('limit', String(LIMIT))

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
  }, [debouncedSearch, selectedCategory, sort, page])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Sync state to URL (shallow, no full page reload)
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('q', debouncedSearch)
    if (selectedCategory !== 'All') params.set('category', selectedCategory.toLowerCase().replace(/\s+/g, '-'))
    if (sort !== 'newest') params.set('sort', sort)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    const url = qs ? `/products?${qs}` : '/products'
    startTransition(() => {
      router.replace(url, { scroll: false })
    })
  }, [debouncedSearch, selectedCategory, sort, page, router])

  // Pagination range
  const pageNumbers = getPageNumbers(page, totalPages)

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

      {/* Results count */}
      <div className="mb-4 flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {loading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching...
            </span>
          ) : (
            <>
              Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of{' '}
              {total.toLocaleString()} products
            </>
          )}
        </p>
      </div>

      {/* Product grid/list */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            onClick={() => { setSearch(''); setSelectedCategory('All'); setSort('newest') }}
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
    </>
  )
}

/** Generate page number array with ellipsis for large page counts. */
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
