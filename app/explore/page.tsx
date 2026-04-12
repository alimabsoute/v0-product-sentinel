import { getActiveProducts } from '@/lib/db/products'
import { ExplorePage } from './_client'

export default async function ExploreServerPage() {
  const products = await getActiveProducts(100)
  return <ExplorePage initialProducts={products} />
}
