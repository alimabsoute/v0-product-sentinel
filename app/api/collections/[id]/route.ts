import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getCollectionById, deleteCollection } from '@/lib/db/collections'

/**
 * GET /api/collections/:id
 * Returns collection + its products (for client-side refresh).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const collection = await getCollectionById(id)
    if (!collection) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: cpRows, error } = await supabaseAdmin
      .from('collection_products')
      .select(
        `product_id, products!inner(id, slug, name, logo_url, category, description, status,
          product_signal_scores(signal_score, score_date, wow_velocity, is_breakout))`,
      )
      .eq('collection_id', id)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('/api/collections GET products error:', error)
    }

    return NextResponse.json({ collection, products: cpRows ?? [] })
  } catch (err) {
    console.error('/api/collections/:id GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * DELETE /api/collections/:id
 * Auth required. Must be owner. Cascades via DB.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Verify ownership before deleting
    const collection = await getCollectionById(id)
    if (!collection) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (collection.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deleteCollection(user.id, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('/api/collections/:id DELETE error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
