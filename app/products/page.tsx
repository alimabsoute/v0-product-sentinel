export const dynamic = 'force-dynamic'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { getProductCount, getDistinctCategories } from '@/lib/db/products'
import { ProductsClient } from './_client'

export default async function ProductsPage() {
  const [totalCount, categories] = await Promise.all([
    getProductCount(),
    getDistinctCategories(),
  ])

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProductsClient categories={categories} totalCount={totalCount} />
      </main>
      <SiteFooter />
    </div>
  )
}
