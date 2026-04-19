import { brandTitle } from '@/lib/branding'
import { getGraphData, getGraphCategories } from '@/lib/db/graph'
import { ExplorePage } from './_client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: brandTitle('Explore'),
  description: 'Force graph exploration of product relationships, categories, and connections.',
}

export default async function ExploreServerPage() {
  const [graphData, categories] = await Promise.all([
    getGraphData({ limit: 500 }),
    getGraphCategories(),
  ])
  return <ExplorePage initialGraph={graphData} categories={categories} />
}
