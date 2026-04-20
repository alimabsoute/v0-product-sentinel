import { NextRequest, NextResponse } from 'next/server'
import { getGraphData, type GraphViewMode } from '@/lib/db/graph'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const viewMode = (searchParams.get('viewMode') ?? 'category') as GraphViewMode
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '2000', 10), 3000)
    const category = searchParams.get('category') ?? undefined
    const data = await getGraphData({ viewMode, limit, category })
    return NextResponse.json(data)
  } catch (err) {
    console.error('/api/graph error:', err)
    return NextResponse.json({ nodes: [], links: [] }, { status: 500 })
  }
}
