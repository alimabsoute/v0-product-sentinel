import { supabaseAdmin } from '@/lib/supabase-server'

const CATEGORY_DISPLAY: Record<string, string> = {
  'ai-tools': 'AI Tools',
  'dev-tools': 'Developer Tools',
  'developer-tools': 'Developer Tools',
  'productivity': 'Productivity',
  'design': 'Design',
  'marketing': 'Marketing',
  'analytics': 'Analytics',
  'finance': 'Finance',
  'communication': 'Communication',
  'security': 'Security',
  'hardware': 'Hardware',
  'entertainment': 'Entertainment',
  'education': 'Education',
  'health': 'Health',
  'e-commerce': 'E-commerce',
  'gaming': 'Gaming',
}

function categoryDisplay(slug: string): string {
  return CATEGORY_DISPLAY[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export type TrendingProduct = {
  id: string
  slug: string
  name: string
  logo_url: string | null
  category: string
  signal_score: number
  launched_year: number | null
  created_at: string
}

export type TagLeader = {
  tag_slug: string
  tag_group: string
  top_products: TrendingProduct[]
  product_count: number
}

export async function getSignalLeaders(limit = 20): Promise<TrendingProduct[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('latest_signal_scores')
      .select(`
        product_id,
        signal_score,
        products!inner ( id, slug, name, logo_url, category, launched_year, created_at, status )
      `)
      .eq('products.status', 'active')
      .order('signal_score', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return (data as unknown as Array<{
      product_id: string
      signal_score: number
      products: {
        id: string
        slug: string
        name: string
        logo_url: string | null
        category: string
        launched_year: number | null
        created_at: string
      }
    }>).map(row => ({
      id: row.products.id,
      slug: row.products.slug,
      name: row.products.name,
      logo_url: row.products.logo_url,
      category: row.products.category,
      signal_score: row.signal_score ?? 0,
      launched_year: row.products.launched_year,
      created_at: row.products.created_at,
    }))
  } catch {
    return []
  }
}

export async function getRecentlyLaunched(limit = 20): Promise<TrendingProduct[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, slug, name, logo_url, category, launched_year, launched_month, created_at')
      .eq('status', 'active')
      .gte('launched_year', 2023)
      .order('launched_year', { ascending: false })
      .order('launched_month', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return (data as Array<{
      id: string
      slug: string
      name: string
      logo_url: string | null
      category: string
      launched_year: number | null
      created_at: string
    }>).map(row => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      logo_url: row.logo_url,
      category: row.category,
      signal_score: 0,
      launched_year: row.launched_year,
      created_at: row.created_at,
    }))
  } catch {
    return []
  }
}

export async function getTopByCategory(limit = 5): Promise<{ category: string; display: string; product: TrendingProduct }[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('latest_signal_scores')
      .select(`
        signal_score,
        products!inner ( id, slug, name, logo_url, category, launched_year, created_at, status )
      `)
      .eq('products.status', 'active')
      .order('signal_score', { ascending: false })

    if (error || !data) return []

    const byCategory = new Map<string, { category: string; display: string; product: TrendingProduct }>()

    for (const row of data as unknown as Array<{
      signal_score: number
      products: {
        id: string
        slug: string
        name: string
        logo_url: string | null
        category: string
        launched_year: number | null
        created_at: string
      }
    }>) {
      const cat = row.products.category
      if (!byCategory.has(cat)) {
        byCategory.set(cat, {
          category: cat,
          display: categoryDisplay(cat),
          product: {
            id: row.products.id,
            slug: row.products.slug,
            name: row.products.name,
            logo_url: row.products.logo_url,
            category: cat,
            signal_score: row.signal_score ?? 0,
            launched_year: row.products.launched_year,
            created_at: row.products.created_at,
          },
        })
      }
      if (byCategory.size >= limit) break
    }

    return Array.from(byCategory.values())
  } catch {
    return []
  }
}
