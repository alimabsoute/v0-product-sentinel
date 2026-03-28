'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/mock-data'

interface BuzzScoreProps {
  product: Product
}

const sources = [
  { key: 'twitter' as const, label: 'Twitter/X', color: 'var(--buzz-twitter)', icon: 'X' },
  { key: 'reddit' as const, label: 'Reddit', color: 'var(--buzz-reddit)', icon: 'R' },
  { key: 'hackerNews' as const, label: 'Hacker News', color: 'var(--buzz-hackernews)', icon: 'HN' },
  { key: 'news' as const, label: 'News', color: 'var(--buzz-news)', icon: 'N' },
]

export function BuzzScore({ product }: BuzzScoreProps) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100)
    return () => {
      clearTimeout(timer)
      setAnimated(false)
    }
  }, [product.id])

  const maxValue = Math.max(
    product.buzzBreakdown.twitter,
    product.buzzBreakdown.reddit,
    product.buzzBreakdown.hackerNews,
    product.buzzBreakdown.news
  )

  const total = Object.values(product.buzzBreakdown).reduce((a, b) => a + b, 0)

  const TrendIcon =
    product.buzzTrend === 'rising'
      ? TrendingUp
      : product.buzzTrend === 'falling'
        ? TrendingDown
        : Minus

  const trendColor =
    product.buzzTrend === 'rising'
      ? 'text-[var(--sentinel-rising)]'
      : product.buzzTrend === 'falling'
        ? 'text-[var(--sentinel-falling)]'
        : 'text-muted-foreground'

  const trendLabel =
    product.buzzTrend === 'rising'
      ? 'Rising'
      : product.buzzTrend === 'falling'
        ? 'Falling'
        : 'Stable'

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Buzz Score
        </h3>
        <div className={cn('flex items-center gap-1.5 text-sm font-medium', trendColor)}>
          <TrendIcon className="h-4 w-4" />
          <span>{trendLabel}</span>
        </div>
      </div>

      {/* Main score */}
      <div className="mb-6 flex items-end gap-3">
        <div className="relative">
          <span className="text-5xl font-bold tabular-nums text-foreground">
            {product.buzzScore}
          </span>
          {product.buzzTrend === 'rising' && (
            <div className="absolute -right-2 -top-2 h-3 w-3 animate-pulse rounded-full bg-[var(--sentinel-rising)]" />
          )}
        </div>
        <span className="mb-2 text-sm text-muted-foreground">total mentions</span>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-4">
        {sources.map((source, index) => {
          const value = product.buzzBreakdown[source.key]
          const percentage = (value / maxValue) * 100

          return (
            <div key={source.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
                    style={{ backgroundColor: source.color, color: 'var(--background)' }}
                  >
                    {source.icon}
                  </div>
                  <span className="text-muted-foreground">{source.label}</span>
                </div>
                <span className="font-semibold tabular-nums text-foreground">{value}</span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                  style={{
                    backgroundColor: source.color,
                    width: animated ? `${percentage}%` : '0%',
                    transitionDelay: `${index * 100}ms`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-5 flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
        <span className="text-sm text-muted-foreground">Total Mentions</span>
        <span className="text-lg font-bold tabular-nums text-foreground">{total}</span>
      </div>
    </div>
  )
}
