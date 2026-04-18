import { NextRequest, NextResponse } from 'next/server'
import { searchProducts, getProductCount } from '@/lib/db/products'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import type { SortOption } from '@/lib/db/products'

const FALLBACK_LOGO = 'https://placehold.co/48x48/e2e8f0/64748b?text=P'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const q = searchParams.get('q') || undefined
    const category = searchParams.get('category') || undefined
    const sort = (searchParams.get('sort') as SortOption) || 'newest'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const status = (searchParams.get('status') as 'active' | 'dead' | 'all') || 'active'
    const minimal = searchParams.get('minimal') === 'true'

    // Minimal mode: lightweight response for command palette / autocomplete
    if (minimal) {
      const supabase = getSupabaseAdmin()
      let query = supabase
        .from('products')
        .select('id, slug, name, description, logo_url, category')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (q && q.trim().length >= 3) {
        query = query.textSearch('search_vector', q.trim(), { type: 'plain', config: 'english' })
      } else if (q && q.trim().length > 0) {
        query = query.ilike('name', `%${q.trim()}%`)
      }

      const { data, error } = await query
      if (error) throw error

      const products = (data ?? []).map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        tagline: row.description ? row.description.split('.')[0].trim() : row.name,
        logo: row.logo_url ?? FALLBACK_LOGO,
        category: row.category,
      }))

      return NextResponse.json({ products })
    }

    // Full mode: paginated search with complete product data
    const result = await searchProducts({ q, category, sort, page, limit, status })

    return NextResponse.json(result)
  } catch (err) {
    console.error('/api/products/search error:', err)
    return NextResponse.json(
      { products: [], total: 0, page: 1, totalPages: 0 },
      { status: 500 },
    )
  }
}
