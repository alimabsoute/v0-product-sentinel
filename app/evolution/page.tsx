export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import {
  getRecentActiveProducts,
  getRecentDeadProducts,
  getCategoryGrowthByYear,
} from '@/lib/db/evolution'
import { EvolutionClient } from './_client'

export default async function EvolutionPage() {
  const [recentActiveProducts, recentDeadProducts, categoryGrowthData] = await Promise.all([
    getRecentActiveProducts(6),
    getRecentDeadProducts(12),
    getCategoryGrowthByYear(2020),
  ])

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <span>Market Evolution</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-medium mb-4 text-balance">
            How the Market Has Evolved
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Track how product categories, characteristics, and market dynamics have shifted over time.
            Understand where we&apos;ve been to see where we&apos;re going.
          </p>
        </div>

        <EvolutionClient
          recentActiveProducts={recentActiveProducts}
          recentDeadProducts={recentDeadProducts}
          categoryGrowthData={categoryGrowthData}
        />
      </main>

      <SiteFooter />
    </div>
  )
}
