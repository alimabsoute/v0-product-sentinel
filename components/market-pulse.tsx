'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { categories, products, Category } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface CategoryTrend {
  category: Category
  productCount: number
  avgBuzz: number
  trend: 'rising' | 'stable' | 'falling'
  change: number
}

function calculateCategoryTrends(): CategoryTrend[] {
  return categories
    .filter(c => c !== 'All')
    .map(category => {
      const categoryProducts = products.filter(p => p.category === category && p.status === 'active')
      const avgBuzz = categoryProducts.length > 0
        ? Math.round(categoryProducts.reduce((sum, p) => sum + p.buzz.score, 0) / categoryProducts.length)
        : 0
      const avgChange = categoryProducts.length > 0
        ? Math.round(categoryProducts.reduce((sum, p) => sum + p.buzz.weeklyChange, 0) / categoryProducts.length)
        : 0
      
      return {
        category,
        productCount: categoryProducts.length,
        avgBuzz,
        trend: avgChange > 5 ? 'rising' : avgChange < -5 ? 'falling' : 'stable',
        change: avgChange,
      }
    })
    .sort((a, b) => b.change - a.change)
}

export function MarketPulse() {
  const trends = calculateCategoryTrends()

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold">Market Pulse</h2>
        <Link
          href="/categories"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          All markets
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-2">
        {trends.slice(0, 6).map((trend, i) => (
          <CategoryTrendCard key={trend.category} trend={trend} index={i} />
        ))}
      </div>
    </div>
  )
}

interface CategoryTrendCardProps {
  trend: CategoryTrend
  index?: number
}

function CategoryTrendCard({ trend, index = 0 }: CategoryTrendCardProps) {
  const TrendIcon = trend.trend === 'rising'
    ? TrendingUp
    : trend.trend === 'falling'
    ? TrendingDown
    : Minus

  const trendColor = trend.trend === 'rising'
    ? 'text-[var(--sentinel-rising)]'
    : trend.trend === 'falling'
    ? 'text-[var(--sentinel-falling)]'
    : 'text-muted-foreground'

  const trendBg = trend.trend === 'rising'
    ? 'bg-[var(--sentinel-rising)]/10'
    : trend.trend === 'falling'
    ? 'bg-[var(--sentinel-falling)]/10'
    : 'bg-secondary/50'

  return (
    <Link
      href={`/categories/${trend.category.toLowerCase().replace(/\s+/g, '-')}`}
      className="group flex items-center justify-between rounded-xl bg-secondary/30 hover:bg-secondary/50 p-3 transition-all"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          trendBg
        )}>
          <TrendIcon className={cn("h-5 w-5", trendColor)} />
        </div>
        <div>
          <h3 className="font-medium group-hover:text-primary">{trend.category}</h3>
          <p className="text-xs text-muted-foreground">
            {trend.productCount} products
          </p>
        </div>
      </div>

      <div className="text-right">
        <div className={cn("text-sm font-semibold tabular-nums", trendColor)}>
          {trend.change > 0 ? '+' : ''}{trend.change}%
        </div>
        <div className="text-xs text-muted-foreground">
          avg buzz {trend.avgBuzz}
        </div>
      </div>
    </Link>
  )
}

// Compact version for sidebar
export function MarketPulseCompact() {
  const trends = calculateCategoryTrends()
  const topRising = trends.filter(t => t.trend === 'rising').slice(0, 3)
  const topFalling = trends.filter(t => t.trend === 'falling').slice(0, 2)

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Market Trends</h3>
      
      {topRising.length > 0 && (
        <div className="space-y-1">
          {topRising.map(trend => (
            <Link
              key={trend.category}
              href={`/categories/${trend.category.toLowerCase().replace(/\s+/g, '-')}`}
              className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-muted"
            >
              <span>{trend.category}</span>
              <span className="flex items-center gap-1 text-[var(--sentinel-rising)]">
                <TrendingUp className="h-3 w-3" />
                +{trend.change}%
              </span>
            </Link>
          ))}
        </div>
      )}

      {topFalling.length > 0 && (
        <div className="space-y-1 border-t border-border pt-2">
          {topFalling.map(trend => (
            <Link
              key={trend.category}
              href={`/categories/${trend.category.toLowerCase().replace(/\s+/g, '-')}`}
              className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-muted"
            >
              <span>{trend.category}</span>
              <span className="flex items-center gap-1 text-[var(--sentinel-falling)]">
                <TrendingDown className="h-3 w-3" />
                {trend.change}%
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
