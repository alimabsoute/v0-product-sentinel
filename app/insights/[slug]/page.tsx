import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Clock, Share2, Bookmark } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getProductBySlug } from '@/lib/db/products'
import { cn } from '@/lib/utils'

interface InsightPageProps {
  params: Promise<{ slug: string }>
}

const sentimentColors: Record<string, string> = {
  positive: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  negative: 'bg-red-100 text-red-800 border-red-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default async function InsightPage({ params }: InsightPageProps) {
  const { slug } = await params

  // slug is a press_mention id (UUID or any string PK)
  const { data: mention, error } = await supabaseAdmin
    .from('press_mentions')
    .select(`
      id, title, url, source, published_at, sentiment, description,
      product_id,
      products ( name, slug, logo_url, category, description )
    `)
    .eq('id', slug)
    .maybeSingle()

  if (error || !mention) {
    notFound()
  }

  type MentionRow = {
    id: string
    title: string
    url: string
    source: string | null
    published_at: string | null
    sentiment: string | null
    description: string | null
    product_id: string
    products: {
      name: string
      slug: string
      logo_url: string | null
      category: string
      description: string | null
    } | null
  }

  const m = mention as MentionRow
  const product = m.products ? await getProductBySlug(m.products.slug) : null

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            href="/insights"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to insights
          </Link>
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {m.source && (
              <Badge variant="secondary">{m.source}</Badge>
            )}
            {m.sentiment && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  sentimentColors[m.sentiment] ?? sentimentColors.neutral,
                )}
              >
                {m.sentiment}
              </Badge>
            )}
          </div>

          <h1 className="font-serif text-3xl font-bold leading-tight sm:text-4xl">
            {m.title}
          </h1>

          {m.description && (
            <p className="mt-4 text-lg text-muted-foreground">
              {m.description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {m.source && (
              <span className="font-medium text-foreground">{m.source}</span>
            )}
            {m.published_at && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{formatDate(m.published_at)}</span>
                <span className="text-xs opacity-60">({formatRelativeTime(m.published_at)})</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Bookmark className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button asChild size="sm">
              <a href={m.url} target="_blank" rel="noopener noreferrer">
                Read Article
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </header>

        {/* Linked Product */}
        {product && (
          <section className="mb-8 rounded-xl border border-border bg-card p-5">
            <h2 className="font-serif text-lg font-semibold mb-4">Mentioned Product</h2>
            <ProductCard product={product} variant="compact" />
          </section>
        )}

        {/* No full content — this is just a mention card; link out */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            This is a press mention tracked by Prism. Read the full article on the original source.
          </p>
          <Button asChild>
            <a href={m.url} target="_blank" rel="noopener noreferrer">
              Read Full Article
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
