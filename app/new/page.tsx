import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductCard } from '@/components/product-card'
import { brandTitle } from '@/lib/branding'
import { supabaseAdmin } from '@/lib/supabase-server'
import type { Product } from '@/lib/mock-data'

export const metadata = { title: brandTitle('New Arrivals') }
export const revalidate = 3600

const FALLBACK_LOGO = 'https://placehold.co/48x48/e2e8f0/64748b?text=P'

type DbRow = {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  category: string
  launched_year: number | null
  created_at: string
  product_signal_scores: {
    signal_score: number | null
    score_date: string | null
    wow_velocity: number | null
    is_breakout: boolean | null
  }[]
}

const CATEGORY_DISPLAY: Record<string, string> = {
  'ai-tools': 'AI Tools',
  'dev-tools': 'Developer Tools',
  'developer-tools': 'Developer Tools',
  productivity: 'Productivity',
  design: 'Design',
  marketing: 'Marketing',
  analytics: 'Analytics',
  finance: 'Finance',
  communication: 'Communication',
  security: 'Security',
  hardware: 'Hardware',
  entertainment: 'Entertainment',
  education: 'Education',
  health: 'Health',
  'e-commerce': 'E-commerce',
  gaming: 'Gaming',
}

function categoryDisplay(slug: string): string {
  return (
    CATEGORY_DISPLAY[slug] ??
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

function rowToProduct(row: DbRow): Product {
  const scores = row.product_signal_scores ?? []
  const latestScore =
    scores
      .filter((s) => s.score_date !== null && s.signal_score !== null)
      .sort((a, b) => (b.score_date! > a.score_date! ? 1 : -1))[0] ?? null

  const rawScore = latestScore?.signal_score ?? 0
  const wowVelocity = latestScore?.wow_velocity ?? 0

  const buzzTrend: Product['buzz']['trend'] =
    wowVelocity > 5 ? 'rising' : wowVelocity < -5 ? 'falling' : 'stable'

  const launchDate = row.launched_year
    ? new Date(row.launched_year, 0, 1).toISOString()
    : row.created_at

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
    category: categoryDisplay(row.category) as any,
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
      founded: row.launched_year ?? new Date().getFullYear(),
    },
    launchDate,
    lastUpdated: row.created_at,
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

export default async function NewArrivalsPage() {
  const { data } = await supabaseAdmin
    .from('products')
    .select(
      `id, slug, name, description, logo_url, category, launched_year, created_at,
       product_signal_scores(signal_score, score_date, wow_velocity, is_breakout)`,
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50)

  const products = ((data ?? []) as unknown as DbRow[]).map(rowToProduct)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-semibold">New Arrivals</h1>
          <p className="mt-2 text-muted-foreground">Recently added to Prism</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} variant="featured" />
          ))}
        </div>
        {products.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">No products yet.</p>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
