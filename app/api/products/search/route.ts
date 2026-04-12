import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const FALLBACK_LOGO = 'https://placehold.co/48x48/e2e8f0/64748b?text=P'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('products')
      .select('id, slug, name, description, logo_url, category')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error

    const products = (data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      tagline: row.description
        ? row.description.split('.')[0].trim()
        : row.name,
      logo: row.logo_url ?? FALLBACK_LOGO,
      category: row.category,
    }))

    return NextResponse.json({ products })
  } catch (err) {
    console.error('/api/products/search error:', err)
    return NextResponse.json({ products: [] }, { status: 500 })
  }
}
