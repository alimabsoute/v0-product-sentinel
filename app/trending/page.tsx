import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { getSignalLeaders, getRecentlyLaunched, getTopByCategory, getBreakouts } from '@/lib/db/trending'
import { TrendingClient } from './_client'

export const metadata = { title: 'Trending — Prism' }
export const revalidate = 3600

export default async function TrendingPage() {
  const [signalLeaders, recentlyLaunched, topByCategory, breakouts] = await Promise.all([
    getSignalLeaders(20),
    getRecentlyLaunched(20),
    getTopByCategory(5),
    getBreakouts(20),
  ])
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <TrendingClient
          signalLeaders={signalLeaders}
          recentlyLaunched={recentlyLaunched}
          topByCategory={topByCategory}
          breakouts={breakouts}
        />
      </main>
      <SiteFooter />
    </div>
  )
}
