import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { saveProduct, unsaveProduct, isProductSaved } from '@/lib/db/watchlist'

/**
 * GET /api/watchlist?productId=xxx
 * Returns whether the authenticated user has saved a product.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ saved: false, authenticated: false })
    }

    const productId = request.nextUrl.searchParams.get('productId')
    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 })
    }

    const saved = await isProductSaved(session.user.id, productId)
    return NextResponse.json({ saved, authenticated: true })
  } catch (err) {
    console.error('/api/watchlist GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * POST /api/watchlist
 * Body: { productId: string, action: 'save' | 'unsave' }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, action } = body as { productId: string; action: 'save' | 'unsave' }

    if (!productId || !action) {
      return NextResponse.json({ error: 'productId and action required' }, { status: 400 })
    }

    if (action === 'save') {
      await saveProduct(session.user.id, productId)
    } else if (action === 'unsave') {
      await unsaveProduct(session.user.id, productId)
    } else {
      return NextResponse.json({ error: 'action must be save or unsave' }, { status: 400 })
    }

    return NextResponse.json({ success: true, action })
  } catch (err) {
    console.error('/api/watchlist POST error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
