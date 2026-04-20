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

export type GraphViewMode = 'category' | 'era' | 'similarity'

export interface GraphNode {
  id: string
  name: string
  slug: string
  category: string          // display name
  categorySlug: string      // raw slug
  signal_score: number      // 0-100
  logo_url: string | null
  type: GraphNodeType
  launched_year: number | null
  product_count?: number    // hub nodes only
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
  launched_year: number | null
  product_signal_scores: { signal_score: number | null; score_date: string | null }[]
}

// ─── Main query ──────────────────────────────────────────────────────────────

export interface GetGraphDataParams {
  category?: string         // accepts display name OR slug
  limit?: number
  viewMode?: GraphViewMode
}

export async function getGraphData(params: GetGraphDataParams = {}): Promise<GraphData> {
  const { category, limit = 2000, viewMode = 'category' } = params

  let query = supabaseAdmin
    .from('products')
    .select(`
      id, slug, name, logo_url, category, launched_year,
      product_signal_scores ( signal_score, score_date )
    `)
    .eq('status', 'active')

  if (category) {
    const slug = category.toLowerCase().replace(/\s+/g, '-')
    query = query.eq('category', slug)
  }

  query = query.limit(Math.max(limit * 2, 4000))

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
      signal_score: Math.round(score * 10) / 10,
      logo_url: row.logo_url,
      launched_year: row.launched_year,
      type: 'product',
    })
  }

  const links: GraphLink[] = []

  if (viewMode === 'category') {
    for (const [slug, count] of categoryCounts.entries()) {
      nodes.push({
        id: `cat-${slug}`, name: categoryDisplay(slug), slug,
        category: categoryDisplay(slug), categorySlug: slug,
        signal_score: 0, logo_url: null, launched_year: null,
        type: 'category', product_count: count,
      })
    }
    for (const node of nodes) {
      if (node.type !== 'product') continue
      links.push({ source: node.id, target: `cat-${node.categorySlug}`, type: 'category' })
    }
  } else if (viewMode === 'era') {
    const eraCounts = new Map<string, number>()
    for (const { row } of top) {
      const era = row.launched_year ? String(row.launched_year) : 'Unknown'
      eraCounts.set(era, (eraCounts.get(era) ?? 0) + 1)
    }
    for (const [era, count] of eraCounts.entries()) {
      nodes.push({
        id: `era-${era}`, name: era, slug: era,
        category: era, categorySlug: era,
        signal_score: 0, logo_url: null, launched_year: null,
        type: 'category', product_count: count,
      })
    }
    for (const node of nodes) {
      if (node.type !== 'product') continue
      const era = node.launched_year ? String(node.launched_year) : 'Unknown'
      links.push({ source: node.id, target: `era-${era}`, type: 'category' })
    }
  }
  // similarity mode: no hubs, tag-based edges added below

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

  // ── 5. Tag-based similarity edges (similarity mode only) ─────────────────
  if (viewMode === 'similarity' && productIds.length > 0) {
    try {
      const { data: tagRows } = await supabaseAdmin
        .from('product_tags')
        .select('product_id, tag_id')
        .in('product_id', productIds)

      if (tagRows) {
        // Build tag→products map
        const tagToProducts = new Map<string, string[]>()
        for (const r of tagRows as { product_id: string; tag_id: string }[]) {
          if (!tagToProducts.has(r.tag_id)) tagToProducts.set(r.tag_id, [])
          tagToProducts.get(r.tag_id)!.push(r.product_id)
        }
        // Count shared tags per product pair
        const pairScore = new Map<string, number>()
        for (const prods of tagToProducts.values()) {
          if (prods.length < 2 || prods.length > 200) continue // skip ubiquitous tags
          for (let i = 0; i < prods.length; i++) {
            for (let j = i + 1; j < prods.length; j++) {
              const key = prods[i] < prods[j] ? `${prods[i]}|${prods[j]}` : `${prods[j]}|${prods[i]}`
              pairScore.set(key, (pairScore.get(key) ?? 0) + 1)
            }
          }
        }
        for (const [key, score] of pairScore.entries()) {
          if (score < 2) continue // require ≥2 shared tags
          const [src, tgt] = key.split('|')
          links.push({ source: src, target: tgt, type: 'relationship' })
        }
      }
    } catch { /* ignore */ }
  }

  // ── 7. Relationship links (may be empty table — swallow errors) ────────────
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
