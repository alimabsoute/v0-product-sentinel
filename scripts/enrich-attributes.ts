/**
 * scripts/enrich-attributes.ts
 *
 * Scrapes each untagged product's website (homepage + /pricing + /features)
 * using Firecrawl, then classifies it into 10 tag groups via Claude Haiku.
 * Inserts results into product_tags table.
 *
 * Usage:
 *   pnpm tsx --env-file=.env.local scripts/enrich-attributes.ts
 *   pnpm tsx --env-file=.env.local scripts/enrich-attributes.ts --dry-run
 *   pnpm tsx --env-file=.env.local scripts/enrich-attributes.ts --limit=50
 *   pnpm tsx --env-file=.env.local scripts/enrich-attributes.ts --dry-run --limit=10
 *
 * Env required:
 *   FIRECRAWL_API_KEY
 *   ANTHROPIC_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import Anthropic from '@anthropic-ai/sdk'
import { FirecrawlClient } from '@mendable/firecrawl-js'
import { supabaseAdmin } from '../lib/supabase-server'
import { sleep } from './shared/ingest-core'

// ─── Config ───────────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run')
const PAGE_SIZE = 100
const SCRAPE_CONTENT_CAP = 8000
const SCRAPE_MIN_CHARS = 100
const DELAY_MS = 3000
const MAX_TAGS_PER_GROUP = 4

// Parse --limit=N flag
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const LIMIT: number | null = limitArg ? parseInt(limitArg.split('=')[1], 10) : null

// ─── Env validation ───────────────────────────────────────────────────────────

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

if (!FIRECRAWL_API_KEY) { console.error('Missing FIRECRAWL_API_KEY'); process.exit(1) }
if (!ANTHROPIC_API_KEY) { console.error('Missing ANTHROPIC_API_KEY'); process.exit(1) }

// ─── Clients ──────────────────────────────────────────────────────────────────

const fc = new FirecrawlClient({ apiKey: FIRECRAWL_API_KEY })
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

// ─── Types ────────────────────────────────────────────────────────────────────

type Tag = {
  id: string
  slug: string
  tag_group: string
}

type TagVocab = {
  slugToId: Map<string, string>
  groupToSlugs: Map<string, string[]>
}

type Product = {
  id: string
  slug: string
  name: string
  website_url: string
}

type HaikuClassification = Record<string, string[]>

// ─── Vocabulary loader ────────────────────────────────────────────────────────

async function loadTagVocabulary(): Promise<TagVocab> {
  const { data, error } = await supabaseAdmin
    .from('tags')
    .select('id, slug, tag_group')
    .order('tag_group')
    .order('slug')

  if (error) throw new Error(`Failed to load tag vocabulary: ${error.message}`)
  if (!data?.length) throw new Error('Tag vocabulary is empty — run seed migrations first')

  const slugToId = new Map<string, string>()
  const groupToSlugs = new Map<string, string[]>()

  for (const tag of data as Tag[]) {
    slugToId.set(tag.slug, tag.id)

    if (!groupToSlugs.has(tag.tag_group)) {
      groupToSlugs.set(tag.tag_group, [])
    }
    groupToSlugs.get(tag.tag_group)!.push(tag.slug)
  }

  return { slugToId, groupToSlugs }
}

// ─── Product fetcher (paginated) ──────────────────────────────────────────────

async function fetchUntaggedProducts(vocab: TagVocab): Promise<Product[]> {
  // Fetch already-tagged product IDs in a separate query (Supabase JS doesn't
  // accept raw SQL subqueries in filter args — must pass an array).
  const { data: taggedRows } = await supabaseAdmin.from('product_tags').select('product_id')
  const taggedIds = [...new Set(
    (taggedRows as unknown as { product_id: string }[] ?? []).map(r => r.product_id)
  )]

  const results: Product[] = []
  let page = 0

  while (true) {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabaseAdmin
      .from('products')
      .select('id, slug, name, website_url')
      .not('website_url', 'is', null)

    if (taggedIds.length > 0) {
      q = q.not('id', 'in', `(${taggedIds.join(',')})`)
    }

    const { data, error } = await q.range(from, to).order('created_at', { ascending: true })

    if (error) throw new Error(`Failed to fetch products (page ${page}): ${error.message}`)
    if (!data?.length) break

    results.push(...(data as Product[]))

    if (LIMIT !== null && results.length >= LIMIT) break
    if (data.length < PAGE_SIZE) break

    page++
  }

  return LIMIT !== null ? results.slice(0, LIMIT) : results
}

// ─── Firecrawl scraper ────────────────────────────────────────────────────────

function parseBaseUrl(websiteUrl: string): string {
  try {
    const parsed = new URL(websiteUrl)
    return `${parsed.protocol}//${parsed.hostname}`
  } catch {
    return websiteUrl.replace(/\/+$/, '')
  }
}

async function scrapeProductContent(product: Product): Promise<string> {
  const baseUrl = parseBaseUrl(product.website_url)

  const urlsToTry = [
    product.website_url,
    `${baseUrl}/pricing`,
    `${baseUrl}/features`,
    `${baseUrl}/security`,
  ]

  const parts: string[] = []

  for (const url of urlsToTry) {
    try {
      const result = await fc.scrape(url, {
        formats: ['markdown'],
        timeout: 20000,
      })

      const md = (result as { markdown?: string }).markdown
      if (md && md.trim().length > 0) {
        parts.push(md.trim())
      }
    } catch (err) {
      // Skip on error — non-fatal per spec
      const msg = (err as Error).message?.slice(0, 80) ?? 'unknown error'
      console.warn(`    Firecrawl skip ${url}: ${msg}`)
    }
  }

  const combined = parts.join('\n\n')
  return combined.slice(0, SCRAPE_CONTENT_CAP)
}

// ─── Haiku classification ─────────────────────────────────────────────────────

function buildVocabJson(groupToSlugs: Map<string, string[]>): string {
  const obj: Record<string, string[]> = {}
  for (const [group, slugs] of groupToSlugs.entries()) {
    obj[group] = slugs
  }
  return JSON.stringify(obj, null, 2)
}

async function classifyWithHaiku(
  product: Product,
  content: string,
  vocabJson: string,
): Promise<HaikuClassification | null> {
  const prompt = `You are classifying a software product into a controlled taxonomy.
Product name: ${product.name}

Scraped content (markdown):
${content}

Classify into these tag groups using ONLY the exact slugs listed.
Return ONLY a valid JSON object with these exact keys (use empty arrays if uncertain, max 4 per group):

${vocabJson}

Return ONLY the JSON object, no explanation.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    // Strip optional code fences
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()

    return JSON.parse(cleaned) as HaikuClassification
  } catch (err) {
    console.warn(`    Haiku error for ${product.slug}: ${(err as Error).message?.slice(0, 120)}`)
    return null
  }
}

// ─── Tag validation ───────────────────────────────────────────────────────────

function validateClassification(
  classification: HaikuClassification,
  vocab: TagVocab,
): { tagIds: string[]; tagSlugs: string[] } {
  const tagIds: string[] = []
  const tagSlugs: string[] = []

  for (const [group, values] of Object.entries(classification)) {
    if (!Array.isArray(values)) continue

    const validSlugs = values
      .filter((v): v is string => typeof v === 'string' && vocab.slugToId.has(v))
      .slice(0, MAX_TAGS_PER_GROUP)

    for (const slug of validSlugs) {
      const id = vocab.slugToId.get(slug)!
      tagIds.push(id)
      tagSlugs.push(slug)
    }
  }

  return { tagIds, tagSlugs }
}

// ─── DB insert ────────────────────────────────────────────────────────────────

async function insertProductTags(productId: string, tagIds: string[]): Promise<void> {
  if (tagIds.length === 0) return

  const rows = tagIds.map((tag_id) => ({ product_id: productId, tag_id }))

  const { error } = await supabaseAdmin
    .from('product_tags')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(rows as any)

  // ON CONFLICT DO NOTHING equivalent — insert returns error for dupes, suppress them
  if (error && !(error as { message: string }).message.includes('duplicate') && !(error as { message: string }).message.includes('unique')) {
    throw new Error(`product_tags insert failed for ${productId}: ${(error as { message: string }).message}`)
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Prism Attribute Enrichment ===')
  console.log(`Mode:  ${DRY_RUN ? 'DRY RUN (no inserts)' : 'LIVE'}`)
  console.log(`Limit: ${LIMIT ?? 'none (all untagged)'}`)
  console.log()

  // 1. Load tag vocabulary
  console.log('Loading tag vocabulary...')
  const vocab = await loadTagVocabulary()
  console.log(`  ${vocab.groupToSlugs.size} groups, ${vocab.slugToId.size} tags total`)

  const vocabJson = buildVocabJson(vocab.groupToSlugs)

  // 2. Fetch untagged products
  console.log('\nFetching untagged products...')
  const products = await fetchUntaggedProducts(vocab)
  const total = products.length
  console.log(`  ${total} products to process\n`)

  if (total === 0) {
    console.log('All products are tagged. Nothing to do.')
    return
  }

  // 3. Process each product
  let processed = 0
  let tagged = 0
  let skipped = 0
  let errors = 0

  for (const product of products) {
    processed++

    // a–b. Scrape website content
    let content: string
    try {
      content = await scrapeProductContent(product)
    } catch (err) {
      console.error(`[${processed}/${total}] ERROR ${product.slug}: scrape failed — ${(err as Error).message?.slice(0, 80)}`)
      errors++
      await sleep(DELAY_MS)
      continue
    }

    // c. Skip if too little content
    if (content.length < SCRAPE_MIN_CHARS) {
      console.log(`[${processed}/${total}] SKIP:${product.slug}:no-content`)
      skipped++
      await sleep(DELAY_MS)
      continue
    }

    // d–e. Classify with Haiku
    const classification = await classifyWithHaiku(product, content, vocabJson)

    if (!classification) {
      console.log(`[${processed}/${total}] SKIP:${product.slug}:haiku-error`)
      errors++
      await sleep(DELAY_MS)
      continue
    }

    // f. Validate and filter to known slugs, cap per group
    const { tagIds, tagSlugs } = validateClassification(classification, vocab)

    // g–i. Insert or dry-run
    if (DRY_RUN) {
      console.log(`DRY ${product.slug} → ${tagIds.length} tags: ${tagSlugs.join(', ')}`)
    } else {
      try {
        await insertProductTags(product.id, tagIds)
        tagged++
      } catch (err) {
        console.error(`[${processed}/${total}] ERROR ${product.slug}: insert failed — ${(err as Error).message?.slice(0, 80)}`)
        errors++
        await sleep(DELAY_MS)
        continue
      }
    }

    // j–k. Delay + progress log
    await sleep(DELAY_MS)
    console.log(`[${processed}/${total}] TAGGED ${product.slug} → ${tagIds.length} tags`)

    // l. Running totals every 100 products
    if (processed % 100 === 0) {
      console.log(`\n--- Running totals at ${processed}/${total} ---`)
      console.log(`  Tagged:  ${tagged}`)
      console.log(`  Skipped: ${skipped}`)
      console.log(`  Errors:  ${errors}`)
      console.log()
    }
  }

  // 4. Final summary
  console.log('\n=== Final Summary ===')
  console.log(`Total processed: ${processed}`)
  console.log(`Tagged:          ${DRY_RUN ? '(dry run)' : tagged}`)
  console.log(`Skipped:         ${skipped}`)
  console.log(`Errors:          ${errors}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
