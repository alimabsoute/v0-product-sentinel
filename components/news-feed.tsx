'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, MessageCircle, ArrowUp, Clock, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NewsItem, getRecentNews, formatRelativeTime, getProductById } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const sourceIcons: Record<string, string> = {
  techcrunch: 'TC',
  hackernews: 'HN',
  reddit: 'R',
  twitter: 'X',
  theverge: 'V',
  wired: 'W',
  other: '?',
}

const sourceColors: Record<string, string> = {
  techcrunch: 'bg-green-500/10 text-green-700',
  hackernews: 'bg-orange-500/10 text-orange-700',
  reddit: 'bg-red-500/10 text-red-700',
  twitter: 'bg-blue-500/10 text-blue-700',
  theverge: 'bg-purple-500/10 text-purple-700',
  wired: 'bg-gray-500/10 text-gray-700',
  other: 'bg-muted text-muted-foreground',
}

interface NewsFeedProps {
  limit?: number
  showHeader?: boolean
}

export function NewsFeed({ limit = 8, showHeader = true }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    setNews(getRecentNews(limit))
  }, [limit])

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate refresh
    setTimeout(() => {
      setNews(getRecentNews(limit))
      setIsRefreshing(false)
    }, 1000)
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--sentinel-hot)]" />
            <h2 className="font-serif text-lg font-semibold">Live Feed</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {news.map((item, index) => (
          <NewsItemCard key={item.id} item={item} isNew={index === 0} />
        ))}
      </div>
    </div>
  )
}

interface NewsItemCardProps {
  item: NewsItem
  isNew?: boolean
}

function NewsItemCard({ item, isNew }: NewsItemCardProps) {
  const mentionedProducts = item.productMentions
    .map(id => getProductById(id))
    .filter(Boolean)

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group block rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm",
        isNew && "border-l-2 border-l-[var(--sentinel-hot)]"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Source badge */}
        <div className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold",
          sourceColors[item.source]
        )}>
          {sourceIcons[item.source]}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-medium leading-snug text-foreground group-hover:text-primary line-clamp-2">
            {item.title}
          </h3>

          {/* Excerpt */}
          {item.excerpt && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {item.excerpt}
            </p>
          )}

          {/* Meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{item.sourceName}</span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(item.publishedAt)}
            </span>

            {/* Engagement stats */}
            {item.engagement && (
              <>
                {item.engagement.points && (
                  <>
                    <span className="text-border">|</span>
                    <span className="flex items-center gap-1">
                      <ArrowUp className="h-3 w-3" />
                      {item.engagement.points}
                    </span>
                  </>
                )}
                {item.engagement.upvotes && (
                  <>
                    <span className="text-border">|</span>
                    <span className="flex items-center gap-1">
                      <ArrowUp className="h-3 w-3" />
                      {item.engagement.upvotes}
                    </span>
                  </>
                )}
                {item.engagement.comments && (
                  <>
                    <span className="text-border">|</span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {item.engagement.comments}
                    </span>
                  </>
                )}
              </>
            )}
          </div>

          {/* Product mentions */}
          {mentionedProducts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {mentionedProducts.map(product => product && (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
                >
                  <img
                    src={product.logo}
                    alt={product.name}
                    className="h-3.5 w-3.5 rounded-sm object-cover"
                  />
                  {product.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </a>
  )
}
