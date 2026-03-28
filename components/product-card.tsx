'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus, Bookmark, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Product } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  variant?: 'default' | 'compact' | 'featured'
}

export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const TrendIcon = product.buzz.trend === 'rising' 
    ? TrendingUp 
    : product.buzz.trend === 'falling' 
    ? TrendingDown 
    : Minus

  const trendColor = product.buzz.trend === 'rising'
    ? 'text-[var(--sentinel-rising)]'
    : product.buzz.trend === 'falling'
    ? 'text-[var(--sentinel-falling)]'
    : 'text-muted-foreground'

  if (variant === 'compact') {
    return (
      <Link 
        href={`/products/${product.slug}`}
        className="group flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-card"
      >
        <img
          src={product.logo}
          alt={product.name}
          className="h-10 w-10 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{product.name}</span>
            {product.badges.includes('verified') && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                Verified
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{product.tagline}</p>
        </div>
        <BuzzIndicator product={product} size="sm" />
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link
        href={`/products/${product.slug}`}
        className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
      >
        {/* Screenshot/Preview */}
        {product.screenshots[0] && (
          <div className="aspect-[16/9] overflow-hidden bg-muted">
            <img
              src={product.screenshots[0]}
              alt={`${product.name} screenshot`}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
        
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start gap-3">
            <img
              src={product.logo}
              alt={product.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-semibold">{product.name}</h3>
                {product.badges.includes('verified') && (
                  <Badge variant="secondary" className="h-5">Verified</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{product.tagline}</p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <Badge variant="outline">{product.category}</Badge>
            <BuzzIndicator product={product} />
          </div>
        </div>
      </Link>
    )
  }

  // Default card
  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group relative flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md",
        product.status === 'dead' && "opacity-60"
      )}
    >
      {product.status === 'dead' && (
        <Badge className="absolute right-3 top-3 bg-[var(--sentinel-dead)]">
          Sunset
        </Badge>
      )}
      
      <div className="flex items-start gap-3">
        <img
          src={product.logo}
          alt={product.name}
          className="h-12 w-12 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{product.name}</h3>
            {product.badges.includes('verified') && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                Verified
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{product.tagline}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge variant="outline" className="text-xs">{product.category}</Badge>
        {product.tags.slice(0, 2).map(tag => (
          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <BuzzIndicator product={product} />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.preventDefault()
              // Save functionality
            }}
          >
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.preventDefault()
              window.open(product.url, '_blank')
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  )
}

interface BuzzIndicatorProps {
  product: Product
  size?: 'sm' | 'default'
}

function BuzzIndicator({ product, size = 'default' }: BuzzIndicatorProps) {
  const { buzz } = product
  const TrendIcon = buzz.trend === 'rising' 
    ? TrendingUp 
    : buzz.trend === 'falling' 
    ? TrendingDown 
    : Minus

  const trendColor = buzz.trend === 'rising'
    ? 'text-[var(--sentinel-rising)]'
    : buzz.trend === 'falling'
    ? 'text-[var(--sentinel-falling)]'
    : 'text-muted-foreground'

  // Simple sparkline visualization
  const maxVal = Math.max(...buzz.sparkline)
  const normalized = buzz.sparkline.map(v => (v / maxVal) * 100)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-2",
            size === 'sm' && "gap-1.5"
          )}>
            {/* Mini sparkline */}
            <div className={cn(
              "flex items-end gap-0.5",
              size === 'sm' ? "h-4" : "h-5"
            )}>
              {normalized.slice(-5).map((height, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-sm bg-primary/60",
                    i === normalized.length - 1 && "bg-primary"
                  )}
                  style={{ height: `${Math.max(20, height)}%` }}
                />
              ))}
            </div>
            <div className={cn(
              "flex items-center gap-1",
              size === 'sm' && "text-xs"
            )}>
              <span className="font-medium tabular-nums">{buzz.score}</span>
              <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="w-48">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Buzz Score</span>
              <span className="font-medium">{buzz.score}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Weekly change</span>
              <span className={cn("font-medium", trendColor)}>
                {buzz.weeklyChange > 0 ? '+' : ''}{buzz.weeklyChange}%
              </span>
            </div>
            <div className="border-t border-border pt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--buzz-twitter)]">Twitter</span>
                <span>{buzz.sources.twitter}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--buzz-reddit)]">Reddit</span>
                <span>{buzz.sources.reddit}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--buzz-hackernews)]">HN</span>
                <span>{buzz.sources.hackerNews}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--buzz-news)]">News</span>
                <span>{buzz.sources.news}</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
