export const dynamic = 'force-dynamic'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { getActiveProducts, getProductCount } from '@/lib/db/products'
import { ProductsClient } from './_client'

export default async function ProductsPage() {
  const [products, totalCount] = await Promise.all([
    getActiveProducts(200),
    getProductCount(),
  ])

  // Derive unique display categories from the real data
  const categories = [...new Set(products.map(p => p.category))].sort()

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProductsClient products={products} categories={categories} totalCount={totalCount} />
      </main>
      <SiteFooter />
    </div>
  )
}
