/**
 * lib/db/products.ts
 *
 * Supabase query functions for the products table.
 * Returns data shaped to match the `Product` interface that UI components
 * already consume — so no component changes are needed for the Day 5 cut-over.
 *
 * Fields not yet in the DB (buzz, badges, characteristics detail, etc.) are
 * stubbed with safe defaults and will be filled in as signal scoring lands.
 */

import { supabaseAdmin } from '@/lib/supabase-server'
import type { Product } from '@/lib/mock-data'

// ─── Category slug → display name ────────────────────────────────────────────

const CATEGORY_DISPLAY: Record<string, string> = {
  'ai-tools':       'AI Tools',
  'dev-tools':      'Developer Tools',
  'productivity':   'Productivity',
  'design':         'Design',
  'marketing':      'Marketing',
  'analytics':      'Analytics',
  'finance':        'Finance',
  'communication':  'Communication',
  'security':       'Security',
  'hardware':       'Hardware',
  'entertainment':  'Entertainment',
  'education':      'Education',
  'health':         'Health',
  'e-commerce':     'E-commerce',
  'gaming':         'Gaming',
}

function categoryDisplay(slug: string): string {
  return CATEGORY_DISPLAY[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── DB row type (what Supabase returns) ──────────────────────────────────────

type DbProduct = {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  category: string
  sub_category: string | null
  platform: string | null
  business_model: string | null
  status: string
  source_url: string | null
  website_url: string | null
  twitter_handle: string | null
  github_repo: string | null
  launched_year: number | null
  launched_month: number | null
  task_search_tags: string[] | null
  functionality_scores: Record<string, number> | null
  screenshots: string[] | null
  created_at: string
  product_tags: { tags: { slug: string; tag_group: string } | null }[]
}

// ─── Adapter: DB row → Product (UI shape) ────────────────────────────────────

const FALLBACK_LOGO = 'https://placehold.co/48x48/e2e8f0/64748b?text=P'

function toProduct(row: DbProduct): Product {
  const launchDate = row.launched_year
    ? new Date(row.launched_year, (row.launched_month ?? 1) - 1, 1).toISOString()
    : row.created_at

  // Derive tags from product_tags join (tag slugs as strings)
  const tags = row.product_tags
    .map(pt => pt.tags?.slug)
    .filter((s): s is string => Boolean(s))

  // Derive basic characteristics from what we have
  const pricingMap: Record<string, Product['characteristics']['pricing']> = {
    freemium: 'freemium',
    free: 'free',
    paid: 'paid',
    saas: 'paid',
    'open-source': 'free',
  }
  const pricing = pricingMap[row.business_model ?? ''] ?? 'freemium'

  const platformMap: Record<string, Product['characteristics']['platforms'][number]> = {
    web: 'web',
    mobile: 'ios',
    desktop: 'mac',
    'cross-platform': 'web',
    hardware: 'web',
  }
  const platforms: Product['characteristics']['platforms'] = row.platform
    ? [platformMap[row.platform] ?? 'web']
    : ['web']

  const isOpenSource = tags.includes('open-source') || row.business_model === 'open-source'
  const hasAPI = tags.includes('api-first')
  const isAI = row.category === 'ai-tools' || tags.some(t => t.startsWith('ai-'))

  // Stub buzz — will be replaced when signal_scores land (Day 6+)
  const buzz: Product['buzz'] = {
    score: 0,
    trend: 'stable',
    weeklyChange: 0,
    sparkline: [0, 0, 0, 0, 0, 0, 0],
    sources: { twitter: 0, reddit: 0, hackerNews: 0, news: 0 },
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.description ? row.description.split('.')[0].trim() : row.name,
    description: row.description ?? '',
    logo: row.logo_url ?? FALLBACK_LOGO,
    url: row.website_url ?? row.source_url ?? '#',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    category: categoryDisplay(row.category) as any,
    tags,
    characteristics: {
      pricing,
      platforms,
      teamSize: '2-5',
      openSource: isOpenSource,
      hasAPI,
      aiPowered: isAI,
      targetAudience: ['developers'],
      funding: 'bootstrapped' as const,
      founded: row.launched_year ?? new Date().getFullYear(),
    },
    launchDate,
    lastUpdated: row.created_at,
    status: row.status === 'active' ? 'active' : 'dead',
    buzz,
    screenshots: row.screenshots ?? [],
    competitors: [],
    integrations: [],
    badges: [],
    saves: 0,
    views: 0,
  }
}

// ─── Shared select string ─────────────────────────────────────────────────────

const PRODUCT_SELECT = `
  id, slug, name, description, logo_url,
  category, sub_category, platform, business_model,
  status, source_url, website_url, twitter_handle, github_repo,
  launched_year, launched_month, task_search_tags, functionality_scores,
  screenshots, created_at,
  product_tags ( tags ( slug, tag_group ) )
`

// ─── Query functions ──────────────────────────────────────────────────────────

/** All active products, most recently added first. */
export async function getActiveProducts(limit = 100): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data as unknown as DbProduct[]).map(toProduct)
}

/**
 * "Featured" = most recently ingested active products.
 * Will be replaced by signal_score ordering once Day 6 signals land.
 */
export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  return getActiveProducts(limit)
}

/**
 * "Trending" = same pool for now (no buzz scores yet).
 * Returns a deterministic shuffle so the two home-page sections differ.
 */
export async function getTrendingProducts(limit = 6): Promise<Product[]> {
  const all = await getActiveProducts(20)
  // Rotate by limit so trending ≠ featured
  return [...all.slice(limit), ...all.slice(0, limit)].slice(0, limit)
}

/** Dead/sunset products. */
export async function getDeadProducts(limit = 10): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(PRODUCT_SELECT)
    .in('status', ['sunset', 'dead', 'acquired'])
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data as unknown as DbProduct[]).map(toProduct)
}

/** Single product by slug. Returns null if not found. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data ? toProduct(data as unknown as DbProduct) : null
}

/** Products in the same category (for the "More like this" section). */
export async function getProductsByCategory(categorySlug: string, limit = 8): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('category', categorySlug)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data as unknown as DbProduct[]).map(toProduct)
}

/** Total active product count (for the Products page subtitle). */
export async function getProductCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
  if (error) throw error
  return count ?? 0
}
