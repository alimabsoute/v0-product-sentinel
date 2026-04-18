/**
 * Shared ingestion core — used by all source-specific ingest scripts.
 * Exports: loadVocabulary, isDuplicate, extractProduct, validateAndFilter, insertProduct
 */

import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '../../lib/supabase-server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Vocab = {
  categories: string[]
  subcategories: Map<string, string[]>
  leaves: Map<string, string[]>
  leafToId: Map<string, string>
  tagGroups: Map<string, Set<string>>
  tagSlugToId: Map<string, string>
}

export type RawItem = {
  name: string
  description: string
  website: string | null
  sourceUrl: string
  source: string
  slug: string
  twitter?: string | null
  github?: string | null
  logoUrl?: string | null
}

export type ExtractedProduct = {
  name: string
  tagline: string
  description: string
  company_name: string | null
  website_url: string | null
  twitter_handle: string | null
  github_repo: string | null
  launched_year: number | null
  launched_month: number | null
  category: string
  sub_category: string
  primary_function: string
  platform: string
  business_model: string | null
  attributes: Record<string, string[]>
  task_search_tags: string[]
  functionality_scores: Record<string, number>
  status: 'active'
  source: string
  source_url: string
  confidence_score: number
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

export function extractRootDomain(url: string | null): string | null {
  if (!url) return null
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    const parts = host.split('.')
    return parts.length > 2 ? parts.slice(-2).join('.') : host
  } catch { return null }
}

export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// ─── Load vocabulary ──────────────────────────────────────────────────────────

export async function loadVocabulary(): Promise<Vocab> {
  const { data: functions, error: fErr } = await supabaseAdmin.from('functions').select('id, slug, depth, parent_id')
  if (fErr) throw fErr
  const { data: tags, error: tErr } = await supabaseAdmin.from('tags').select('id, slug, tag_group')
  if (tErr) throw tErr

  const byId = new Map(functions!.map(f => [f.id, f]))
  const categories: string[] = []
  const subcategories = new Map<string, string[]>()
  const leaves = new Map<string, string[]>()
  const leafToId = new Map<string, string>()

  for (const f of functions!) {
    if (f.depth === 0) { categories.push(f.slug); subcategories.set(f.slug, []) }
  }
  for (const f of functions!) {
    if (f.depth === 1 && f.parent_id) {
      const parent = byId.get(f.parent_id)
      if (parent) subcategories.get(parent.slug)?.push(f.slug)
      leaves.set(f.slug, [])
    }
  }
  for (const f of functions!) {
    if (f.depth === 2 && f.parent_id) {
      const parent = byId.get(f.parent_id)
      if (parent) leaves.get(parent.slug)?.push(f.slug)
      leafToId.set(f.slug, f.id)
    }
  }

  const tagGroups = new Map<string, Set<string>>()
  const tagSlugToId = new Map<string, string>()
  for (const t of tags!) {
    if (!tagGroups.has(t.tag_group)) tagGroups.set(t.tag_group, new Set())
    tagGroups.get(t.tag_group)!.add(t.slug)
    tagSlugToId.set(t.slug, t.id)
  }
  return { categories, subcategories, leaves, leafToId, tagGroups, tagSlugToId }
}

// ─── Dedup cascade ────────────────────────────────────────────────────────────

export async function isDuplicate(item: RawItem): Promise<{ dup: boolean; layer?: string }> {
  const { data: bySlug } = await supabaseAdmin.from('products').select('id').eq('slug', item.slug).maybeSingle()
  if (bySlug) return { dup: true, layer: 'slug' }

  const domain = extractRootDomain(item.website)
  if (domain && !['producthunt.com', 'github.com', 'reddit.com'].includes(domain)) {
    const { data: byDomain } = await supabaseAdmin.from('products').select('id').ilike('website_url', `%${domain}%`).limit(1)
    if (byDomain?.length) return { dup: true, layer: 'domain' }
  }

  const { data: byExact } = await supabaseAdmin.from('products').select('id').ilike('name', item.name).maybeSingle()
  if (byExact) return { dup: true, layer: 'name-exact' }

  if (item.github) {
    const { data: byGh } = await supabaseAdmin.from('products').select('id').eq('github_repo', item.github).maybeSingle()
    if (byGh) return { dup: true, layer: 'github' }
  }

  return { dup: false }
}

// ─── Claude extraction ────────────────────────────────────────────────────────

