import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { getTagGroups } from '@/lib/db/tags'
import { FunctionsClient } from './_client'

export const metadata = { title: 'Functions — Prism' }
export const revalidate = 3600

export default async function FunctionsPage() {
  const tagGroups = await getTagGroups()
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <FunctionsClient tagGroups={tagGroups} />
      </main>
      <SiteFooter />
    </div>
  )
}
