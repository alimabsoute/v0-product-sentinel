/**
 * Product Hunt ingestion — Day 4 skeleton
 *
 * Flow:
 *   1. Fetch featured posts from PH GraphQL API (official token)
 *   2. For each post: dedup cascade (slug → domain → pg_trgm → twitter → github)
 *   3. If unique: Claude Sonnet extraction with vocabulary-constrained prompt
 *   4. Validate extracted attributes against controlled vocab (drop unknowns)
 *   5. Resolve primary_function_id from functions.slug
 *   6. Insert products row + product_tags join rows
 *
 * Run:
 *   pnpm tsx scripts/ingest-product-hunt.ts --limit=50
 *
 * Env required:
 *   SUPABASE_SERVICE_ROLE_KEY       (write path bypasses RLS)
 *   NEXT_PUBLIC_SUPABASE_URL
 *   PRODUCT_HUNT_DEVELOPER_TOKEN    (api.producthunt.com/v2/oauth/applications)
 *   ANTHROPIC_API_KEY
 */

import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '../lib/supabase-server'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type PHPost = {
  id: string
  name: string
  tagline: string
  slug: string
  url: string
  website: string | null
  description: string | null
  createdAt: string
  thumbnail: { url: string | null } | null
  topics: { edges: { node: { name: string; slug: string } }[] }
  makers: { twitterUsername: string | null }[]
}

type ExtractedProduct = {
  name: string
  tagline: string
  description: string
  company_name: string | null
  website_url: string | null
  twitter_handle: string | null
  github_repo: string | null
  launched_year: number | null
  launched_month: number | null
  primary_function: string              // MUST be a functions.slug at depth 2
  sub_category: string                  // MUST be a functions.slug at depth 1
  category: string                      // MUST be a functions.slug at depth 0
  platform: 'web' | 'mobile' | 'desktop' | 'cross-platform' | 'hardware'
  business_model: string | null
  attributes: Record<string, string[]>  // tag_group → slug[], validated against tags table
  task_search_tags: string[]
  functionality_scores: Record<string, number>
  status: 'active'
  source: 'product_hunt'
  source_url: string
  confidence_score: number
}

// ─────────────────────────────────────────────────────────────
// Clients
// ─────────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PH_TOKEN = process.env.PRODUCT_HUNT_DEVELOPER_TOKEN
if (!PH_TOKEN) throw new Error('Missing PRODUCT_HUNT_DEVELOPER_TOKEN')

// ─────────────────────────────────────────────────────────────
// Vocabulary cache — loaded once at boot, passed into prompt
// ─────────────────────────────────────────────────────────────

type Vocab = {
  categories: string[]              // depth 0 slugs
  subcategories: Map<string, string[]> // category slug → subcategory slugs
  leaves: Map<string, string[]>     // subcategory slug → leaf slugs
  leafToId: Map<string, string>     // leaf slug → function UUID
  tagGroups: Map<string, Set<string>> // tag_group → set of valid slugs
  tagSlugToId: Map<string, string>  // tag slug → tags.id
}

