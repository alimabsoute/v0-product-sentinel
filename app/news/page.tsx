export const revalidate = 300

import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { getNewsArchive, getPressMentionStats, getNewsPublications } from '@/lib/db/news'
import { brandTitle } from '@/lib/branding'
import { NewsArchiveClient } from './_client'

export const metadata = {
  title: brandTitle('News Archive'),
  description: 'Every product press mention, permanently archived.',
}

export default async function NewsPage() {
  const [initialData, stats, publications] = await Promise.all([
    getNewsArchive({ page: 1, limit: 50, sort: 'newest' }),
    getPressMentionStats(),
    getNewsPublications(),
  ])

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Suspense fallback={<NewsArchiveSkeleton />}>
          <NewsArchiveClient
            initialData={initialData}
            totalMentions={stats.totalMentions}
            publications={publications}
          />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}

function NewsArchiveSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 rounded bg-muted animate-pulse" />
      <div className="h-10 rounded-xl bg-muted animate-pulse" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex gap-4 py-4">
          <div className="w-6 h-4 rounded bg-muted animate-pulse shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
