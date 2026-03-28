'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Clock, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NewsItem, getRecentNews, formatRelativeTime, getProductById } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

// Category colors matching the screenshot style
const categoryColors: Record<string, string> = {
  insights: 'bg-slate-700 text-white',
  design: 'bg-slate-600 text-white',
  ecommerce: 'bg-blue-600 text-white',
  engineering: 'bg-emerald-600 text-white',
  ai: 'bg-violet-600 text-white',
  startup: 'bg-orange-600 text-white',
  funding: 'bg-green-600 text-white',
  product: 'bg-pink-600 text-white',
}

interface NewsFeedProps {
  limit?: number
  showHeader?: boolean
  showNewsletter?: boolean
  variant?: 'default' | 'sidebar'
}

export function NewsFeed({ limit = 8, showHeader = true, showNewsletter = true, variant = 'default' }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    setNews(getRecentNews(limit))
  }, [limit])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setNews(getRecentNews(limit))
      setIsRefreshing(false)
    }, 1000)
  }

  return (
    <div className="space-y-0">
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--sentinel-hot)]" />
            <h2 className="font-serif text-xl font-semibold">Live Stream</h2>
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

      <div className="divide-y divide-border">
        {news.map((item, index) => (
          <NewsItemCard key={item.id} item={item} isNew={index === 0} variant={variant} />
        ))}
      </div>

      {/* View Full Stream button */}
      <div className="pt-6">
        <Button variant="outline" className="w-full" asChild>
          <Link href="/news">
            VIEW FULL STREAM
          </Link>
        </Button>
      </div>

      {/* Newsletter signup */}
      {showNewsletter && (
        <div className="mt-8 rounded-xl bg-slate-800 p-6 text-white">
          <h3 className="font-serif text-xl font-semibold italic">Weekly Curated Hits</h3>
          <p className="mt-2 text-sm text-slate-300">
            Join 50k+ makers receiving the best launches in their inbox every Friday.
          </p>
          <div className="mt-4 flex gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border-slate-600 bg-slate-700 text-white placeholder:text-slate-400"
            />
            <Button className="bg-orange-500 text-white hover:bg-orange-600">
              Join
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface NewsItemCardProps {
  item: NewsItem
  isNew?: boolean
  variant?: 'default' | 'sidebar'
}

function NewsItemCard({ item, isNew, variant = 'default' }: NewsItemCardProps) {
  // Determine category from item - using source as fallback
  const category = item.category || item.source
  const categoryLabel = category.toUpperCase()

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-product-link]')) {
      return
    }
    window.open(item.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group cursor-pointer py-5 transition-all hover:bg-secondary/30",
        isNew && "border-l-2 border-l-[var(--sentinel-hot)] pl-4 -ml-4"
      )}
    >
      {/* Category badge + time */}
      <div className="flex items-center gap-2 mb-2">
        <span className={cn(
          "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded",
          categoryColors[category] || 'bg-slate-600 text-white'
        )}>
          {categoryLabel}
        </span>
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(item.publishedAt)}
        </span>
      </div>

      {/* Headline */}
      <h3 className="font-serif text-lg font-semibold leading-snug text-foreground group-hover:text-primary mb-2">
        {item.title}
      </h3>

      {/* Excerpt */}
      {item.excerpt && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          {item.excerpt}
        </p>
      )}

      {/* Author + Source row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {item.author && (
            <>
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[10px] font-bold text-white">
                {item.author.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="text-sm text-foreground">{item.author}</span>
              <span className="text-muted-foreground">•</span>
            </>
          )}
          <span className="text-sm text-muted-foreground">{item.sourceName}</span>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </div>
  )
}
