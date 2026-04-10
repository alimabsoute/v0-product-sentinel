import Link from 'next/link'
import { Skull, Calendar, ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Badge } from '@/components/ui/badge'
import { getDeadProducts, type Product } from '@/lib/mock-data'
import { brandTitle } from '@/lib/branding'

export const metadata = {
  title: brandTitle('Product Graveyard'),
  description: 'A memorial for discontinued products. Learn from the past to build a better future.',
}

export default function GraveyardPage() {
  const deadProducts = getDeadProducts()

  // Group by year
  const productsByYear = deadProducts.reduce((acc, product) => {
    const year = new Date(product.sunsetDate || product.launchDate).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(product)
    return acc
  }, {} as Record<number, Product[]>)

  const years = Object.keys(productsByYear).map(Number).sort((a, b) => b - a)

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

        {/* Stats */}
        <div className="mb-12 grid grid-cols-3 gap-4 rounded-xl border border-border bg-card p-6">
          <div className="text-center">
            <p className="text-3xl font-bold tabular-nums">{deadProducts.length}</p>
            <p className="text-sm text-muted-foreground">Products</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-3xl font-bold tabular-nums">{years.length}</p>
            <p className="text-sm text-muted-foreground">Years</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold tabular-nums">
              {deadProducts.reduce((acc, p) => acc + p.views, 0).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Views</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />

          {years.map(year => (
            <div key={year} className="relative mb-12">
              {/* Year marker */}
              <div className="sticky top-20 z-10 mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-background bg-muted">
                  <span className="text-lg font-bold">{year}</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {productsByYear[year].length} product{productsByYear[year].length !== 1 ? 's' : ''} discontinued
                  </p>
                </div>
              </div>

              {/* Products */}
              <div className="ml-20 space-y-4">
                {productsByYear[year].map(product => (
                  <GraveyardCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))}
        </div>

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
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
            {product.tagline}
          </p>

          {product.statusReason && (
            <p className="mt-2 text-sm text-[var(--sentinel-dead)]">
              {product.statusReason}
            </p>
          )}

          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {product.sunsetDate 
                ? `Sunset ${new Date(product.sunsetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                : `Launched ${new Date(product.launchDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
              }
            </span>
            <span>
              {product.characteristics.teamSize}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
