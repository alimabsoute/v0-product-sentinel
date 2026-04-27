import { getUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('product_id')
  if (!productId) {
    return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
  }

  const { count } = await supabaseAdmin
    .from('product_upvotes')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)

  // Check if current user has upvoted
  const user = await getUser()
  let upvoted = false
  if (user) {
    const { data } = await supabaseAdmin
      .from('product_upvotes')
      .select('product_id')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .maybeSingle()
    upvoted = !!data
  }

  return NextResponse.json({ count: count ?? 0, upvoted })
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { product_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { product_id } = body
  if (!product_id) {
    return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
  }

  // Check if upvote already exists
  const { data: existing } = await supabaseAdmin
    .from('product_upvotes')
    .select('product_id')
    .eq('product_id', product_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    // Un-upvote
    await supabaseAdmin
      .from('product_upvotes')
      .delete()
      .eq('product_id', product_id)
      .eq('user_id', user.id)
  } else {
    // Upvote
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin as any)
      .from('product_upvotes')
      .insert({ product_id, user_id: user.id })
  }

  // Return fresh count
  const { count } = await supabaseAdmin
    .from('product_upvotes')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', product_id)

  return NextResponse.json({ upvoted: !existing, count: count ?? 0 })
}
