import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SubmitClient } from './_client'
import { brandTitle } from '@/lib/branding'

export const metadata = { title: brandTitle('Submit a Product') }

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <SubmitClient />
      </main>
      <SiteFooter />
    </div>
  )
}
