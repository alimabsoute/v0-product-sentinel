'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import {
  TrendingUp,
  TrendingDown,
  Skull,
  Filter,
  SortAsc,
  Grid3X3,
  List,
  ChevronDown,
  Calendar,
} from 'lucide-react'
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

type SortOption = 'newest' | 'name'
type ViewMode = 'grid' | 'list'

interface CategoryClientProps {
  slug: string
  displayName: string
  products: Product[]
}

export function CategoryClient({ slug, displayName, products }: CategoryClientProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showHistory, setShowHistory] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'dead'>('active')

  const history = categoryHistory[slug]

  let filtered = products
  if (statusFilter === 'active') filtered = filtered.filter((p) => p.status === 'active')
  if (statusFilter === 'dead') filtered = filtered.filter((p) => p.status === 'dead')

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime()
  })

  const activeCount = products.filter((p) => p.status === 'active').length
  const deadCount = products.filter((p) => p.status === 'dead').length

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
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-medium">{displayName}</h1>

        <div className="flex flex-wrap gap-4 mt-6">
          <div className="px-4 py-2 bg-card border rounded-lg">
            <span className="text-2xl font-serif">{products.length}</span>
            <span className="text-sm text-muted-foreground ml-2">products tracked</span>
          </div>
          <div className="px-4 py-2 bg-card border rounded-lg flex items-center gap-2">
            <span className="text-2xl font-serif text-green-600">{activeCount}</span>
            <span className="text-sm text-muted-foreground">active</span>
          </div>
          <div className="px-4 py-2 bg-card border rounded-lg flex items-center gap-2">
            <Skull className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-serif text-muted-foreground">{deadCount}</span>
            <span className="text-sm text-muted-foreground">dead</span>
          </div>
        </div>
      </div>

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
              <DropdownMenuItem onClick={() => setSortBy('name')}>Name A-Z</DropdownMenuItem>
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

      <div className="mb-4 text-sm text-muted-foreground">Showing {sorted.length} products</div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((p) => <ProductCard key={p.id} product={p} variant="list" />)}
        </div>
      )}

      {sorted.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p>No products found in this category yet.</p>
        </div>
      )}
    </main>
  )
}
