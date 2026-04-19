import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductCard } from '@/components/product-card'
import { getCollectionById } from '@/lib/db/collections'
import { supabaseAdmin } from '@/lib/supabase-server'
import type { Product } from '@/lib/mock-data'

export const revalidate = 3600

const FALLBACK_LOGO = 'https://placehold.co/48x48/e2e8f0/64748b?text=P'

type SignalScore = {
  signal_score: number | null
  score_date: string | null
  wow_velocity: number | null
  is_breakout: boolean | null
}

type ProductRow = {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  category: string
  status: string | null
  product_signal_scores: SignalScore[]
}

type CpRow = {
  product_id: string
  products: ProductRow
}

function rowToProduct(row: ProductRow): Product {
  const scores = row.product_signal_scores ?? []
  const latestScore =
    scores
      .filter((s) => s.score_date !== null && s.signal_score !== null)
      .sort((a, b) => (b.score_date! > a.score_date! ? 1 : -1))[0] ?? null

  const rawScore = latestScore?.signal_score ?? 0
  const wowVelocity = latestScore?.wow_velocity ?? 0
  const buzzTrend: Product['buzz']['trend'] =
    wowVelocity > 5 ? 'rising' : wowVelocity < -5 ? 'falling' : 'stable'

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.description ? row.description.split('.')[0].trim() : row.name,
    description: row.description ?? '',
    logo: row.logo_url ?? FALLBACK_LOGO,
    url: '#',
    source_url: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    category: row.category as any,
    tags: [],
    characteristics: {
      pricing: 'freemium',
      platforms: ['web'],
      teamSize: '2-5',
      openSource: false,
      hasAPI: false,
      aiPowered: row.category === 'ai-tools',
      targetAudience: ['developers'],
      funding: 'bootstrapped' as const,
      founded: new Date().getFullYear(),
    },
    launchDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    status: 'active',
    buzz: {
      score: Math.round(rawScore * 10),
      trend: buzzTrend,
      weeklyChange: +wowVelocity.toFixed(1),
      sparkline: [0, 0, 0, 0, 0, 0, 0],
      sources: { twitter: 0, reddit: 0, hackerNews: 0, news: 0 },
    },
    screenshots: [],
    competitors: [],
    integrations: [],
    badges: [],
    saves: 0,
    views: 0,
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const collection = await getCollectionById(id)
  return { title: collection ? `${collection.name} | Prism Lists` : 'List | Prism' }
}

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const collection = await getCollectionById(id)
  if (!collection) notFound()

  const { data: cpRows } = await supabaseAdmin
    .from('collection_products')
    .select(
      `product_id, products!inner(id, slug, name, logo_url, category, description, status,
        product_signal_scores(signal_score, score_date, wow_velocity, is_breakout))`,
    )
    .eq('collection_id', id)
    .order('added_at', { ascending: false })

  const products = ((cpRows ?? []) as unknown as CpRow[]).map((r) => rowToProduct(r.products))

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/lists" className="hover:text-foreground transition-colors">
            ← Lists
          </Link>
        </nav>

        <div className="mb-8">
          <h1 className="font-serif text-3xl font-semibold">{collection.name}</h1>
          {collection.description && (
            <p className="mt-2 text-muted-foreground">{collection.description}</p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        </div>

        {products.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">This collection is empty.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} variant="featured" />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
