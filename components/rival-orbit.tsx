'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { getProduct, type Product } from '@/lib/mock-data'

interface RivalOrbitProps {
  product: Product
  onSelectRival: (product: Product) => void
}

export function RivalOrbit({ product, onSelectRival }: RivalOrbitProps) {
  const [animated, setAnimated] = useState(false)
  const [hoveredRival, setHoveredRival] = useState<string | null>(null)

  const rivals = product.rivals
    .map((id) => getProduct(id))
    .filter((p): p is Product => p !== undefined)
    .slice(0, 4)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200)
    return () => {
      clearTimeout(timer)
      setAnimated(false)
    }
  }, [product.id])

  // Calculate positions for rivals in an orbit pattern
  const getPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2
    const radius = 90
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Competitors
      </h3>

      {rivals.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No competitors mapped yet
        </div>
      ) : (
        <div className="relative mx-auto h-64 w-64">
          {/* Orbit rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-48 rounded-full border border-dashed border-border/50" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 rounded-full border border-dashed border-border/30" />
          </div>

          {/* Connection lines */}
          <svg className="absolute inset-0 h-full w-full">
            {rivals.map((rival, index) => {
              const pos = getPosition(index, rivals.length)
              return (
                <line
                  key={`line-${rival.id}`}
                  x1="50%"
                  y1="50%"
                  x2={`calc(50% + ${pos.x}px)`}
                  y2={`calc(50% + ${pos.y}px)`}
                  className={cn(
                    'transition-all duration-500',
                    hoveredRival === rival.id
                      ? 'stroke-[var(--sentinel-accent)]'
                      : 'stroke-border/50'
                  )}
                  strokeWidth={hoveredRival === rival.id ? 2 : 1}
                  strokeDasharray={hoveredRival === rival.id ? '0' : '4 4'}
                  style={{
                    opacity: animated ? 1 : 0,
                    transitionDelay: `${index * 100 + 200}ms`,
                  }}
                />
              )
            })}
          </svg>

          {/* Center product */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className={cn(
                'relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[var(--sentinel-accent)] bg-card shadow-lg shadow-[var(--sentinel-glow)] transition-all duration-500',
                animated ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              )}
            >
              <img
                src={product.logo}
                alt={product.name}
                className="h-12 w-12 rounded-xl object-cover"
              />
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--sentinel-accent)] text-[10px] font-bold text-background">
                {product.buzzScore > 900 ? '!' : '#1'}
              </div>
            </div>
          </div>

          {/* Rival products */}
          {rivals.map((rival, index) => {
            const pos = getPosition(index, rivals.length)
            const isHovered = hoveredRival === rival.id

            return (
              <button
                key={rival.id}
                onClick={() => onSelectRival(rival)}
                onMouseEnter={() => setHoveredRival(rival.id)}
                onMouseLeave={() => setHoveredRival(null)}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 focus:outline-none"
                style={{
                  transform: animated
                    ? `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${isHovered ? 1.15 : 1})`
                    : 'translate(-50%, -50%) scale(0)',
                  transitionDelay: animated ? `${index * 100}ms` : '0ms',
                }}
              >
                <div
                  className={cn(
                    'relative flex h-12 w-12 items-center justify-center rounded-xl border bg-card shadow-md transition-all duration-200',
                    isHovered
                      ? 'border-[var(--sentinel-accent)] shadow-lg shadow-[var(--sentinel-glow)]'
                      : 'border-border'
                  )}
                >
                  <img
                    src={rival.logo}
                    alt={rival.name}
                    className="h-9 w-9 rounded-lg object-cover"
                  />
                </div>

                {/* Tooltip */}
                <div
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-popover px-3 py-1.5 text-sm shadow-lg transition-all duration-200',
                    isHovered
                      ? 'opacity-100 -bottom-10'
                      : 'opacity-0 -bottom-8 pointer-events-none'
                  )}
                >
                  <div className="font-medium text-foreground">{rival.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Buzz: {rival.buzzScore}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Rival list for mobile/reference */}
      <div className="mt-4 space-y-2">
        {rivals.map((rival) => (
          <button
            key={rival.id}
            onClick={() => onSelectRival(rival)}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-secondary"
          >
            <img
              src={rival.logo}
              alt={rival.name}
              className="h-8 w-8 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">
                {rival.name}
              </div>
              <div className="text-xs text-muted-foreground">{rival.tagline}</div>
            </div>
            <div className="text-sm font-semibold tabular-nums text-muted-foreground">
              {rival.buzzScore}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
