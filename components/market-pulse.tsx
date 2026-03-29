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
    <div className="rounded-2xl border border-border/50 bg-card/50 p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-lg font-semibold">Market Pulse</h2>
        <Link
          href="/categories"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-1.5">
        {trends.slice(0, 6).map((trend) => (
          <CategoryTrendCard key={trend.category} trend={trend} />
        ))}
      </div>
    </div>
  )
}

interface CategoryTrendCardProps {
  trend: CategoryTrend
}

function CategoryTrendCard({ trend }: CategoryTrendCardProps) {
  const TrendIcon = trend.trend === 'rising'
    ? TrendingUp
    : trend.trend === 'falling'
    ? TrendingDown
    : Minus

  const trendColor = trend.trend === 'rising'
    ? 'text-emerald-600'
    : trend.trend === 'falling'
    ? 'text-red-500'
    : 'text-muted-foreground'

  return (
    <Link
      href={`/categories/${trend.category.toLowerCase().replace(/\s+/g, '-')}`}
      className="group flex items-center justify-between rounded-xl p-2.5 -mx-2.5 transition-colors hover:bg-secondary/50"
    >
      <div className="flex items-center gap-3">
        <TrendIcon className={cn("h-4 w-4", trendColor)} />
        <div>
          <span className="text-sm font-medium group-hover:text-primary transition-colors">
            {trend.category}
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            {trend.productCount} products
          </span>
        </div>
      </div>

      <div className={cn("text-sm font-medium tabular-nums", trendColor)}>
        {trend.change > 0 ? '+' : ''}{trend.change}%
      </div>
    </Link>
  )
}

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
              <span className="flex items-center gap-1 text-emerald-600">
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
              <span className="flex items-center gap-1 text-red-500">
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