export async function extractProduct(item: RawItem, vocab: Vocab): Promise<ExtractedProduct | null> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const treeBlock = vocab.categories.map(cat => {
    const subs = vocab.subcategories.get(cat) ?? []
    return `  ${cat}:\n${subs.map(sub => `    ${sub}: [${(vocab.leaves.get(sub) ?? []).join(', ')}]`).join('\n')}`
  }).join('\n')

  const tagGroupsBlock = Array.from(vocab.tagGroups.entries())
    .map(([g, slugs]) => `  ${g}: [${Array.from(slugs).join(', ')}]`).join('\n')

  const prompt = `You are a product data extraction agent for Prism, a product intelligence platform.

Extract structured data from this product listing. Return ONLY a valid JSON object — no preamble, no backticks.

Source: ${item.source}
Name: ${item.name}
Description: ${item.description}
Website: ${item.website ?? '(none)'}
Source URL: ${item.sourceUrl}
${item.github ? `GitHub: ${item.github}` : ''}

IMPORTANT:
- Write original tagline and description copy — do NOT copy the source text verbatim.
- For category/sub_category/primary_function pick from the controlled vocabulary below only.
- Use "-other" leaf if nothing fits precisely.
- For website_url: use the Website value if given. Never return the source URL as website_url.

TAXONOMY RULES (strictly enforced — violations cause the product to be dropped):
- category must be one of the top-level slugs shown (e.g. "ai-tools", "dev-tools", "productivity")
- sub_category must be a DIRECT child of category in the tree — never use a grandchild slug here
- primary_function must be a DIRECT child of sub_category in the tree — never use a parent or sibling slug
- Never assign a depth-2 leaf slug as sub_category, or a depth-1 subcategory slug as primary_function
- Always use kebab-case with hyphens: "voip-sms" not "voip_sms"
- Use exact plural forms shown: "marketplaces" not "marketplace", "reading-apps" not "reading-app"
- If nothing fits, use the nearest "-other" catch-all at each level rather than inventing a new slug

CONTROLLED VOCABULARY:
${treeBlock}

Attribute tag groups:
${tagGroupsBlock}

Return JSON:
{
  "name": "${item.name}",
  "tagline": "<original one-liner max 12 words>",
  "description": "<2-3 original sentences>",
  "company_name": null,
  "website_url": "<https URL or null>",
  "twitter_handle": null,
  "github_repo": ${item.github ? `"${item.github}"` : 'null'},
  "launched_year": <number or null>,
  "launched_month": null,
  "category": "<slug>",
  "sub_category": "<slug>",
  "primary_function": "<slug>",
  "platform": "web|mobile|desktop|cross-platform|hardware",
  "business_model": "<saas|freemium|open-source|perpetual|marketplace or null>",
  "attributes": { "capability": [], "audience": [], "pricing_model": [], "deployment": [], "integration": [], "compliance": [], "tech_stack": [], "data_format": [], "ux_pattern": [], "business_model": [] },
  "task_search_tags": [],
  "functionality_scores": {},
  "status": "active",
  "source": "${item.source}",
  "source_url": "${item.sourceUrl}",
  "confidence_score": 3
}`

  // Retry with exponential backoff — guards against transient network blips
  let msg: Awaited<ReturnType<typeof anthropic.messages.create>>
  const maxRetries = 4
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001', // Haiku for cost — Sonnet not needed for this extraction
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      })
      break
    } catch (err) {
      const isLast = attempt === maxRetries
      const isRetryable = !(err instanceof Error && err.message.includes('credit balance'))
      if (isLast || !isRetryable) throw err
      const waitMs = 2000 * 2 ** attempt  // 2s, 4s, 8s, 16s
      console.warn(`    API error (attempt ${attempt + 1}/${maxRetries}), retrying in ${waitMs / 1000}s: ${(err as Error).message?.slice(0, 80)}`)
      await sleep(waitMs)
    }
  }
  const text = msg!.content[0].type === 'text' ? msg!.content[0].text : ''
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  try {
    return JSON.parse(cleaned) as ExtractedProduct
  } catch {
    console.error(`JSON parse failed for ${item.slug}:`, text.slice(0, 200))
    return null
  }
}

// ─── Validate + filter vocab ──────────────────────────────────────────────────

