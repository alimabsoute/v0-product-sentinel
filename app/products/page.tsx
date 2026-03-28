'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Filter, Grid3X3, List, ChevronDown } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
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
import { products, categories, type Category } from '@/lib/mock-data'

type SortOption = 'buzz' | 'trending' | 'newest' | 'name'
type ViewMode = 'grid' | 'list'

const sortLabels: Record<SortOption, string> = {
  buzz: 'Highest Buzz',
  trending: 'Trending',
  newest: 'Newest',
  name: 'Name A-Z',
}

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category>('All')
  const [sort, setSort] = useState<SortOption>('buzz')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => p.status === 'active')

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.tagline.toLowerCase().includes(searchLower) ||
        p.tags.some(t => t.toLowerCase().includes(searchLower))
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sort) {
        case 'buzz':
          return b.buzz.score - a.buzz.score
        case 'trending':
          return b.buzz.weeklyChange - a.buzz.weeklyChange
        case 'newest':
          return new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime()
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return filtered
  }, [search, selectedCategory, sort])

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">Products</h1>
          <p className="mt-2 text-muted-foreground">
            Discover and track {products.filter(p => p.status === 'active').length} products across {categories.length - 1} categories
          </p>
        </div>

        {/* Filters Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>

            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {sortLabels[sort]}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(sortLabels).map(([key, label]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setSort(key as SortOption)}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View toggle */}
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
          {categories.map((category) => (
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
        <p className="mb-4 text-sm text-muted-foreground">
          {filteredProducts.length} products found
        </p>

        {/* Product Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} variant="compact" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {filteredProducts.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg font-medium">No products found</p>
            <p className="mt-1 text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearch('')
                setSelectedCategory('All')
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
