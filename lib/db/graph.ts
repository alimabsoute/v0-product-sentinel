/**
 * lib/db/graph.ts
 *
 * Builds nodes + links for the /explore force graph.
 *
 * Returns two kinds of nodes:
 *   - product      : one per active product (top N by signal_score)
 *   - category     : one "hub" per unique category in the result set
 *
 * Links:
 *   - category     : every product → its category hub
 *   - alternative  : from `product_alternatives` (both endpoints must be in result set)
 *   - relationship : from `product_relationships` (both endpoints must be in result set)
 *
 * product_relationships is empty today — it's queried gracefully and contributes
 * zero links until it's populated.
 */

import { supabaseAdmin } from '@/lib/supabase-server'

// ─── Public types ────────────────────────────────────────────────────────────

export type GraphNodeType = 'product' | 'category'

export interface GraphNode {
  id: string
  name: string
  slug: string
  category: string          // display name
  categorySlug: string      // raw slug
  signal_score: number      // 0-100
  logo_url: string | null
  type: GraphNodeType
  product_count?: number    // category hubs only
}

export interface GraphLink {
  source: string
  target: string
  type: 'category' | 'alternative' | 'relationship'
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

// ─── Category display map (kept in sync with lib/db/products.ts) ─────────────

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

// ─── DB row types ────────────────────────────────────────────────────────────

type ProductRow = {
  id: string
  slug: string
  name: string
  logo_url: string | null
  category: string
  product_signal_scores: { signal_score: number | null; score_date: string | null }[]
}

// ─── Main query ──────────────────────────────────────────────────────────────

export interface GetGraphDataParams {
  category?: string         // accepts display name OR slug
  limit?: number
}

export async function getGraphData(params: GetGraphDataParams = {}): Promise<GraphData> {
  const { category, limit = 500 } = params

  // ── 1. Fetch top products by latest signal_score ───────────────────────────
  // Strategy: pull active products with their latest score joined, sort in-memory
  // by latest signal_score. This keeps us to a single round-trip even without
  // a materialised "latest_score" view.

  let query = supabaseAdmin
    .from('products')
    .select(`
      id, slug, name, logo_url, category,
      product_signal_scores ( signal_score, score_date )
    `)
    .eq('status', 'active')

  if (category) {
    const slug = category.toLowerCase().replace(/\s+/g, '-')
    query = query.eq('category', slug)
  }

  // Over-fetch a bit so that after sorting we still have `limit` products with scores.
  // The DB has ~7.8k active products / ~6.3k scores — plenty of headroom.
  query = query.limit(Math.max(limit * 3, 1500))

  const { data, error } = await query
  if (error) throw error

  const rows = (data ?? []) as unknown as ProductRow[]

  // Resolve latest signal_score per product
  const withScore = rows.map(r => {
    const scores = r.product_signal_scores ?? []
    const valid = scores
      .filter(s => s.signal_score !== null && s.score_date !== null)
      .sort((a, b) => (a.score_date! < b.score_date! ? 1 : -1))
    const latest = valid[0]?.signal_score ?? 0
    return { row: r, score: latest }
  })

  // Sort by score desc (products with no score go to the end) and take top `limit`.
  withScore.sort((a, b) => b.score - a.score)
  const top = withScore.slice(0, limit)

  // ── 2. Build product nodes + category hubs ─────────────────────────────────
  const nodes: GraphNode[] = []
  const productIdSet = new Set<string>()
  const categoryCounts = new Map<string, number>()

  for (const { row, score } of top) {
    productIdSet.add(row.id)
    categoryCounts.set(row.category, (categoryCounts.get(row.category) ?? 0) + 1)

    nodes.push({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: categoryDisplay(row.category),
      categorySlug: row.category,
      signal_score: Math.round(score * 10) / 10, // keep 1 decimal, 0-100 range
      logo_url: row.logo_url,
      type: 'product',
    })
  }

  for (const [slug, count] of categoryCounts.entries()) {
    nodes.push({
      id: `cat-${slug}`,
      name: categoryDisplay(slug),
      slug,
      category: categoryDisplay(slug),
      categorySlug: slug,
      signal_score: 0,
      logo_url: null,
      type: 'category',
      product_count: count,
    })
  }

  // ── 3. Category links (every product → its hub) ────────────────────────────
  const links: GraphLink[] = []
  for (const node of nodes) {
    if (node.type !== 'product') continue
    links.push({
      source: node.id,
      target: `cat-${node.categorySlug}`,
      type: 'category',
    })
  }

  // ── 4. Alternative links (only if both endpoints are in the result set) ────
  const productIds = Array.from(productIdSet)
  if (productIds.length > 0) {
    const { data: altRows, error: altErr } = await supabaseAdmin
      .from('product_alternatives')
      .select('product_id, alternative_id')
      .in('product_id', productIds)

    if (!altErr && altRows) {
      for (const r of altRows as { product_id: string; alternative_id: string }[]) {
        if (productIdSet.has(r.alternative_id)) {
          links.push({
            source: r.product_id,
            target: r.alternative_id,
            type: 'alternative',
          })
        }
      }
    }
  }

  // ── 5. Relationship links (may be empty table — swallow errors) ────────────
  if (productIds.length > 0) {
    try {
      const { data: relRows } = await supabaseAdmin
        .from('product_relationships')
        .select('product_a_id, product_b_id')
        .in('product_a_id', productIds)

      if (relRows) {
        for (const r of relRows as { product_a_id: string; product_b_id: string }[]) {
          if (productIdSet.has(r.product_b_id)) {
            links.push({
              source: r.product_a_id,
              target: r.product_b_id,
              type: 'relationship',
            })
          }
        }
      }
    } catch {
      // Table missing or permission error — ignore, relationships are optional.
    }
  }

  return { nodes, links }
}

// ─── Helper: list of (slug, display) pairs for the filter dropdown ───────────
export async function getGraphCategories(): Promise<{ slug: string; name: string }[]> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('category')
    .eq('status', 'active')
  if (error) throw error
  const slugs = [...new Set((data ?? []).map(r => (r as { category: string }).category))].sort()
  return slugs.map(slug => ({ slug, name: categoryDisplay(slug) }))
}