export function validateAndFilter(extracted: ExtractedProduct, vocab: Vocab): { valid: boolean; reason?: string; cleaned?: ExtractedProduct } {
  if (!vocab.categories.includes(extracted.category))
    return { valid: false, reason: `unknown category: ${extracted.category}` }
  if (!(vocab.subcategories.get(extracted.category) ?? []).includes(extracted.sub_category))
    return { valid: false, reason: `unknown sub_category: ${extracted.sub_category}` }
  if (!(vocab.leaves.get(extracted.sub_category) ?? []).includes(extracted.primary_function))
    return { valid: false, reason: `unknown primary_function: ${extracted.primary_function}` }

  const cleanedAttrs: Record<string, string[]> = {}
  for (const [group, values] of Object.entries(extracted.attributes ?? {})) {
    const allowed = vocab.tagGroups.get(group)
    if (!allowed) continue
    cleanedAttrs[group] = (values ?? []).filter(v => allowed.has(v))
  }
  return { valid: true, cleaned: { ...extracted, attributes: cleanedAttrs } }
}

// ─── Insert product + tags ────────────────────────────────────────────────────

export async function insertProduct(item: RawItem, extracted: ExtractedProduct, vocab: Vocab): Promise<string | null> {
  const companyName = extracted.company_name ?? extracted.name
  const companySlug = normalizeName(companyName)
  const { data: company, error: cErr } = await supabaseAdmin
    .from('companies')
    .upsert({ name: companyName, slug: companySlug }, { onConflict: 'slug', ignoreDuplicates: false })
    .select('id').single()
  if (cErr) { console.error(`Company upsert failed:`, cErr); return null }

  const primaryFunctionId = vocab.leafToId.get(extracted.primary_function)!
  const { data: product, error: pErr } = await supabaseAdmin.from('products').insert({
    company_id: company.id,
    name: extracted.name,
    slug: item.slug,
    launched_year: extracted.launched_year,
    launched_month: extracted.launched_month,
    primary_function_id: primaryFunctionId,
    sub_category: extracted.sub_category,
    category: extracted.category,
    platform: extracted.platform,
    business_model: extracted.business_model,
    status: extracted.status,
    source: extracted.source,
    source_url: extracted.source_url,
    confidence_score: extracted.confidence_score,
    website_url: extracted.website_url,
    twitter_handle: extracted.twitter_handle,
    github_repo: extracted.github_repo,
    description: extracted.description,
    task_search_tags: extracted.task_search_tags,
    functionality_scores: extracted.functionality_scores,
    logo_url: item.logoUrl ?? null,
    logo_source: item.logoUrl ? 'source' : 'none',
    logo_confidence: item.logoUrl ? 4 : 1,
  }).select('id').single()

  if (pErr) { console.error(`Product insert failed for ${item.name}:`, pErr); return null }

  const tagRows = Object.values(extracted.attributes)
    .flat()
    .map(slug => vocab.tagSlugToId.get(slug))
    .filter((id): id is string => Boolean(id))
    .map(tag_id => ({ product_id: product.id, tag_id }))

  if (tagRows.length > 0) {
    const { error: tErr } = await supabaseAdmin.from('product_tags').insert(tagRows)
    if (tErr) console.error(`product_tags insert failed:`, tErr)
  }
  return product.id
}

// ─── Generic run loop ─────────────────────────────────────────────────────────

export async function runIngestion(source: string, items: RawItem[]): Promise<void> {
  console.log(`\nLoading vocabulary...`)
  const vocab = await loadVocabulary()
  console.log(`  ${vocab.categories.length} categories, ${vocab.leafToId.size} leaves`)
  console.log(`\nProcessing ${items.length} items from ${source}...\n`)

  let inserted = 0, skippedDup = 0, skippedInvalid = 0, failed = 0

  for (const item of items) {
    const dup = await isDuplicate(item)
    if (dup.dup) { console.log(`  SKIP ${item.slug} (dup:${dup.layer})`); skippedDup++; continue }

    const extracted = await extractProduct(item, vocab)
    if (!extracted) { failed++; continue }

    const validation = validateAndFilter(extracted, vocab)
    if (!validation.valid) { console.log(`  SKIP ${item.slug} (${validation.reason})`); skippedInvalid++; continue }

    const id = await insertProduct(item, validation.cleaned!, vocab)
    if (id) { console.log(`  INSERT ${item.slug} → ${id}`); inserted++ }
    else failed++

    await sleep(300) // rate limit Claude
  }

  console.log(`\n✅ ${source}: inserted=${inserted} dup=${skippedDup} invalid=${skippedInvalid} failed=${failed}`)
}
