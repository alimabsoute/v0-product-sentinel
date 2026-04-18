'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PressMentionWithProduct } from '@/lib/db/news'
import { cn } from '@/lib/utils'

function formatRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const categoryColors: Record<string, string> = {
  insights: 'bg-slate-800',
  design: 'bg-pink-600',
  ecommerce: 'bg-blue-600',
  engineering: 'bg-emerald-600',
  ai: 'bg-violet-600',
  startup: 'bg-amber-600',
  funding: 'bg-green-600',
  product: 'bg-cyan-600',
}

interface NewsFeedProps {
  initialItems?: PressMentionWithProduct[]
  limit?: number
  showHeader?: boolean
  showNewsletter?: boolean
}

export function NewsFeed({
  initialItems = [],
  limit = 8,
  showHeader = true,
  showNewsletter = true,
}: NewsFeedProps) {
  const news = initialItems.slice(0, limit)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [email, setEmail] = useState('')

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 800)
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 p-5">
      {showHeader && (
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <h2 className="font-serif text-lg font-semibold">Live Stream</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 text-xs text-muted-foreground"
          >
            <RefreshCw className={cn("h-3 w-3 mr-1", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      )}

      <div className="space-y-0 divide-y divide-border/50">
        {news.length > 0 ? (
          news.map((item) => (
            <NewsItemCard key={item.id} item={item} />
          ))
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <p className="font-medium">No press mentions yet</p>
            <p className="mt-1 text-xs">Check back as products get covered</p>
          </div>
        )}
      </div>

      <div className="mt-5">
        <Button variant="outline" size="sm" className="w-full rounded-xl text-xs" asChild>
          <Link href="/news">View Full Stream</Link>
        </Button>
      </div>

      {showNewsletter && (
        <div className="mt-5 rounded-xl bg-slate-900 p-5 text-white">
          <h3 className="font-serif text-lg font-semibold">Weekly Curated Hits</h3>
          <p className="mt-1.5 text-sm text-slate-400">
            Join 50k+ makers receiving the best launches every Friday.
          </p>
          <div className="mt-4 flex gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-lg border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 text-sm h-9"
            />
            <Button size="sm" className="rounded-lg bg-primary px-4 h-9">
              Join
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface NewsItemCardProps {
  item: PressMentionWithProduct
}

function NewsItemCard({ item }: NewsItemCardProps) {
  // Map source to a rough category color
  const src = (item.source ?? 'insights').toLowerCase()
  const category = src.includes('tech') ? 'engineering'
    : src.includes('ai') || src.includes('openai') ? 'ai'
    : src.includes('fund') || src.includes('venture') ? 'funding'
    : src.includes('product') ? 'product'
    : 'insights'

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block py-4 transition-colors hover:bg-secondary/30 -mx-5 px-5"
    >
      <div className="flex items-center gap-2 text-xs mb-1.5">
        <span className={cn(
          "px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide text-white",
          categoryColors[category] ?? 'bg-slate-800'
        )}>
          {item.source ?? 'news'}
        </span>
        <span className="text-muted-foreground">
          {item.published_at ? formatRelativeTime(item.published_at) : ''}
        </span>
      </div>

      <h3 className="font-medium leading-snug text-foreground group-hover:text-primary transition-colors">
        {item.title}
      </h3>

      {item.product_name && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          re: {item.product_name}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {item.sentiment && (
            <span className={cn(
              'font-medium',
              item.sentiment === 'positive' && 'text-[var(--sentinel-rising)]',
              item.sentiment === 'negative' && 'text-[var(--sentinel-falling)]',
            )}>
              {item.sentiment}
            </span>
          )}
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </a>
  )
}
