import { getGraphData, getGraphCategories } from '@/lib/db/graph'
import { ExplorePage } from './_client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ExploreServerPage() {
  const [graphData, categories] = await Promise.all([
    getGraphData({ limit: 500 }),
    getGraphCategories(),
  ])
  return <ExplorePage initialGraph={graphData} categories={categories} />
}
