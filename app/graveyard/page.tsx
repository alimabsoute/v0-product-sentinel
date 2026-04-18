export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Skull, Calendar, ArrowLeft, BarChart3, TrendingDown } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabaseAdmin } from '@/lib/supabase-server'
import { searchProducts } from '@/lib/db/products'
import type { Product } from '@/lib/mock-data'
import { brandTitle } from '@/lib/branding'

export const metadata = {
  title: brandTitle('Product Graveyard'),
  description: 'A memorial for discontinued products. Learn from the past to build a better future.',
}

const PAGE_SIZE = 50

interface GraveyardPageProps {
  searchParams: Promise<{ page?: string }>
}

type CategoryCount = { category: string; count: number }

async function getGraveyardStats(): Promise<{
  totalDead: number
  avgSignalScore: number
  topCategories: CategoryCount[]
}> {
  // Total count
  const { count: totalDead } = await supabaseAdmin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .in('status', ['sunset', 'dead', 'acquired', 'discontinued', 'inactive'])

  // Avg signal score for dead products (from product_signal_scores)
  const { data: scoreData } = await supabaseAdmin
    .from('products')
    .select(`
      id,
      product_signal_scores ( signal_score )
    `)
    .in('status', ['sunset', 'dead', 'acquired', 'discontinued', 'inactive'])

  let totalScore = 0
  let scoreCount = 0
  for (const row of (scoreData ?? []) as Array<{
    id: string
    product_signal_scores: { signal_score: number | null }[]
  }>) {
    for (const s of row.product_signal_scores) {
      if (s.signal_score !== null) {
        totalScore += s.signal_score
        scoreCount++
      }
    }
  }
  const avgSignalScore = scoreCount > 0 ? Math.round((totalScore / scoreCount) * 10) : 0

  // Category breakdown for dead products
  const { data: catData } = await supabaseAdmin
    .from('products')
    .select('category')
    .in('status', ['sunset', 'dead', 'acquired', 'discontinued', 'inactive'])

  const catMap: Record<string, number> = {}
  for (const row of (catData ?? []) as { category: string }[]) {
    catMap[row.category] = (catMap[row.category] ?? 0) + 1
  }
  const topCategories: CategoryCount[] = Object.entries(catMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  return { totalDead: totalDead ?? 0, avgSignalScore, topCategories }
}

export default async function GraveyardPage({ searchParams }: GraveyardPageProps) {
  const sp = await searchParams
  const page = sp.page ? Number(sp.page) : 1

  const [stats, result] = await Promise.all([
    getGraveyardStats(),
    searchProducts({ status: 'dead', sort: 'newest', page, limit: PAGE_SIZE }),
  ])

  const deadProducts = result.products
  const maxCatCount = stats.topCategories[0]?.count ?? 1

  // Group current page products by year
  const productsByYear = deadProducts.reduce(
    (acc, product) => {
      const year = new Date(product.launchDate).getFullYear()
      if (!acc[year]) acc[year] = []
      acc[year].push(product)
      return acc
    },
    {} as Record<number, Product[]>,
  )
  const years = Object.keys(productsByYear)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--sentinel-dead)]/10">
            <Skull className="h-8 w-8 text-[var(--sentinel-dead)]" />
          </div>
          <h1 className="font-serif text-3xl font-bold">Product Graveyard</h1>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
            A memorial for products that have been discontinued, sunset, or shut down.
            Learning from these stories helps us build better products.
          </p>
        </div>

        {/* Analytics section */}
        <div className="mb-10 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 rounded-xl border border-border bg-card p-6">
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums">{stats.totalDead.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Dead Products</p>
            </div>
            <div className="text-center border-x border-border">
              <div className="flex items-center justify-center gap-1">
                <TrendingDown className="h-5 w-5 text-[var(--sentinel-falling)]" />
                <p className="text-3xl font-bold tabular-nums">{stats.avgSignalScore}</p>
              </div>
              <p className="text-sm text-muted-foreground">Avg Signal at Death</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <BarChart3 className="h-5 w-5 text-primary" />
                <p className="text-3xl font-bold tabular-nums">{stats.topCategories.length}</p>
              </div>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </div>

          {/* Category breakdown */}
          {stats.topCategories.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-medium mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Deaths by Category
              </h2>
              <div className="space-y-2">
                {stats.topCategories.map(({ category, count }) => {
                  const pct = (count / maxCatCount) * 100
                  const displayName = category
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase())
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <span className="w-32 text-sm text-muted-foreground truncate">{displayName}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--sentinel-dead)]/60"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm tabular-nums w-6 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />

          {years.map((year) => (
            <div key={year} className="relative mb-12">
              {/* Year marker */}
              <div className="sticky top-20 z-10 mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-background bg-muted">
                  <span className="text-lg font-bold">{year}</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {productsByYear[year].length} product
                    {productsByYear[year].length !== 1 ? 's' : ''} discontinued
                  </p>
                </div>
              </div>

              {/* Products */}
              <div className="ml-20 space-y-4">
                {productsByYear[year].map((product) => (
                  <GraveyardCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {result.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
              {page > 1 ? (
                <Link href={`/graveyard?page=${page - 1}`}>Previous</Link>
              ) : (
                <span>Previous</span>
              )}
            </Button>

            <span className="text-sm text-muted-foreground">
              {result.total.toLocaleString()} products · Page {page} of {result.totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= result.totalPages}
              asChild={page < result.totalPages}
            >
              {page < result.totalPages ? (
                <Link href={`/graveyard?page=${page + 1}`}>Next</Link>
              ) : (
                <span>Next</span>
              )}
            </Button>
          </div>
        )}

        {/* Back link */}
        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to active products
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

function GraveyardCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="block rounded-xl border border-border bg-card p-4 transition-all hover:border-[var(--sentinel-dead)]/30 hover:shadow-lg"
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <img
            src={product.logo}
            alt={product.name}
            className="h-14 w-14 rounded-lg object-cover grayscale"
          />
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--sentinel-dead)]">
            <Skull className="h-3 w-3 text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{product.name}</h3>
            <Badge variant="outline" className="text-xs shrink-0">
              {product.category}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{product.tagline}</p>

          {product.statusReason && (
            <p className="mt-2 text-sm text-[var(--sentinel-dead)]">{product.statusReason}</p>
          )}

          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Launched{' '}
              {new Date(product.launchDate).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 border-[var(--sentinel-dead)]/30 text-[var(--sentinel-dead)]"
            >
              {product.status}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  )
}
