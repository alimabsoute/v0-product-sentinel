import { NextRequest, NextResponse } from 'next/server'
import { getNewsArchive } from '@/lib/db/news'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const source = searchParams.get('source') || undefined
    const sentimentRaw = searchParams.get('sentiment')
    const sentiment = sentimentRaw !== null ? (parseInt(sentimentRaw, 10) as -1 | 0 | 1) : undefined
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined
    const sort = (searchParams.get('sort') as 'newest' | 'importance') || 'newest'

    const result = await getNewsArchive({ page, limit, source, sentiment, dateFrom, dateTo, sort })
    return NextResponse.json(result)
  } catch (err) {
    console.error('/api/news error:', err)
    return NextResponse.json({ items: [], total: 0, page: 1, totalPages: 0 }, { status: 500 })
  }
}
