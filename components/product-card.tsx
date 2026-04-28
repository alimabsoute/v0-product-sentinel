'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, Minus, Bookmark, BookmarkCheck, ExternalLink, GitCompare } from 'lucide-react'
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

// ─── Bookmark Button ──────────────────────────────────────────────────────────

interface BookmarkButtonProps {
  productId: string
  initialSaved?: boolean
  size?: 'sm' | 'default'
  className?: string
}

function BookmarkButton({ productId, initialSaved = false, size = 'default', className }: BookmarkButtonProps) {
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [isPending, setIsPending] = useState(false)

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsPending(true)
    // Optimistic update
    const nextSaved = !saved
    setSaved(nextSaved)

    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, action: nextSaved ? 'save' : 'unsave' }),
      })

      if (res.status === 401) {
        // Not logged in — revert optimistic update and redirect to login
        setSaved(!nextSaved)
        router.push('/login')
        return
      }

      if (!res.ok) {
        // Server error — revert optimistic update
        setSaved(!nextSaved)
      }
    } catch {
      // Network error — revert optimistic update
      setSaved(!nextSaved)
    } finally {
      setIsPending(false)
    }
  }, [productId, saved, router])

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const btnSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        btnSize,
        saved ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
        isPending && 'opacity-60 cursor-wait',
        className
      )}
      onClick={handleClick}
      title={saved ? 'Remove from watchlist' : 'Save to watchlist'}
      disabled={isPending}
    >
      {saved
        ? <BookmarkCheck className={iconSize} />
        : <Bookmark className={iconSize} />
      }
    </Button>
  )
}

interface ProductCardProps {
  product: Product
  variant?: 'default' | 'compact' | 'featured' | 'list'
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
      <div className="group flex items-center gap-3 rounded-xl p-2.5 transition-all hover:bg-secondary/80">
        <Link
          href={`/products/${product.slug}`}
          className="flex items-center gap-3 flex-1 min-w-0"
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
        </Link>
        <BuzzIndicator product={product} size="sm" />
        <Link
          href={`/compare?a=${product.slug}`}
          title="Compare"
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
        >
          <GitCompare className="h-3.5 w-3.5" />
        </Link>
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <Link
        href={`/products/${product.slug}`}
        className={cn(
          "group flex items-center gap-4 rounded-2xl glass p-4 transition-all hover:shadow-lg hover:-translate-y-0.5",
          product.status === 'dead' && "opacity-60"
        )}
      >
        <img
          src={product.logo}
          alt={product.name}
          className="h-14 w-14 rounded-lg object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium">{product.name}</h3>
            {product.status === 'dead' && (
              <Badge className="bg-[var(--sentinel-dead)] text-xs">Sunset</Badge>
            )}
            {product.badges.includes('verified') && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">Verified</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{product.tagline}</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs">{product.category}</Badge>
            {product.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <BuzzIndicator product={product} />
          <div className="flex items-center gap-1">
            <BookmarkButton productId={product.id} />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault()
                window.open(product.url, '_blank')
              }}
              title="Visit website"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link
        href={`/products/${product.slug}`}
        className="group relative flex flex-col overflow-hidden rounded-2xl glass transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
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
        "group relative flex flex-col rounded-2xl glass p-4 transition-all hover:shadow-lg hover:-translate-y-0.5",
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
          <BookmarkButton productId={product.id} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.preventDefault()
              window.location.href = `/compare?a=${product.slug}`
            }}
            title="Compare with another product"
          >
            <GitCompare className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.preventDefault()
              window.open(product.url, '_blank')
            }}
            title="Visit website"
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
