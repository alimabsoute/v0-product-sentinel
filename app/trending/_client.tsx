'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TrendingProduct, BreakoutProduct } from '@/lib/db/trending'
import { TrendingUp } from 'lucide-react'

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
  breakouts: BreakoutProduct[]
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

export function TrendingClient({ signalLeaders, recentlyLaunched, topByCategory, breakouts }: Props) {
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

      <Tabs defaultValue="breakouts">
        <TabsList className="mb-6">
          <TabsTrigger value="breakouts">Breakouts</TabsTrigger>
          <TabsTrigger value="signal-leaders">Signal Leaders</TabsTrigger>
          <TabsTrigger value="recently-launched">Recently Launched</TabsTrigger>
          <TabsTrigger value="by-category">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="breakouts">
          <div className="space-y-2">
            {breakouts.length === 0 || breakouts.every(b => b.wow_velocity === 0) ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <TrendingUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm font-medium">No breakouts detected yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Breakouts appear after signal history accumulates. Run{' '}
                  <code className="bg-muted px-1 rounded text-xs">pnpm seed:scores</code> to bootstrap.
                </p>
              </div>
            ) : (
              breakouts.map((product, i) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  rank={i + 1}
                  trailing={
                    <span className="flex-shrink-0 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 font-mono text-xs font-semibold text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400">
                      +{product.wow_velocity.toFixed(1)}% WoW
                    </span>
                  }
                />
              ))
            )}
          </div>
        </TabsContent>

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
