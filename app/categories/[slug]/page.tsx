export const dynamic = 'force-dynamic'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { searchProducts } from '@/lib/db/products'
import { CategoryClient } from './_client'

function displayName(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  // Fetch first page of products + total count for this category
  const result = await searchProducts({ category: slug, limit: 50, status: 'all' })

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <CategoryClient
        slug={slug}
        displayName={displayName(slug)}
        initialProducts={result.products}
        totalCount={result.total}
        totalPages={result.totalPages}
      />
      <SiteFooter />
    </div>
  )
}
