'use client'

import { useState } from 'react'
import Image from 'next/image'
import { TrendingUp, TrendingDown, Minus, ExternalLink, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/mock-data'

interface ProductRowProps {
  product: Product
  index: number
  onClick: () => void
}

export function ProductRow({ product, index, onClick }: ProductRowProps) {
  const [isHovered, setIsHovered] = useState(false)

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

  const maxBuzz = Math.max(
    product.buzzBreakdown.twitter,
    product.buzzBreakdown.reddit,
    product.buzzBreakdown.hackerNews,
    product.buzzBreakdown.news
  )

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative w-full text-left',
        'rounded-2xl border border-transparent',
        'transition-all duration-300 ease-out',
        'hover:border-border/50 hover:bg-card/50',
        'focus:outline-none focus:ring-2 focus:ring-[var(--sentinel-accent)]/30'
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Glow effect on hover */}
      <div
        className={cn(
          'absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300',
          'bg-gradient-to-r from-[var(--sentinel-accent)]/10 via-transparent to-[var(--sentinel-accent)]/10',
          isHovered && 'opacity-100'
        )}
      />

      <div className="relative flex items-center gap-4 p-4">
        {/* Rank */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-semibold text-muted-foreground">
          {index + 1}
        </div>

        {/* Logo */}
        <div className="relative shrink-0">
          <div
            className={cn(
              'relative h-14 w-14 overflow-hidden rounded-xl bg-secondary transition-transform duration-300',
              isHovered && 'scale-110'
            )}
          >
            <Image
              src={product.logo}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          {product.verified && (
            <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
              <CheckCircle2 className="h-4 w-4 text-[var(--sentinel-accent)]" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-[var(--sentinel-accent)]">
              {product.name}
            </h3>
            <ExternalLink
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity',
                isHovered && 'opacity-100'
              )}
            />
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {product.tagline}
          </p>

          {/* Tags */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {product.category}
            </span>
            {product.badges.slice(0, 2).map((badge) => (
              <span
                key={badge}
                className="rounded-md bg-[var(--sentinel-accent)]/10 px-2 py-0.5 text-xs text-[var(--sentinel-accent)]"
              >
                {badge.replace('-', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Buzz Score */}
        <div className="hidden sm:flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <TrendIcon className={cn('h-4 w-4', trendColor)} />
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {product.buzzScore}
            </span>
          </div>

          {/* Mini buzz bars */}
          <div
            className={cn(
              'flex items-end gap-1 h-6 overflow-hidden transition-all duration-300',
              isHovered ? 'opacity-100 w-24' : 'opacity-0 w-0'
            )}
          >
            <div
              className="w-5 rounded-t bg-[var(--buzz-twitter)] transition-all duration-500"
              style={{ height: `${(product.buzzBreakdown.twitter / maxBuzz) * 100}%` }}
              title={`Twitter: ${product.buzzBreakdown.twitter}`}
            />
            <div
              className="w-5 rounded-t bg-[var(--buzz-reddit)] transition-all duration-500"
              style={{ height: `${(product.buzzBreakdown.reddit / maxBuzz) * 100}%` }}
              title={`Reddit: ${product.buzzBreakdown.reddit}`}
            />
            <div
              className="w-5 rounded-t bg-[var(--buzz-hackernews)] transition-all duration-500"
              style={{ height: `${(product.buzzBreakdown.hackerNews / maxBuzz) * 100}%` }}
              title={`HN: ${product.buzzBreakdown.hackerNews}`}
            />
            <div
              className="w-5 rounded-t bg-[var(--buzz-news)] transition-all duration-500"
              style={{ height: `${(product.buzzBreakdown.news / maxBuzz) * 100}%` }}
              title={`News: ${product.buzzBreakdown.news}`}
            />
          </div>
        </div>

        {/* Mobile buzz score */}
        <div className="flex sm:hidden shrink-0 items-center gap-1.5">
          <TrendIcon className={cn('h-3.5 w-3.5', trendColor)} />
          <span className="text-lg font-bold tabular-nums">{product.buzzScore}</span>
        </div>
      </div>
    </button>
  )
}
