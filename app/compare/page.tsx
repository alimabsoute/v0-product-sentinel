import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CompareClient } from './_client'
import { getProductBySlug } from '@/lib/db/products'
import { supabaseAdmin } from '@/lib/supabase-server'
import { brandTitle } from '@/lib/branding'

export const metadata = {
  title: brandTitle('Compare Products'),
  description: 'Compare two tech products side-by-side with signal scores and characteristics.',
}

interface ComparePageProps {
  searchParams: Promise<{ a?: string; b?: string }>
}

type SignalHistoryRow = {
  score_date: string
  signal_score: number | null
}

async function fetchSignalHistory(productId: string): Promise<{ date: string; score: number }[]> {
  const { data } = await supabaseAdmin
    .from('product_signal_scores')
    .select('score_date, signal_score')
    .eq('product_id', productId)
    .order('score_date', { ascending: true })
    .limit(30)
  return ((data ?? []) as SignalHistoryRow[]).map((r) => ({
    date: r.score_date,
    score: r.signal_score ?? 0,
  }))
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const sp = await searchParams
  const slugA = sp.a?.trim()
  const slugB = sp.b?.trim()

  // Fetch both products and their histories in parallel if slugs provided
  let productA = null
  let productB = null
  let historyA: { date: string; score: number }[] = []
  let historyB: { date: string; score: number }[] = []

  if (slugA && slugB) {
    const [pA, pB] = await Promise.all([
      getProductBySlug(slugA),
      getProductBySlug(slugB),
    ])
    productA = pA
    productB = pB

    if (productA && productB) {
      ;[historyA, historyB] = await Promise.all([
        fetchSignalHistory(productA.id),
        fetchSignalHistory(productB.id),
      ])
    }
  } else if (slugA) {
    productA = await getProductBySlug(slugA)
    if (productA) historyA = await fetchSignalHistory(productA.id)
  } else if (slugB) {
    productB = await getProductBySlug(slugB)
    if (productB) historyB = await fetchSignalHistory(productB.id)
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">Compare Products</h1>
          <p className="mt-2 text-muted-foreground">
            Search for two products to compare side-by-side
          </p>
        </div>
        <Suspense fallback={null}>
          <CompareClient
            initialProductA={productA ? {
              id: productA.id,
              slug: productA.slug,
              name: productA.name,
              tagline: productA.tagline,
              logo: productA.logo,
              category: productA.category,
              tags: productA.tags,
              status: productA.status,
              launchDate: productA.launchDate,
              buzz: productA.buzz,
              signalHistory: historyA,
            } : null}
            initialProductB={productB ? {
              id: productB.id,
              slug: productB.slug,
              name: productB.name,
              tagline: productB.tagline,
              logo: productB.logo,
              category: productB.category,
              tags: productB.tags,
              status: productB.status,
              launchDate: productB.launchDate,
              buzz: productB.buzz,
              signalHistory: historyB,
            } : null}
          />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
