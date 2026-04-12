/**
 * Hacker News ingestion — Show HN posts
 *
 * Uses the HN Algolia API (free, no key required).
 * Filters for "Show HN" posts which are product launches.
 *
 * Run: pnpm tsx --env-file=.env.local scripts/ingest-hn.ts [--limit=50]
 */

import { runIngestion, type RawItem } from './shared/ingest-core'

const HN_API = 'https://hn.algolia.com/api/v1'

type HNHit = {
  objectID: string
  title: string
  url: string | null
  story_text: string | null
  author: string
  created_at: string
  points: number
  num_comments: number
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

function parseShowHN(title: string): string | null {
  // "Show HN: Product Name – description" or "Show HN: Product Name (description)"
  const m = /^Show HN:\s*(.+?)(?:\s*[–—-]\s*.+)?$/.exec(title)
  return m ? m[1].trim() : null
}

async function fetchShowHNPosts(limit: number): Promise<RawItem[]> {
  // Get recent Show HN posts sorted by points
  const url = `${HN_API}/search?tags=show_hn&hitsPerPage=${Math.min(limit * 2, 100)}&numericFilters=points>5`
  const res = await fetch(url, { headers: { 'User-Agent': 'Prism-Ingest/1.0' } })
  if (!res.ok) throw new Error(`HN API ${res.status}: ${await res.text()}`)
  const json: { hits: HNHit[] } = await res.json()

  const items: RawItem[] = []
  for (const hit of json.hits) {
    const name = parseShowHN(hit.title)
    if (!name) continue

    // Skip posts without a real URL (text-only posts are rarely products)
    if (!hit.url && !hit.story_text) continue

    const slug = `hn-${hit.objectID}-${slugify(name)}`.slice(0, 80)
    const description = hit.story_text
      ? hit.story_text.replace(/<[^>]+>/g, ' ').slice(0, 500)
      : hit.title

    items.push({
      name,
      description,
      website: hit.url ?? null,
      sourceUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      source: 'hacker_news',
      slug,
    })

    if (items.length >= limit) break
  }

  return items
}

async function main() {
  const limitArg = process.argv.find(a => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 30

  console.log(`Fetching ${limit} Show HN posts...`)
  const items = await fetchShowHNPosts(limit)
  console.log(`  ${items.length} posts retrieved`)

  await runIngestion('hacker_news', items)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
