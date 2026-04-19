import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getCollectionById } from '@/lib/db/collections'

/**
 * POST /api/collections/:id/products
 * Body: { product_id: string }
 * Auth required. Verifies user owns the collection. Adds product to collection.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const collection = await getCollectionById(id)
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }
    if (collection.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { product_id } = body as { product_id?: string }
    if (!product_id || typeof product_id !== 'string') {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('collection_products')
      .insert({ collection_id: id, product_id })

    if (error) {
      // 23505 = unique_violation — product already in collection
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Product already in collection' }, { status: 409 })
      }
      console.error('/api/collections/:id/products POST error:', error)
      return NextResponse.json({ error: 'Failed to add product' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('/api/collections/:id/products POST error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * DELETE /api/collections/:id/products
 * Body: { product_id: string }
 * Auth required. Verifies user owns the collection. Removes product from collection.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const collection = await getCollectionById(id)
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }
    if (collection.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { product_id } = body as { product_id?: string }
    if (!product_id || typeof product_id !== 'string') {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('collection_products')
      .delete()
      .eq('collection_id', id)
      .eq('product_id', product_id)

    if (error) {
      console.error('/api/collections/:id/products DELETE error:', error)
      return NextResponse.json({ error: 'Failed to remove product' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('/api/collections/:id/products DELETE error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