async function loadVocabulary(): Promise<Vocab> {
  const { data: functions, error: fErr } = await supabaseAdmin
    .from('functions')
    .select('id, slug, depth, parent_id')
  if (fErr) throw fErr

  const { data: tags, error: tErr } = await supabaseAdmin
    .from('tags')
    .select('id, slug, tag_group')
  if (tErr) throw tErr

  const byId = new Map(functions!.map((f) => [f.id, f]))
  const categories: string[] = []
  const subcategories = new Map<string, string[]>()
  const leaves = new Map<string, string[]>()
  const leafToId = new Map<string, string>()

  for (const f of functions!) {
    if (f.depth === 0) {
      categories.push(f.slug)
      subcategories.set(f.slug, [])
    }
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

// ─────────────────────────────────────────────────────────────
// Step 1: Fetch from Product Hunt GraphQL
// ─────────────────────────────────────────────────────────────

async function fetchFeaturedPosts(limit: number): Promise<PHPost[]> {
  const query = `
    query FeaturedPosts($first: Int!) {
      posts(first: $first, featured: true, order: VOTES) {
        edges {
          node {
            id
            name
            tagline
            slug
            url
            website
            description
            createdAt
            thumbnail { url }
            topics(first: 5) { edges { node { name slug } } }
            makers { twitterUsername }
          }
        }
      }
    }
  `

  const res = await fetch('https://api.producthunt.com/v2/api/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables: { first: limit } }),
  })

  if (!res.ok) throw new Error(`PH GraphQL ${res.status}: ${await res.text()}`)
  const json = await res.json()
  if (json.errors) throw new Error(`PH GraphQL errors: ${JSON.stringify(json.errors)}`)

  return json.data.posts.edges.map((e: { node: PHPost }) => e.node)
}

// ─────────────────────────────────────────────────────────────
// Step 2: Dedup cascade (layers 1-5, layer 6 embedding deferred)
// ─────────────────────────────────────────────────────────────

function extractRootDomain(url: string | null): string | null {
  if (!url) return null
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    const parts = host.split('.')
    return parts.length > 2 ? parts.slice(-2).join('.') : host
  } catch {
    return null
  }
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

async function isDuplicate(post: PHPost): Promise<{ dup: boolean; layer?: string; existingId?: string }> {
  const slug = post.slug

  // Layer 1 — exact slug match
  const { data: bySlug } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (bySlug) return { dup: true, layer: 'slug', existingId: bySlug.id }

  // Layer 2 — root domain match (skip producthunt.com — that's a redirect host, not a real product domain)
  const domain = extractRootDomain(post.website)
  if (domain && domain !== 'producthunt.com') {
    const { data: byDomain } = await supabaseAdmin
      .from('products')
      .select('id, website_url')
      .ilike('website_url', `%${domain}%`)
      .limit(1)
    if (byDomain && byDomain.length > 0) {
      return { dup: true, layer: 'domain', existingId: byDomain[0].id }
    }
  }

  // Layer 3 — pg_trgm fuzzy name match (> 0.8)
  const normalizedName = normalizeName(post.name)
  const { data: byName } = await supabaseAdmin.rpc('trgm_match_product', {
    normalized_name: normalizedName,
    threshold: 0.8,
  }).maybeSingle()
  // TODO: create function trgm_match_product(text, float) in a later migration.
  // For Day 4 initial run we fall back to exact name match if RPC missing:
  if (!byName) {
    const { data: byExactName } = await supabaseAdmin
      .from('products')
      .select('id')
      .ilike('name', post.name)
      .maybeSingle()
    if (byExactName) return { dup: true, layer: 'name-exact', existingId: byExactName.id }
  }

  // Layer 4 — twitter handle match
  const twitter = post.makers[0]?.twitterUsername
  if (twitter) {
    const { data: byTwitter } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('twitter_handle', twitter)
      .maybeSingle()
    if (byTwitter) return { dup: true, layer: 'twitter', existingId: byTwitter.id }
  }

  // Layer 5 — github repo match: PH rarely returns this. Extracted by Sonnet
  // in the enrichment step, so we re-check after extraction before insert.

  // Layer 6 — pgvector embedding: deferred until name_embedding column exists.

  return { dup: false }
}

// ─────────────────────────────────────────────────────────────
// Step 3: Claude Sonnet extraction with vocabulary constraints
// ─────────────────────────────────────────────────────────────

function buildExtractionPrompt(post: PHPost, vocab: Vocab): string {
  // Build the full hierarchical tree: category → subcategory → leaves
  const treeBlock = vocab.categories
    .map((cat) => {
      const subs = vocab.subcategories.get(cat) ?? []
      const subLines = subs.map((sub) => {
        const leaves = vocab.leaves.get(sub) ?? []
        return `    ${sub}: [${leaves.join(', ')}]`
      })
      return `  ${cat}:\n${subLines.join('\n')}`
    })
    .join('\n')

  const tagGroupsBlock = Array.from(vocab.tagGroups.entries())
    .map(([g, slugs]) => `  ${g}: [${Array.from(slugs).join(', ')}]`)
    .join('\n')

  return `You are a product data extraction agent for Prism, a product intelligence platform.

Extract structured data from this Product Hunt post. Return ONLY a valid JSON object — no preamble, no backticks.

Product Hunt post:
  Name: ${post.name}
  Tagline: ${post.tagline}
  Description: ${post.description ?? '(none)'}
  Website: ${post.website ?? '(none)'}
  PH permalink: ${post.url}
  Topics: ${post.topics.edges.map((e) => e.node.name).join(', ')}
  Created: ${post.createdAt}

IMPORTANT:
- For "website_url" return the value from "Website" above. If Website is "(none)" return null.
- NEVER return the PH permalink as website_url — that is not the product's real site.
- For category / sub_category / primary_function you MUST pick from the controlled vocabulary below. Do not invent slugs.
- If nothing fits precisely for primary_function, use the "-other" leaf of the closest subcategory (e.g. "ai-writing-assistant-other").

CONTROLLED VOCABULARY — hierarchical tree of category → subcategory → [leaves]:
${treeBlock}

Attribute tag groups (pick any number per group from these slugs only):
${tagGroupsBlock}

Return this JSON shape:
{
  "name": "${post.name}",
  "tagline": "${post.tagline}",
  "description": "<1-3 sentence factual description, no marketing fluff>",
  "company_name": "<company name or null if same as product>",
  "website_url": "<canonical https URL or null>",
  "twitter_handle": "<handle without @ or null>",
  "github_repo": "<owner/repo or null>",
  "launched_year": <number>,
  "launched_month": <1-12>,
  "category": "<one slug from categories list>",
  "sub_category": "<one slug from the subcategories under that category>",
  "primary_function": "<one slug from the leaves under that subcategory>",
  "platform": "web|mobile|desktop|cross-platform|hardware",
  "business_model": "<saas|freemium|open-source|perpetual|marketplace or null>",
  "attributes": {
    "capability": ["<slug>", ...],
    "audience": ["<slug>", ...],
    "pricing_model": ["<slug>", ...],
    "deployment": ["<slug>", ...],
    "integration": ["<slug>", ...],
    "compliance": ["<slug>", ...],
    "tech_stack": ["<slug>", ...],
    "data_format": ["<slug>", ...],
    "ux_pattern": ["<slug>", ...],
    "business_model": ["<slug>", ...]
  },
  "task_search_tags": ["<short action phrase>", ...],
  "functionality_scores": {
    "<dimension>": <1-5>
  },
  "status": "active",
  "source": "product_hunt",
  "source_url": "${post.url}",
  "confidence_score": 4
}`
}

async function extractProduct(post: PHPost, vocab: Vocab): Promise<ExtractedProduct | null> {
  const prompt = buildExtractionPrompt(post, vocab)
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  // Strip any stray ```json fences Claude may add despite instructions
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  try {
    return JSON.parse(cleaned) as ExtractedProduct
  } catch (e) {
    console.error(`Extraction JSON parse failed for ${post.slug}:`, e)
    console.error(`  raw text (first 300):`, text.slice(0, 300))
    return null
  }
}

// ─────────────────────────────────────────────────────────────
// Step 4: Validate extracted attributes against vocabulary
// ─────────────────────────────────────────────────────────────

function validateAndFilter(extracted: ExtractedProduct, vocab: Vocab): { valid: boolean; reason?: string; cleaned?: ExtractedProduct } {
  // category must be a depth-0 slug
  if (!vocab.categories.includes(extracted.category)) {
    return { valid: false, reason: `unknown category: ${extracted.category}` }
  }
  // sub_category must be a depth-1 slug under that category
  const validSubcats = vocab.subcategories.get(extracted.category) ?? []
  if (!validSubcats.includes(extracted.sub_category)) {
    return { valid: false, reason: `unknown sub_category: ${extracted.sub_category} (category=${extracted.category})` }
  }
  // primary_function must resolve to a leaf under that subcategory
  const validLeaves = vocab.leaves.get(extracted.sub_category) ?? []
  if (!validLeaves.includes(extracted.primary_function)) {
    return { valid: false, reason: `unknown primary_function: ${extracted.primary_function} (sub_category=${extracted.sub_category})` }
  }
  // Drop PH redirect URLs — Claude sometimes returns them despite instructions
  if (extracted.website_url && extracted.website_url.includes('producthunt.com/r/')) {
    extracted = { ...extracted, website_url: null }
  }

  // Filter attribute values not in the controlled vocab (log misses)
  const cleanedAttrs: Record<string, string[]> = {}
  for (const [group, values] of Object.entries(extracted.attributes ?? {})) {
    const allowed = vocab.tagGroups.get(group)
    if (!allowed) {
      console.warn(`vocabulary miss — unknown tag_group: ${group}`)
      continue
    }
    cleanedAttrs[group] = (values ?? []).filter((v) => {
      if (!allowed.has(v)) {
        console.warn(`vocabulary miss — ${group}/${v}`)
        return false
      }
      return true
    })
  }

  return { valid: true, cleaned: { ...extracted, attributes: cleanedAttrs } }
}

// ─────────────────────────────────────────────────────────────
// Step 5: Logo cascade (stub — Day 4.5)
// ─────────────────────────────────────────────────────────────

async function resolveLogoUrl(post: PHPost, _websiteDomain: string | null): Promise<{ url: string | null; source: string; confidence: number }> {
  // Layer 1 — PH GraphQL thumbnail.url (best for PH-sourced products)
  if (post.thumbnail?.url) {
    return { url: post.thumbnail.url, source: 'product_hunt', confidence: 5 }
  }
  // Layers 2-5 (Brandfetch / Clearbit / Firecrawl og:image / Google favicon) — TODO Day 4.5
  return { url: null, source: 'none', confidence: 1 }
}

// ─────────────────────────────────────────────────────────────
// Step 6: Insert to products + product_tags
// ─────────────────────────────────────────────────────────────

async function insertProduct(post: PHPost, extracted: ExtractedProduct, vocab: Vocab): Promise<string | null> {
  // Upsert company first
  const companyName = extracted.company_name ?? extracted.name
  const companySlug = normalizeName(companyName)
  const { data: company, error: cErr } = await supabaseAdmin
    .from('companies')
    .upsert({ name: companyName, slug: companySlug }, { onConflict: 'slug', ignoreDuplicates: false })
    .select('id')
    .single()
  if (cErr) {
    console.error(`Company upsert failed for ${extracted.name}:`, cErr)
    return null
  }

  const logo = await resolveLogoUrl(post, extractRootDomain(extracted.website_url))
  const primaryFunctionId = vocab.leafToId.get(extracted.primary_function)!

  const { data: product, error: pErr } = await supabaseAdmin
    .from('products')
    .insert({
      company_id: company.id,
      name: extracted.name,
      slug: post.slug,
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
      logo_url: logo.url,
      logo_source: logo.source,
      logo_confidence: logo.confidence,
    })
    .select('id')
    .single()

  if (pErr) {
    console.error(`Product insert failed for ${extracted.name}:`, pErr)
    return null
  }

  // Insert product_tags many-to-many
  const tagRows: { product_id: string; tag_id: string }[] = []
  for (const values of Object.values(extracted.attributes)) {
    for (const slug of values) {
      const tagId = vocab.tagSlugToId.get(slug)
      if (tagId) tagRows.push({ product_id: product.id, tag_id: tagId })
    }
  }
  if (tagRows.length > 0) {
    const { error: tErr } = await supabaseAdmin.from('product_tags').insert(tagRows)
    if (tErr) console.error(`product_tags insert failed for ${extracted.name}:`, tErr)
  }

  return product.id
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 50

  console.log(`Loading vocabulary from Supabase...`)
  const vocab = await loadVocabulary()
  console.log(`  ${vocab.categories.length} categories, ${vocab.leafToId.size} leaves, ${vocab.tagSlugToId.size} tags`)

  console.log(`Fetching top ${limit} featured posts from Product Hunt...`)
  const posts = await fetchFeaturedPosts(limit)
  console.log(`  ${posts.length} posts retrieved`)

  let inserted = 0
  let skippedDup = 0
  let skippedInvalid = 0
  let failed = 0

  for (const post of posts) {
    const dupCheck = await isDuplicate(post)
    if (dupCheck.dup) {
      console.log(`  SKIP ${post.slug} (dup via ${dupCheck.layer})`)
      skippedDup++
      continue
    }

    const extracted = await extractProduct(post, vocab)
    if (!extracted) {
      failed++
      continue
    }

    const validation = validateAndFilter(extracted, vocab)
    if (!validation.valid) {
      console.log(`  SKIP ${post.slug} (invalid: ${validation.reason})`)
      skippedInvalid++
      continue
    }

    const id = await insertProduct(post, validation.cleaned!, vocab)
    if (id) {
      console.log(`  INSERT ${post.slug} → ${id}`)
      inserted++
    } else {
      failed++
    }
  }

  console.log(`\nDone. inserted=${inserted} dup=${skippedDup} invalid=${skippedInvalid} failed=${failed}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
