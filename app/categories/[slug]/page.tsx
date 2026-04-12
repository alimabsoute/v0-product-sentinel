import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { getProductsByCategory } from '@/lib/db/products'
import { CategoryClient } from './_client'

function displayName(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const products = await getProductsByCategory(slug, 100)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <CategoryClient slug={slug} displayName={displayName(slug)} products={products} />
      <SiteFooter />
    </div>
  )
}
