/**
 * News feed ingestion — 8 RSS sources
 *
 * Cost strategy:
 *   1. Keyword pre-filter (free) — drop articles with no product signals
 *   2. Haiku classifier — is_product_relevant, event_type, sentiment (cheap)
 *   3. Sonnet escalation — only for funding articles (extract round detail)
 *   Target: ~$7/mo at 1500 articles/day (vs $125/mo naive all-Sonnet)
 *
 * Run:
 *   pnpm tsx --env-file=.env.local scripts/ingest-news.ts [--limit=50] [--source=TechCrunch]
 *
 * Env required:
 *   ANTHROPIC_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import Parser from 'rss-parser'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '../lib/supabase-server'
import { sleep } from './shared/ingest-core'

// ─── Sources ─────────────────────────────────────────────────────────────────

const NEWS_SOURCES = [
  { name: 'TechCrunch',      rss: 'https://techcrunch.com/feed/',                   category: 'startup',       reliability: 5 },
  { name: 'The Verge',       rss: 'https://www.theverge.com/rss/index.xml',          category: 'consumer-tech', reliability: 5 },
  { name: 'Product Hunt',    rss: 'https://www.producthunt.com/feed',                category: 'products',      reliability: 5 },
  { name: 'VentureBeat',     rss: 'https://venturebeat.com/feed/',                  category: 'enterprise',    reliability: 4 },
  { name: 'Wired',           rss: 'https://www.wired.com/feed/rss',                 category: 'consumer-tech', reliability: 4 },
  { name: 'ArsTechnica',     rss: 'http://feeds.arstechnica.com/arstechnica/index',  category: 'deep-tech',     reliability: 5 },
  { name: 'MIT Tech Review', rss: 'https://www.technologyreview.com/feed/',          category: 'research',      reliability: 5 },
  { name: 'Hacker News',     rss: 'https://news.ycombinator.com/rss',               category: 'dev-tools',     reliability: 4 },
] as const

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = 'launch' | 'acquisition' | 'shutdown' | 'funding' | 'update' | 'controversy' | 'other'

type NewsAnalysis = {
  is_product_relevant: boolean
  product_name: string | null
  event_type: EventType
  sentiment: -1 | 0 | 1
  importance_score: number        // 1-5
  summary: string | null          // 1-sentence summary
  condensed_title: string | null  // punchy rewrite <80 chars
  blurb: string | null            // 1-2 sentence standalone summary
}

type FundingExtraction = {
  round_type: string              // seed | series-a | series-b | ipo | acquisition
  amount_usd: number | null
  investors: string[]
  valuation_usd: number | null
  is_disclosed: boolean
  company_name: string | null
}

type RSSItem = {
  title?: string
  link?: string
  pubDate?: string
  contentSnippet?: string
  content?: string
  guid?: string
}

// ─── Keyword pre-filter (free tier) ──────────────────────────────────────────

const PRODUCT_KEYWORDS = [
  // Launch signals
  'launch', 'launched', 'unveil', 'release', 'ship', 'new tool', 'new app',
  'new platform', 'open source', 'open-source', 'beta', 'v2', 'v3',
  // Funding signals
  'raises', 'raised', 'funding', 'series a', 'series b', 'seed round',
  'million', 'valuation', 'investor', 'backed', 'venture',
  // M&A / shutdown signals
  'acqui', 'acqui-hire', 'shuts down', 'shut down', 'discontinu', 'pivot',
  // Product names often carry these patterns
  'ai', 'saas', 'api', 'sdk', 'app', 'platform', 'tool', 'startup',
]

function passesKeywordFilter(title: string, snippet: string): boolean {
  const text = `${title} ${snippet}`.toLowerCase()
  return PRODUCT_KEYWORDS.some(kw => text.includes(kw))
}

// ─── Haiku classifier ─────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function classifyArticle(title: string, snippet: string, source: string): Promise<NewsAnalysis | null> {
  const prompt = `Classify this tech news article for a product intelligence platform. Return ONLY a valid JSON object — no markdown, no prose.

Source: ${source}
Title: ${title}
Snippet: ${snippet.slice(0, 500)}

Return exactly this JSON shape:
{
  "is_product_relevant": <true if this covers a specific product/startup/tool, false for op-eds/politics/general trend pieces>,
  "product_name": "<best guess at product or company name, or null>",
  "event_type": "launch|acquisition|shutdown|funding|update|controversy|other",
  "sentiment": <-1 negative | 0 neutral | 1 positive>,
  "importance_score": <1 minor | 2 low | 3 medium | 4 high | 5 major event>,
  "summary": "<one crisp sentence for snippet field, or null>",
  "condensed_title": "<punchy rewrite of headline under 80 chars, present tense, no clickbait — or null if not product-relevant>",
  "blurb": "<1-2 sentence reader-friendly summary: what happened + why it matters. Null if not relevant>"
}`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  try {
    return JSON.parse(cleaned) as NewsAnalysis
  } catch {
    return null
  }
}

// ─── Sonnet funding extractor (escalation only) ───────────────────────────────

async function extractFundingRound(title: string, snippet: string): Promise<FundingExtraction | null> {
  const prompt = `Extract funding round details from this article. Return ONLY a valid JSON object.

Title: ${title}
Snippet: ${snippet.slice(0, 800)}

Return:
{
  "round_type": "seed|series-a|series-b|series-c|series-d|growth|ipo|acquisition|bridge|debt|other",
  "amount_usd": <number in full dollars, e.g. 5000000 for $5M, or null if undisclosed>,
  "investors": ["<firm or person name>", ...],
  "valuation_usd": <number or null if not mentioned>,
  "is_disclosed": <true if amount was stated>,
  "company_name": "<company or product name>"
}`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  try {
    return JSON.parse(cleaned) as FundingExtraction
  } catch {
    return null
  }
}

// ─── Product linker — fuzzy match article to existing products ────────────────

async function findProductId(productName: string | null): Promise<string | null> {
  if (!productName) return null

  // Exact name match first
  const { data: exact } = await supabaseAdmin
    .from('products')
    .select('id')
    .ilike('name', productName)
    .maybeSingle()
  if (exact) return exact.id

  // Partial name match (contains)
  const { data: partial } = await supabaseAdmin
    .from('products')
    .select('id, name')
    .ilike('name', `%${productName.split(' ')[0]}%`)
    .limit(1)
  if (partial?.length) return partial[0].id

  return null
}

// ─── Write to Supabase ────────────────────────────────────────────────────────

async function upsertPressMention(
  item: RSSItem,
  source: typeof NEWS_SOURCES[number],
  analysis: NewsAnalysis,
  productId: string | null,
): Promise<boolean> {
  const url = item.link ?? item.guid
  if (!url) return false

  // Dedup on URL (UNIQUE constraint)
  const { data: existing } = await supabaseAdmin
    .from('press_mentions')
    .select('id')
    .eq('url', url)
    .maybeSingle()
  if (existing) return false

  const mentionDate = item.pubDate ? new Date(item.pubDate) : new Date()

  const { error } = await supabaseAdmin.from('press_mentions').insert({
    product_id: productId,
    publication: source.name,
    headline: item.title ?? null,
    snippet: analysis.summary ?? item.contentSnippet?.slice(0, 500) ?? null,
    url,
    mention_year: mentionDate.getFullYear(),
    mention_date: mentionDate.toISOString().split('T')[0],
    sentiment: analysis.sentiment,
    source: 'rss',
    metadata: {
      event_type: analysis.event_type,
      importance_score: analysis.importance_score,
      category: source.category,
      reliability: source.reliability,
      condensed_title: analysis.condensed_title ?? null,
      blurb: analysis.blurb ?? null,
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
    },
  })

  if (error) {
    // Ignore unique constraint violation — race condition between runs
    if (error.code !== '23505') console.error(`press_mentions insert failed:`, error.message)
    return false
  }
  return true
}

async function insertFundingRound(
  funding: FundingExtraction,
  productId: string | null,
  mentionDate: Date,
): Promise<void> {
  if (!productId) return

  // Link to company via product
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('company_id')
    .eq('id', productId)
    .maybeSingle()
  if (!product?.company_id) return

  const { error } = await supabaseAdmin.from('funding_rounds').insert({
    company_id: product.company_id,
    round_type: funding.round_type,
    amount_usd: funding.amount_usd,
    investors: funding.investors,       // JSONB — array stored as JSON
    valuation_usd: funding.valuation_usd,
    is_disclosed: funding.is_disclosed,
    year: mentionDate.getFullYear(),
    month: mentionDate.getMonth() + 1,
    source: 'rss',
  })

  if (error && error.code !== '23505') {
    console.error(`funding_rounds insert failed:`, error.message)
  }
}

// ─── RSS fetch ────────────────────────────────────────────────────────────────

async function fetchFeed(url: string, limit: number): Promise<RSSItem[]> {
  const parser = new Parser({ timeout: 10000 })
  try {
    const feed = await parser.parseURL(url)
    return feed.items.slice(0, limit) as RSSItem[]
  } catch (e) {
    console.error(`  RSS fetch failed for ${url}:`, (e as Error).message)
    return []
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const limitArg = process.argv.find(a => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 30

  const sourceArg = process.argv.find(a => a.startsWith('--source='))
  const sourceFilter = sourceArg?.split('=')[1]

  const sources = sourceFilter
    ? NEWS_SOURCES.filter(s => s.name.toLowerCase() === sourceFilter.toLowerCase())
    : NEWS_SOURCES

  if (sourceFilter && sources.length === 0) {
    console.error(`Unknown source: ${sourceFilter}. Valid: ${NEWS_SOURCES.map(s => s.name).join(', ')}`)
    process.exit(1)
  }

  let totalFetched = 0, totalFiltered = 0, totalInserted = 0, totalFunding = 0, totalFailed = 0

  for (const source of sources) {
    console.log(`\n📡 ${source.name}`)
    const items = await fetchFeed(source.rss, limit)
    console.log(`   ${items.length} items fetched`)

    for (const item of items) {
      const title = item.title ?? ''
      const snippet = item.contentSnippet ?? item.content ?? ''
      totalFetched++

      // Layer 1: keyword pre-filter
      if (!passesKeywordFilter(title, snippet)) {
        totalFiltered++
        continue
      }

      // Layer 2: Haiku classification
      const analysis = await classifyArticle(title, snippet, source.name)
      if (!analysis || !analysis.is_product_relevant) {
        totalFiltered++
        await sleep(50)
        continue
      }

      // Link to existing product
      const productId = await findProductId(analysis.product_name)

      // Write press_mention
      const inserted = await upsertPressMention(item, source, analysis, productId)
      if (inserted) {
        const icon = analysis.event_type === 'funding' ? '💰' : analysis.event_type === 'launch' ? '🚀' : '📰'
        console.log(`   ${icon} INSERT  [${analysis.event_type}] ${title.slice(0, 60)}`)
        totalInserted++

        // Layer 3: Sonnet escalation for funding articles
        if (analysis.event_type === 'funding') {
          const funding = await extractFundingRound(title, snippet)
          if (funding) {
            const mentionDate = item.pubDate ? new Date(item.pubDate) : new Date()
            await insertFundingRound(funding, productId, mentionDate)
            const amt = funding.amount_usd ? `$${(funding.amount_usd / 1e6).toFixed(1)}M` : 'undisclosed'
            console.log(`      💸 funding: ${funding.round_type} ${amt} — ${funding.company_name}`)
            totalFunding++
          }
        }
      }

      await sleep(100) // gentle rate limit
    }
  }

  console.log(`\n✅ News feed complete`)
  console.log(`   fetched=${totalFetched} filtered=${totalFiltered} inserted=${totalInserted} funding_rounds=${totalFunding} failed=${totalFailed}`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
