import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getPublicCollections } from '@/lib/db/collections'

/**
 * GET /api/collections
 * Returns the 20 most recent public collections.
 */
export async function GET() {
  try {
    const collections = await getPublicCollections(20)
    return NextResponse.json({ collections })
  } catch (err) {
    console.error('/api/collections GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * POST /api/collections
 * Body: { name: string, description?: string, is_public?: boolean }
 * Auth required. Creates a new collection for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, is_public } = body as {
      name?: string
      description?: string
      is_public?: boolean
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseAdmin as any)
      .from('user_collections')
      .insert({
        name: name.trim(),
        description: description ?? null,
        is_public: is_public ?? true,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('/api/collections POST insert error:', error)
      return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
    }

    return NextResponse.json({ collection: data }, { status: 201 })
  } catch (err) {
    console.error('/api/collections POST error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
