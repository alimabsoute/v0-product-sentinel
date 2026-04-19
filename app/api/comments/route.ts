import { getUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { getProductComments } from '@/lib/db/comments'

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('product_id')
  if (!productId) {
    return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
  }
  const comments = await getProductComments(productId)
  return NextResponse.json({ comments })
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { product_id?: string; content?: string; parent_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { product_id, content, parent_id } = body

  if (!product_id) {
    return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }
  if (content.length > 1000) {
    return NextResponse.json({ error: 'content must be 1000 characters or fewer' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('product_comments')
    .insert({
      product_id,
      user_id: user.id,
      content: content.trim(),
      parent_id: parent_id ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to insert comment' }, { status: 500 })
  }

  return NextResponse.json({ comment: { ...data, author_name: user.email?.split('@')[0] ?? 'User' } }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('product_comments')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('product_comments')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
