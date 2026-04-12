/**
 * Reddit ingestion — r/SideProject + r/startups + r/webdev
 *
 * Uses Reddit's public JSON API (no auth needed for public subreddits).
 * Rate limit: 1 req/2s unauthenticated.
 *
 * Run: pnpm tsx --env-file=.env.local scripts/ingest-reddit.ts [--limit=30]
 */

import { runIngestion, sleep, type RawItem } from './shared/ingest-core'

const SUBREDDITS = ['SideProject', 'startups', 'webdev']

// Keywords that suggest a product launch post
const LAUNCH_KEYWORDS = [
  'launched', 'launch', 'built', 'made', 'created', 'released', 'shipping',
  'show reddit', 'i made', 'we made', 'my project', 'our product',
  'feedback', 'side project', 'saas', 'open source', 'tool', 'app',
]

type RedditPost = {
  data: {
    id: string
    title: string
    selftext: string
    url: string
    permalink: string
    author: string
    score: number
    created_utc: number
    is_self: boolean
    domain: string
  }
}

function looksLikeLaunchPost(title: string, text: string): boolean {
  const combined = (title + ' ' + text).toLowerCase()
  const matches = LAUNCH_KEYWORDS.filter(kw => combined.includes(kw))
  return matches.length >= 2
}

function extractProductName(title: string): string {
  // Try to extract product name from common patterns:
  // "I built [ProductName] - description"
  // "[ProductName] - I built a thing"
  // "Launched [ProductName]: description"
  const patterns = [
    /^I (?:built|made|created|launched|released)\s+([^–—:,]+)/i,
    /^(?:We|Our team) (?:built|made|launched|released)\s+([^–—:,]+)/i,
    /^Launched\s*[-:]?\s*([^–—:,]+)/i,
    /^([^–—:]+)\s*[–—:]\s*(?:I|We) (?:built|made|created)/i,
  ]
  for (const p of patterns) {
    const m = p.exec(title)
    if (m) return m[1].trim().replace(/^(a |an |the )/i, '')
  }
  return title.split(/[–—:]/)[0].trim()
}

async function fetchSubredditPosts(subreddit: string, limit: number): Promise<RawItem[]> {
  const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}&t=week`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Prism-Ingest/1.0 (product intelligence platform)' },
  })
  if (!res.ok) {
    console.warn(`Reddit r/${subreddit} ${res.status} — skipping`)
    return []
  }
  const json: { data: { children: RedditPost[] } } = await res.json()
  const items: RawItem[] = []

  for (const post of json.data.children) {
    const { id, title, selftext, url, permalink, score } = post.data

    // Skip low-score posts, non-launch posts, deleted posts
    if (score < 3) continue
    if (selftext === '[deleted]' || selftext === '[removed]') continue
    if (!looksLikeLaunchPost(title, selftext)) continue

    const name = extractProductName(title)
    if (!name || name.length < 3) continue

    const website = post.data.is_self ? null : (url.startsWith('http') ? url : null)
    const slug = `reddit-${id}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`
    const description = selftext
      ? selftext.replace(/\n+/g, ' ').slice(0, 500)
      : title

    items.push({
      name,
      description,
      website,
      sourceUrl: `https://reddit.com${permalink}`,
      source: 'reddit',
      slug,
    })
  }

  return items
}

async function main() {
  const limitArg = process.argv.find(a => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 30
  const perSubreddit = Math.ceil(limit / SUBREDDITS.length)

  const allItems: RawItem[] = []
  for (const sub of SUBREDDITS) {
    console.log(`Fetching r/${sub}...`)
    const items = await fetchSubredditPosts(sub, perSubreddit * 3) // fetch more, filter down
    const picked = items.slice(0, perSubreddit)
    console.log(`  ${picked.length} launch posts found`)
    allItems.push(...picked)
    await sleep(2000) // Reddit rate limit: 1 req/2s
  }

  console.log(`\nTotal: ${allItems.length} posts across ${SUBREDDITS.length} subreddits`)
  await runIngestion('reddit', allItems)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
