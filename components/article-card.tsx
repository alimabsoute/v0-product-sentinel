'use client'

import Link from 'next/link'
import { Clock, ArrowRight } from 'lucide-react'
import type { Article } from '@/lib/mock-data'

function formatRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
import { cn } from '@/lib/utils'

interface ArticleCardProps {
  article: Article
  variant?: 'default' | 'featured' | 'compact'
}

const categoryLabels: Record<string, string> = {
  'market-analysis': 'Market Analysis',
  'teardown': 'Product Teardown',
  'trend-report': 'Trend Report',
  'comparison': 'Comparison',
  'interview': 'Interview',
}

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  // featuredProducts will be wired from DB in Day 7 when articles are ingested
  const featuredProducts: never[] = []

  if (variant === 'featured') {
    return (
      <Link
        href={`/insights/${article.slug}`}
        className="group relative flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-border/50 bg-card/50 transition-all hover:shadow-lg"
      >
        <div className="sm:w-2/5 aspect-[16/9] sm:aspect-auto overflow-hidden bg-secondary">
          <img
            src={article.coverImage}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        
        <div className="flex flex-1 flex-col p-6">
          <span className="text-xs font-medium text-primary uppercase tracking-wide">
            {categoryLabels[article.category]}
          </span>
          
          <h2 className="mt-2 font-serif text-xl font-semibold leading-tight group-hover:text-primary transition-colors">
            {article.title}
          </h2>
          
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {article.excerpt}
          </p>
          
          <div className="mt-auto pt-4 flex items-center gap-3 text-sm text-muted-foreground">
            <span>{article.author.name}</span>
            <span>·</span>
            <span>{article.readTime} min read</span>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/insights/${article.slug}`}
        className="group flex items-start gap-4 p-2 -mx-2 rounded-xl transition-colors hover:bg-secondary/50"
      >
        <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
          <img
            src={article.coverImage}
            alt={article.title}
            className="h-full w-full object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {article.readTime} min read
          </p>
        </div>
      </Link>
    )
  }

  // Default
  return (
    <Link
      href={`/insights/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/50 transition-all hover:shadow-md"
    >
      <div className="aspect-[16/9] overflow-hidden bg-secondary">
        <img
          src={article.coverImage}
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-medium text-primary uppercase tracking-wide">
          {categoryLabels[article.category]}
        </span>
        
        <h3 className="mt-2 font-serif text-lg font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>
        
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {article.excerpt}
        </p>
        
        <div className="mt-auto pt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <img
            src={article.author.avatar}
            alt={article.author.name}
            className="h-5 w-5 rounded-full object-cover"
          />
          <span>{article.author.name}</span>
          <span>·</span>
          <span>{article.readTime} min</span>
        </div>
      </div>
    </Link>
  )
}

interface ArticleSectionProps {
  title: string
  articles: Article[]
  viewAllHref?: string
  variant?: 'grid' | 'list'
}

export function ArticleSection({ title, articles, viewAllHref, variant = 'grid' }: ArticleSectionProps) {
  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      
      {variant === 'grid' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} variant="compact" />
          ))}
        </div>
      )}
    </section>
  )
}
