'use client'

import { useEffect } from 'react'
import { X, ExternalLink, CheckCircle2, Calendar, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BuzzScore } from './buzz-score'
import { RivalOrbit } from './rival-orbit'
import { MediaCarousel } from './media-carousel'
import type { Product } from '@/lib/mock-data'

interface ProductPanelProps {
  product: Product | null
  onClose: () => void
}

export function ProductPanel({ product, onClose }: ProductPanelProps) {
  // Lock body scroll when panel is open
  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [product])

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && product) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [product, onClose])

  if (!product) return null

  const formattedDate = new Date(product.launchDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute inset-y-0 right-0 w-full max-w-3xl animate-in slide-in-from-right duration-300">
        <div className="flex h-full flex-col overflow-hidden border-l border-border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border p-6">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="h-16 w-16 overflow-hidden rounded-2xl bg-secondary">
                  <img
                    src={product.logo}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                {product.verified && (
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
                    <CheckCircle2 className="h-5 w-5 text-[var(--sentinel-accent)]" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>
                <p className="mt-1 text-muted-foreground">{product.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formattedDate}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    {product.category}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Media */}
              <MediaCarousel product={product} />

              {/* Description */}
              <div className="rounded-2xl border border-border bg-card/50 p-5">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  About
                </h3>
                <p className="text-foreground leading-relaxed">{product.description}</p>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Badges */}
                {product.badges.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.badges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--sentinel-accent)]/10 px-3 py-1 text-xs font-medium text-[var(--sentinel-accent)]"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {badge.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Two column layout for buzz + rivals */}
              <div className="grid gap-6 lg:grid-cols-2">
                <BuzzScore product={product} />
                <RivalOrbit
                  product={product}
                  onSelectRival={(rival) => {
                    // This would navigate to the rival
                    // For now we could trigger panel content change
                  }}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3',
                'bg-[var(--sentinel-accent)] text-[var(--sentinel-accent-foreground, var(--background))]',
                'font-medium transition-all',
                'hover:opacity-90 hover:shadow-lg hover:shadow-[var(--sentinel-glow)]'
              )}
            >
              Visit {product.name}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
