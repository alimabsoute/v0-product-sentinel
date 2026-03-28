'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { products, type Product } from '@/lib/mock-data'

interface SearchDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (product: Product) => void
}

export function SearchDialog({ open, onClose, onSelect }: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const results = useMemo(() => {
    if (!query.trim()) {
      // Show trending products when no query
      return products.filter((p) => p.buzzTrend === 'rising').slice(0, 6)
    }

    const lowerQuery = query.toLowerCase()
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.tagline.toLowerCase().includes(lowerQuery) ||
          p.tags.some((t) => t.toLowerCase().includes(lowerQuery)) ||
          p.category.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 8)
  }, [query])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (!open) {
          // Parent handles opening
        } else {
          onClose()
        }
      }

      if (!open) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        onSelect(results[selectedIndex])
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, results, selectedIndex, onSelect])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-xl animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="h-14 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
              autoFocus
            />
            <kbd className="rounded border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {!query && (
              <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Trending Now
              </div>
            )}

            {results.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No products found
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((product, index) => {
                  const TrendIcon =
                    product.buzzTrend === 'rising'
                      ? TrendingUp
                      : product.buzzTrend === 'falling'
                        ? TrendingDown
                        : Minus

                  return (
                    <button
                      key={product.id}
                      onClick={() => {
                        onSelect(product)
                        onClose()
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors',
                        selectedIndex === index
                          ? 'bg-[var(--sentinel-accent)]/10'
                          : 'hover:bg-secondary'
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <img
                          src={product.logo}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-foreground">
                          {product.name}
                        </div>
                        <div className="truncate text-sm text-muted-foreground">
                          {product.tagline}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <TrendIcon
                          className={cn(
                            'h-3.5 w-3.5',
                            product.buzzTrend === 'rising'
                              ? 'text-[var(--sentinel-rising)]'
                              : product.buzzTrend === 'falling'
                                ? 'text-[var(--sentinel-falling)]'
                                : 'text-muted-foreground'
                          )}
                        />
                        <span className="font-semibold tabular-nums">
                          {product.buzzScore}
                        </span>
                      </div>
                      {selectedIndex === index && (
                        <ArrowRight className="h-4 w-4 text-[var(--sentinel-accent)]" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
