/**
 * lib/db/relationships.ts
 *
 * Query functions for product_relationships and product_alternatives tables.
 */

import { supabaseAdmin } from '@/lib/supabase-server'

export type RelationshipProduct = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  signal_score: number | null
  category: string
}

export type ProductRelationship = {
  type: string
  product: RelationshipProduct
}

/**
 * Get all relationships for a product — checks both product_relationships
 * (source→target) and product_alternatives tables.
 */
export async function getProductRelationships(
  productId: string,
): Promise<ProductRelationship[]> {
  const results: ProductRelationship[] = []
  const seen = new Set<string>()

  // ── product_relationships table (product_a_id → product_b_id) ──────────────
  const { data: relRows, error: relErr } = await supabaseAdmin
    .from('product_relationships')
    .select(`
      relationship_type,
      product_b:products!product_relationships_product_b_id_fkey (
        id, name, slug, logo_url, category,
        product_signal_scores ( signal_score, score_date )
      )
    `)
    .eq('product_a_id', productId)

  if (!relErr && relRows) {
    for (const row of relRows as Array<{
      relationship_type: string
      product_b: {
        id: string
        name: string
        slug: string
        logo_url: string | null
        category: string
        product_signal_scores: { signal_score: number | null; score_date: string | null }[]
      } | null
    }>) {
      if (!row.product_b || seen.has(row.product_b.id)) continue
      seen.add(row.product_b.id)

      const latestScore = row.product_b.product_signal_scores
        .filter((s) => s.score_date !== null && s.signal_score !== null)
        .sort((a, b) => (b.score_date! > a.score_date! ? 1 : -1))[0]

      results.push({
        type: row.relationship_type,
        product: {
          id: row.product_b.id,
          name: row.product_b.name,
          slug: row.product_b.slug,
          logo_url: row.product_b.logo_url,
          signal_score: latestScore?.signal_score ?? null,
          category: row.product_b.category,
        },
      })
    }
  }

  // ── product_alternatives table ──────────────────────────────────────────────
  const { data: altRows, error: altErr } = await supabaseAdmin
    .from('product_alternatives')
    .select(`
      relationship,
      products!product_alternatives_alternative_id_fkey (
        id, name, slug, logo_url, category,
        product_signal_scores ( signal_score, score_date )
      )
    `)
    .eq('product_id', productId)

  if (!altErr && altRows) {
    for (const row of altRows as Array<{
      relationship: string | null
      products: {
        id: string
        name: string
        slug: string
        logo_url: string | null
        category: string
        product_signal_scores: { signal_score: number | null; score_date: string | null }[]
      } | null
    }>) {
      if (!row.products || seen.has(row.products.id)) continue
      seen.add(row.products.id)

      const latestScore = row.products.product_signal_scores
        .filter((s) => s.score_date !== null && s.signal_score !== null)
        .sort((a, b) => (b.score_date! > a.score_date! ? 1 : -1))[0]

      results.push({
        type: row.relationship ?? 'alternative',
        product: {
          id: row.products.id,
          name: row.products.name,
          slug: row.products.slug,
          logo_url: row.products.logo_url,
          signal_score: latestScore?.signal_score ?? null,
          category: row.products.category,
        },
      })
    }
  }

  return results
}
