export const revalidate = 300  // revalidate every 5 minutes

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { searchProducts } from '@/lib/db/products'
import { supabaseAdmin } from '@/lib/supabase-server'
import { CategoryClient } from './_client'

function displayName(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const display = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return { title: `${display} Products | Prism` }
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

// ─── Stats types ──────────────────────────────────────────────────────────────

export interface CategoryStats {
  total: number
  recentCount: number   // launched 2023+
  avgSignal: number | null
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

async function getCategoryStats(slug: string): Promise<CategoryStats> {
  const today = new Date().toISOString().split('T')[0]

  const [countRes, scoreRes] = await Promise.all([
    // total + launched_year breakdown
    supabaseAdmin
      .from('products')
      .select('launched_year')
      .eq('category', slug)
      .eq('status', 'active'),

    // signal scores for this category today
    supabaseAdmin
      .from('product_signal_scores')
      .select('signal_score, products!inner(category, status)')
      .eq('products.category', slug)
      .eq('products.status', 'active')
      .eq('score_date', today),
  ])

  const rows = (countRes.data ?? []) as { launched_year: number | null }[]
  const total = rows.length
  const recentCount = rows.filter(r => (r.launched_year ?? 0) >= 2023).length

  type ScoreRow = { signal_score: number | null; products: unknown }
  const scores = (scoreRes.data ?? [] as ScoreRow[])
    .map((r) => (r as ScoreRow).signal_score)
    .filter((s): s is number => s !== null)

  const avgSignal = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
    : null

  return { total, recentCount, avgSignal }
}

async function getSubCategories(slug: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('products')
    .select('sub_category')
    .eq('category', slug)
    .eq('status', 'active')
    .not('sub_category', 'is', null)

  type SubRow = { sub_category: string | null }
  const raw = ((data ?? []) as SubRow[]).map(r => r.sub_category as string)
  return [...new Set(raw)].filter(Boolean).sort()
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  // Parallel data fetch
  const [result, stats, subCategories] = await Promise.all([
    searchProducts({ category: slug, limit: 50, status: 'all' }),
    getCategoryStats(slug),
    getSubCategories(slug),
  ])

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <CategoryClient
        slug={slug}
        displayName={displayName(slug)}
        initialProducts={result.products}
        totalCount={result.total}
        totalPages={result.totalPages}
        stats={stats}
        subCategories={subCategories}
      />
      <SiteFooter />
    </div>
  )
}
