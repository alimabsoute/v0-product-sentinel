import { getActiveProducts } from '@/lib/db/products'
import { ExplorePage } from './_client'

export const dynamic = 'force-dynamic'

export default async function ExploreServerPage() {
  const products = await getActiveProducts(100)
  return <ExplorePage initialProducts={products} />
}
