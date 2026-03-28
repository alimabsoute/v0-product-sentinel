'use client'

import { TrendingUp, Flame, Clock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { products } from '@/lib/mock-data'

type SortOption = 'buzz' | 'trending' | 'newest' | 'hidden-gems'

interface SidebarProps {
  sort: SortOption
  onSortChange: (sort: SortOption) => void
}

const sortOptions = [
  { id: 'buzz' as const, label: 'Top Buzz', icon: Flame, description: 'Highest overall buzz' },
  { id: 'trending' as const, label: 'Rising', icon: TrendingUp, description: 'Growing fast' },
  { id: 'newest' as const, label: 'Newest', icon: Clock, description: 'Recently launched' },
  { id: 'hidden-gems' as const, label: 'Hidden Gems', icon: Sparkles, description: 'Low buzz, high potential' },
]

export function Sidebar({ sort, onSortChange }: SidebarProps) {
  // Get top 5 trending products
  const trendingProducts = products
    .filter((p) => p.buzzTrend === 'rising')
    .sort((a, b) => b.buzzScore - a.buzzScore)
    .slice(0, 5)

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24 space-y-6">
        {/* Sort Options */}
        <div className="rounded-2xl border border-border bg-card/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Sort By</h3>
          <div className="space-y-1">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onSortChange(option.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200',
                  sort === option.id
                    ? 'bg-[var(--sentinel-accent)]/10 text-[var(--sentinel-accent)]'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <option.icon className="h-4 w-4" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{option.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Buzz Leaderboard */}
        <div className="rounded-2xl border border-border bg-card/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Hot Right Now</h3>
            <span className="flex items-center gap-1 text-xs text-[var(--sentinel-rising)]">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              Live
            </span>
          </div>
          <div className="space-y-3">
            {trendingProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-secondary text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {product.name}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-[var(--sentinel-rising)]">
                  <TrendingUp className="h-3 w-3" />
                  <span className="font-semibold tabular-nums">{product.buzzScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl border border-border bg-card/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Platform Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary/50 p-3 text-center">
              <div className="text-xl font-bold text-foreground">{products.length}</div>
              <div className="text-xs text-muted-foreground">Products</div>
            </div>
            <div className="rounded-xl bg-secondary/50 p-3 text-center">
              <div className="text-xl font-bold text-[var(--sentinel-rising)]">
                {products.filter((p) => p.buzzTrend === 'rising').length}
              </div>
              <div className="text-xs text-muted-foreground">Rising</div>
            </div>
            <div className="rounded-xl bg-secondary/50 p-3 text-center">
              <div className="text-xl font-bold text-[var(--sentinel-accent)]">
                {products.filter((p) => p.verified).length}
              </div>
              <div className="text-xs text-muted-foreground">Verified</div>
            </div>
            <div className="rounded-xl bg-secondary/50 p-3 text-center">
              <div className="text-xl font-bold text-foreground">
                {Math.round(products.reduce((acc, p) => acc + p.buzzScore, 0) / 1000)}K
              </div>
              <div className="text-xs text-muted-foreground">Total Buzz</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
