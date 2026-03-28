'use client'

import Link from 'next/link'
import { Clock, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Article, formatRelativeTime, getProductById } from '@/lib/mock-data'
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
  const featuredProducts = article.featuredProducts
    .map(id => getProductById(id))
    .filter(Boolean)
    .slice(0, 3)

  if (variant === 'featured') {
    return (
      <Link
        href={`/insights/${article.slug}`}
        className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
      >
        <div className="aspect-[21/9] overflow-hidden bg-muted">
          <img
            src={article.coverImage}
            alt={article.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        
        <div className="flex flex-1 flex-col p-6">
          <Badge variant="secondary" className="w-fit">
            {categoryLabels[article.category]}
          </Badge>
          
          <h2 className="mt-3 font-serif text-2xl font-semibold leading-tight group-hover:text-primary">
            {article.title}
          </h2>
          
          <p className="mt-2 text-muted-foreground line-clamp-2">
            {article.excerpt}
          </p>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="h-8 w-8 rounded-full object-cover"
              />
              <div className="text-sm">
                <p className="font-medium">{article.author.name}</p>
                <p className="text-muted-foreground">{article.author.role}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {article.readTime} min read
            </div>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/insights/${article.slug}`}
        className="group flex items-start gap-4 rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-card"
      >
        <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
          <img
            src={article.coverImage}
            alt={article.title}
            className="h-full w-full object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">
            {categoryLabels[article.category]}
          </p>
          <h3 className="mt-0.5 font-medium leading-snug group-hover:text-primary line-clamp-2">
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
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md"
    >
      <div className="aspect-[16/9] overflow-hidden bg-muted">
        <img
          src={article.coverImage}
          alt={article.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      
      <div className="flex flex-1 flex-col p-4">
        <Badge variant="secondary" className="w-fit text-xs">
          {categoryLabels[article.category]}
        </Badge>
        
        <h3 className="mt-2 font-serif text-lg font-semibold leading-snug group-hover:text-primary line-clamp-2">
          {article.title}
        </h3>
        
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {article.excerpt}
        </p>
        
        {/* Featured products */}
        {featuredProducts.length > 0 && (
          <div className="mt-3 flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Featuring:</span>
            <div className="flex -space-x-1">
              {featuredProducts.map(product => product && (
                <img
                  key={product.id}
                  src={product.logo}
                  alt={product.name}
                  title={product.name}
                  className="h-5 w-5 rounded-full border-2 border-card object-cover"
                />
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <img
              src={article.author.avatar}
              alt={article.author.name}
              className="h-6 w-6 rounded-full object-cover"
            />
            <span className="text-sm">{article.author.name}</span>
          </div>
          
          <span className="text-xs text-muted-foreground">
            {article.readTime} min
          </span>
        </div>
      </div>
    </Link>
  )
}

// Section component for displaying multiple articles
interface ArticleSectionProps {
  title: string
  articles: Article[]
  viewAllHref?: string
  variant?: 'grid' | 'list'
}

export function ArticleSection({ title, articles, viewAllHref, variant = 'grid' }: ArticleSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            View all
            <ArrowRight className="h-4 w-4" />
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
        <div className="space-y-2">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} variant="compact" />
          ))}
        </div>
      )}
    </section>
  )
}
