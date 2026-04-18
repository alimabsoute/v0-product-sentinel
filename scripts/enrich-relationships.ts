/**
 * scripts/enrich-relationships.ts
 *
 * Uses Claude Haiku to identify competitors/alternatives for each active product,
 * then inserts discovered matches into product_alternatives.
 *
 * Usage:
 *   npm run enrich:relationships           # Live run
 *   npm run enrich:relationships -- --dry-run   # Log only, no inserts
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// ─── Config ───────────────────────────────────────────────────────────────────

const BATCH_SIZE = 50
const MAX_PRODUCTS = Number(process.env.MAX_PRODUCTS ?? '500')
const DRY_RUN = process.argv.includes('--dry-run')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const anthropicKey = process.env.ANTHROPIC_API_KEY!

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!anthropicKey) {
  console.error('Missing ANTHROPIC_API_KEY')
  process.exit(1)
}

const db = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const anthropic = new Anthropic({ apiKey: anthropicKey })

// ─── Types ────────────────────────────────────────────────────────────────────

type DbProduct = {
  id: string
  slug: string
  name: string
  description: string | null
  category: string
}

type HaikuSuggestion = {
  name: string
  relationship_type: 'competitor' | 'alternative'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchProductBatch(offset: number): Promise<DbProduct[]> {
  const { data, error } = await db
    .from('products')
    .select('id, slug, name, description, category')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + BATCH_SIZE - 1)

  if (error) throw error
  return (data ?? []) as DbProduct[]
}

async function askHaiku(product: DbProduct): Promise<HaikuSuggestion[]> {
  const prompt = `Given this tech product:
Name: ${product.name}
Category: ${product.category}
Description: ${product.description ?? 'N/A'}

List up to 3 known direct competitors or alternatives by name. Return ONLY a JSON array, no explanation:
[{"name": "ProductName", "relationship_type": "competitor" | "alternative"}]

Rules:
- Only include real, well-known products
- relationship_type is "competitor" if they are in direct competition, "alternative" if they solve the same problem differently
- Return [] if you don't know any`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    // Extract JSON array from response
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []

    const parsed = JSON.parse(match[0]) as HaikuSuggestion[]
    return parsed.filter(
      (s) =>
        typeof s.name === 'string' &&
        s.name.length > 0 &&
        (s.relationship_type === 'competitor' || s.relationship_type === 'alternative'),
    )
  } catch (e) {
    console.warn(`  Haiku error for ${product.name}:`, (e as Error).message)
    return []
  }
}

async function lookupProductByName(name: string): Promise<string | null> {
  // Try exact name match first
  const { data: exact } = await db
    .from('products')
    .select('id')
    .ilike('name', name)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (exact) return exact.id

  // Try slug-based match (normalize name → slug)
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const { data: bySlug } = await db
    .from('products')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  return bySlug?.id ?? null
}

async function insertAlternative(
  productId: string,
  alternativeId: string,
  relationshipType: string,
): Promise<void> {
  const { error } = await db.from('product_alternatives').upsert(
    {
      product_id: productId,
      alternative_id: alternativeId,
      relationship: relationshipType,
    },
    { onConflict: 'product_id,alternative_id', ignoreDuplicates: true },
  )

  if (error && !error.message.includes('duplicate')) {
    console.warn(`  Insert error: ${error.message}`)
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Prism Relationship Enrichment ===`)
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no inserts)' : 'LIVE'}`)
  console.log(`Max products: ${MAX_PRODUCTS}`)
  console.log(`Batch size: ${BATCH_SIZE}\n`)

  let offset = 0
  let totalProcessed = 0
  let totalInserted = 0
  let totalSkipped = 0

  while (totalProcessed < MAX_PRODUCTS) {
    const batch = await fetchProductBatch(offset)
    if (batch.length === 0) {
      console.log('No more products to process.')
      break
    }

    console.log(`Processing batch ${offset / BATCH_SIZE + 1} (${batch.length} products)...`)

    for (const product of batch) {
      if (totalProcessed >= MAX_PRODUCTS) break
      totalProcessed++

      process.stdout.write(`  [${totalProcessed}] ${product.name}... `)

      const suggestions = await askHaiku(product)

      if (suggestions.length === 0) {
        console.log('no suggestions')
        continue
      }

      const found: string[] = []
      for (const s of suggestions) {
        const altId = await lookupProductByName(s.name)
        if (!altId || altId === product.id) {
          totalSkipped++
          continue
        }

        if (DRY_RUN) {
          console.log(`\n    [DRY RUN] Would insert: ${product.name} → ${s.name} (${s.relationship_type})`)
        } else {
          await insertAlternative(product.id, altId, s.relationship_type)
          totalInserted++
        }
        found.push(s.name)
      }

      console.log(found.length > 0 ? `found: ${found.join(', ')}` : 'no DB matches')

      // Rate-limit: ~20 req/min for Haiku
      await new Promise((r) => setTimeout(r, 300))
    }

    offset += BATCH_SIZE

    if (batch.length < BATCH_SIZE) break
  }

  console.log(`\n=== Done ===`)
  console.log(`Products processed: ${totalProcessed}`)
  console.log(`Relationships inserted: ${totalInserted}`)
  console.log(`Suggestions skipped (not in DB): ${totalSkipped}`)
}

main().catch((e) => {
  console.error('Fatal error:', e)
  process.exit(1)
})
