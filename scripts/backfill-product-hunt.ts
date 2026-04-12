/**
 * Product Hunt historical backfill
 *
 * Iterates PH's GraphQL API month-by-month using postedAfter/postedBefore
 * filters + cursor pagination to pull the full post history.
 *
 * Estimated yield:
 *   2020–2026 = ~72 months × ~200 posts/month = ~14,000 products
 *   2014–2026 = ~144 months × ~100–300 posts/month = ~25,000–40,000 products
 *
 * Cost estimate (Haiku @ $0.0025/product):
 *   14,000 products × $0.0025 = ~$35 one-time
 *   Spread over several runs to respect rate limits.
 *
 * Usage:
 *   pnpm tsx --env-file=.env.local scripts/backfill-product-hunt.ts
 *   pnpm tsx --env-file=.env.local scripts/backfill-product-hunt.ts --from=2023-01 --to=2024-12
 *   pnpm tsx --env-file=.env.local scripts/backfill-product-hunt.ts --month=2024-03
 *   pnpm tsx --env-file=.env.local scripts/backfill-product-hunt.ts --dry-run
 *
 * Flags:
 *   --from=YYYY-MM       Start month (default: 2020-01)
 *   --to=YYYY-MM         End month (default: current month)
 *   --month=YYYY-MM      Single month shorthand
 *   --dry-run            Fetch + log, don't insert to DB
 *   --pages-per-month=N  Max pages per month (default: 25 = ~500 posts)
 *   --delay=N            Ms between pages (default: 400)
 *
 * Progress:
 *   Writes .backfill-progress.json after each month so you can resume if interrupted.
 *
 * Env required:
 *   PRODUCT_HUNT_DEVELOPER_TOKEN
 *   ANTHROPIC_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import fs from 'fs'
import path from 'path'
import { runIngestion, type RawItem, sleep } from './shared/ingest-core'

// ─── Config ───────────────────────────────────────────────────────────────────

const PH_TOKEN = process.env.PRODUCT_HUNT_DEVELOPER_TOKEN
if (!PH_TOKEN) throw new Error('Missing PRODUCT_HUNT_DEVELOPER_TOKEN')

const PH_GQL = 'https://api.producthunt.com/v2/api/graphql'
const PROGRESS_FILE = path.join(process.cwd(), '.backfill-progress.json')
const PAGE_SIZE = 20          // PH hard cap per request
const DEFAULT_MAX_PAGES = 25  // 25 pages × 20 = 500 posts per month

// ─── Types ────────────────────────────────────────────────────────────────────

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
  topics: { edges: { node: { name: string } }[] }
  makers: { twitterUsername: string | null }[]
}

type PageInfo = { hasNextPage: boolean; endCursor: string | null }

type Progress = {
  completedMonths: string[]   // "YYYY-MM" strings
  totalInserted: number
  totalSkipped: number
  lastRun: string
}

// ─── PH GraphQL fetch (one page) ─────────────────────────────────────────────

async function fetchPage(
  postedAfter: string,
  postedBefore: string,
  cursor: string | null,
): Promise<{ posts: PHPost[]; pageInfo: PageInfo }> {
  const query = `
    query BackfillPosts($first: Int!, $postedAfter: DateTime!, $postedBefore: DateTime!, $after: String) {
      posts(first: $first, postedAfter: $postedAfter, postedBefore: $postedBefore, after: $after, order: NEWEST) {
        pageInfo { hasNextPage endCursor }
        edges {
          node {
            id name tagline slug url website description createdAt
            thumbnail { url }
            topics(first: 3) { edges { node { name } } }
            makers { twitterUsername }
          }
        }
      }
    }
  `

  const res = await fetch(PH_GQL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { first: PAGE_SIZE, postedAfter, postedBefore, after: cursor },
    }),
  })

  if (!res.ok) throw new Error(`PH GraphQL ${res.status}: ${await res.text()}`)
  const json = await res.json()
  if (json.errors) throw new Error(`PH errors: ${JSON.stringify(json.errors)}`)

  const connection = json.data.posts
  return {
    posts: connection.edges.map((e: { node: PHPost }) => e.node),
    pageInfo: connection.pageInfo,
  }
}

// ─── Convert PHPost → RawItem ─────────────────────────────────────────────────

function toRawItem(post: PHPost): RawItem {
  // Strip PH redirect — real URL comes from Firecrawl enrichment later
  const website = post.website?.includes('producthunt.com/r/') ? null : post.website ?? null

  const description = [post.tagline, post.description].filter(Boolean).join(' — ').slice(0, 800)
  const topics = post.topics.edges.map(e => e.node.name).join(', ')
  const fullDescription = topics ? `${description} [${topics}]` : description

  return {
    name: post.name,
    description: fullDescription || post.tagline,
    website,
    sourceUrl: post.url,
    source: 'product_hunt',
    slug: post.slug,
    twitter: post.makers[0]?.twitterUsername ?? null,
    logoUrl: post.thumbnail?.url ?? null,
  }
}

// ─── Month iterator ───────────────────────────────────────────────────────────

function monthRange(from: string, to: string): string[] {
  const months: string[] = []
  const [fromY, fromM] = from.split('-').map(Number)
  const [toY, toM] = to.split('-').map(Number)

  let y = fromY, m = fromM
  while (y < toY || (y === toY && m <= toM)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return months
}

function monthBounds(month: string): { after: string; before: string } {
  const [y, m] = month.split('-').map(Number)
  const after = new Date(y, m - 1, 1).toISOString()
  const before = new Date(y, m, 1).toISOString()   // first of next month = exclusive upper bound
  return { after, before }
}

// ─── Progress persistence ─────────────────────────────────────────────────────

function loadProgress(): Progress {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
  } catch {
    return { completedMonths: [], totalInserted: 0, totalSkipped: 0, lastRun: '' }
  }
}

function saveProgress(p: Progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2))
}

// ─── Process one month ────────────────────────────────────────────────────────

async function processMonth(
  month: string,
  maxPages: number,
  delayMs: number,
  dryRun: boolean,
): Promise<{ inserted: number; skipped: number; fetched: number }> {
  const { after, before } = monthBounds(month)
  const allItems: RawItem[] = []

  let cursor: string | null = null
  let page = 0

  while (page < maxPages) {
    let posts: PHPost[]
    let pageInfo: PageInfo

    try {
      ({ posts, pageInfo } = await fetchPage(after, before, cursor))
    } catch (e) {
      console.error(`    Page ${page + 1} fetch failed: ${(e as Error).message}`)
      break
    }

    for (const post of posts) {
      allItems.push(toRawItem(post))
    }

    page++
    if (!pageInfo.hasNextPage || !pageInfo.endCursor) break
    cursor = pageInfo.endCursor
    await sleep(delayMs)
  }

  console.log(`   ${allItems.length} posts fetched (${page} pages)`)

  if (dryRun || allItems.length === 0) {
    return { inserted: 0, skipped: allItems.length, fetched: allItems.length }
  }

  // Capture console output to count inserts vs skips
  let inserted = 0
  let skipped = 0
  const origLog = console.log
  console.log = (...args: unknown[]) => {
    const msg = args.join(' ')
    if (msg.includes('INSERT')) inserted++
    else if (msg.includes('SKIP')) skipped++
    origLog(...args)
  }

  await runIngestion('product_hunt', allItems)

  console.log = origLog
  return { inserted, skipped, fetched: allItems.length }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const arg = (prefix: string) => process.argv.find(a => a.startsWith(prefix))?.split('=')[1]

  const dryRun = process.argv.includes('--dry-run')
  const maxPages = parseInt(arg('--pages-per-month=') ?? `${DEFAULT_MAX_PAGES}`, 10)
  const delayMs = parseInt(arg('--delay=') ?? '400', 10)

  // Month resolution
  const singleMonth = arg('--month=')
  const fromArg = singleMonth ?? (arg('--from=') ?? '2020-01')
  const now = new Date()
  const toArg = singleMonth ?? (arg('--to=') ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

  const months = monthRange(fromArg, toArg)
  const progress = loadProgress()

  console.log(`\n🔄 PH Backfill${dryRun ? ' (DRY RUN)' : ''}`)
  console.log(`   Range: ${fromArg} → ${toArg} (${months.length} months)`)
  console.log(`   Already completed: ${progress.completedMonths.length} months`)
  console.log(`   Max pages/month: ${maxPages} (~${maxPages * PAGE_SIZE} posts/month max)`)
  console.log(`   Delay between pages: ${delayMs}ms\n`)

  const pending = months.filter(m => !progress.completedMonths.includes(m))
  if (pending.length === 0) {
    console.log('✅ All months already completed. Run with a wider --from/--to range.')
    return
  }
  console.log(`   Pending: ${pending.length} months\n`)

  let sessionInserted = 0
  let sessionSkipped = 0

  for (const month of pending) {
    console.log(`📅 ${month}`)
    const { inserted, skipped, fetched } = await processMonth(month, maxPages, delayMs, dryRun)
    sessionInserted += inserted
    sessionSkipped += skipped
    console.log(`   ✓ inserted=${inserted} skipped=${skipped} fetched=${fetched}`)

    if (!dryRun) {
      progress.completedMonths.push(month)
      progress.totalInserted += inserted
      progress.totalSkipped += skipped
      progress.lastRun = new Date().toISOString()
      saveProgress(progress)
    }

    // 2s pause between months to be polite to PH API
    await sleep(2000)
  }

  console.log(`\n✅ Session complete`)
  console.log(`   This run:  inserted=${sessionInserted} skipped/dup=${sessionSkipped}`)
  console.log(`   All-time:  inserted=${progress.totalInserted} skipped=${progress.totalSkipped}`)
  if (progress.completedMonths.length > 0) {
    console.log(`   Progress saved to ${PROGRESS_FILE}`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
