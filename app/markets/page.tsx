export const revalidate = 300  // revalidate every 5 minutes

import { brandTitle } from '@/lib/branding'
import { SiteHeader } from '@/components/site-header'

export const metadata = {
  title: brandTitle('Market Analytics'),
  description: 'Category trends, signal distribution, velocity leaders, and survival rates across 17,000+ tracked products.',
}
import { SiteFooter } from '@/components/site-footer'
import {
  getCategoryDistribution,
  getSignalDistribution,
  getVelocityLeaders,
  getNewProductRate,
  getCategoryGrowth,
  getSurvivalRates,
  getMarketStats,
  getCohortShare,
} from '@/lib/db/analytics'
import { MarketsClient } from './_client'

export default async function MarketsPage() {
  const [
    stats,
    categoryDistribution,
    signalDistribution,
    velocityLeaders,
    newProductRate,
    categoryGrowth,
    survivalRates,
    cohortShare,
  ] = await Promise.all([
    getMarketStats(),
    getCategoryDistribution(),
    getSignalDistribution(),
    getVelocityLeaders(10),
    getNewProductRate(),
    getCategoryGrowth(),
    getSurvivalRates(),
    getCohortShare('capability'),
  ])

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif text-3xl font-medium tracking-tight">
              Market Intelligence
            </h1>
            <span className="text-sm text-muted-foreground font-mono">
              {stats.totalProducts.toLocaleString()} products tracked
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time signal analysis across {stats.totalCategories} categories
          </p>
        </div>

        <MarketsClient
          stats={stats}
          categoryDistribution={categoryDistribution}
          signalDistribution={signalDistribution}
          velocityLeaders={velocityLeaders}
          newProductRate={newProductRate}
          categoryGrowth={categoryGrowth}
          survivalRates={survivalRates}
          cohortShare={cohortShare}
        />
      </main>
      <SiteFooter />
    </div>
  )
}
