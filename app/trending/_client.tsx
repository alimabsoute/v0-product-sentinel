'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TrendingProduct } from '@/lib/db/trending'

const FALLBACK_LOGO = 'https://placehold.co/40x40/e2e8f0/64748b?text=P'

type TopByCategoryItem = {
  category: string
  display: string
  product: TrendingProduct
}

type Props = {
  signalLeaders: TrendingProduct[]
  recentlyLaunched: TrendingProduct[]
  topByCategory: TopByCategoryItem[]
}

function ProductLogo({ src, name }: { src: string | null; name: string }) {
  const [imgSrc, setImgSrc] = useState(src ?? FALLBACK_LOGO)
  return (
    <img
      src={imgSrc}
      alt={name}
      width={40}
      height={40}
      className="h-10 w-10 rounded-lg object-cover flex-shrink-0 border border-border/50"
      onError={() => setImgSrc(FALLBACK_LOGO)}
    />
  )
}

function ProductRow({
  product,
  rank,
  trailing,
}: {
  product: TrendingProduct
  rank: number
  trailing: React.ReactNode
}) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-accent/40"
    >
      <span className="w-6 flex-shrink-0 font-mono text-xs text-muted-foreground text-right">
        {rank}
      </span>
      <ProductLogo src={product.logo_url} name={product.name} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-foreground">{product.name}</span>
        <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0">
          {product.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </Badge>
      </div>
      {trailing}
    </Link>
  )
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="flex-shrink-0 rounded-lg border border-border bg-muted px-2.5 py-1 font-mono text-xs font-semibold text-foreground">
      {score.toFixed(1)}
    </span>
  )
}

function YearBadge({ year }: { year: number | null }) {
  return (
    <span className="flex-shrink-0 rounded-lg border border-border bg-muted px-2.5 py-1 font-mono text-xs font-semibold text-foreground">
      {year ?? '—'}
    </span>
  )
}

export function TrendingClient({ signalLeaders, recentlyLaunched, topByCategory }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Trending
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Signal leaders, breakouts, and recently launched products.
        </p>
      </div>

      <Tabs defaultValue="signal-leaders">
        <TabsList className="mb-6">
          <TabsTrigger value="signal-leaders">Signal Leaders</TabsTrigger>
          <TabsTrigger value="recently-launched">Recently Launched</TabsTrigger>
          <TabsTrigger value="by-category">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="signal-leaders">
          <div className="space-y-2">
            {signalLeaders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data available.</p>
            ) : (
              signalLeaders.map((product, i) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  rank={i + 1}
                  trailing={<ScoreBadge score={product.signal_score} />}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="recently-launched">
          <div className="space-y-2">
            {recentlyLaunched.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data available.</p>
            ) : (
              recentlyLaunched.map((product, i) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  rank={i + 1}
                  trailing={<YearBadge year={product.launched_year} />}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="by-category">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topByCategory.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                No data available.
              </p>
            ) : (
              topByCategory.map(({ category, display, product }) => (
                <div
                  key={category}
                  className="rounded-xl border border-border bg-card p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{display}</span>
                  </div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-background px-3 py-2.5 transition-colors hover:bg-accent/40"
                  >
                    <ProductLogo src={product.logo_url} name={product.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {product.signal_score.toFixed(1)}
                      </p>
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
