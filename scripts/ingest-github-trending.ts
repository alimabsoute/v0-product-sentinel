/**
 * GitHub Trending ingestion
 *
 * Uses GitHub Search API (no auth needed for public repos, 10 req/min unauthenticated).
 * Fetches repos created in the last 7 days, sorted by stars — a good proxy for trending.
 *
 * Run: pnpm tsx --env-file=.env.local scripts/ingest-github-trending.ts [--limit=20]
 *
 * Env (optional): GITHUB_TOKEN — raises rate limit to 5000 req/hr
 */

import { runIngestion, type RawItem } from './shared/ingest-core'

type GHRepo = {
  id: number
  full_name: string
  name: string
  description: string | null
  html_url: string
  homepage: string | null
  stargazers_count: number
  topics: string[]
  created_at: string
  language: string | null
  owner: { login: string; avatar_url: string }
}

// Filter out repos that are clearly not products (datasets, tutorials, lists, etc.)
const SKIP_PATTERNS = [
  /awesome[-_]/i, /\blist\b/i, /\btutorial\b/i, /\bcourse\b/i,
  /\bcheatsheet\b/i, /\bresource\b/i, /\bboilerplate\b/i, /\btemplate\b/i,
  /\bdataset\b/i, /\bpaper\b/i, /\bnotes\b/i,
]

function looksLikeProduct(repo: GHRepo): boolean {
  if (SKIP_PATTERNS.some(p => p.test(repo.name) || p.test(repo.description ?? ''))) return false
  if (!repo.description || repo.description.length < 10) return false
  if (repo.stargazers_count < 20) return false
  return true
}

async function fetchTrendingRepos(limit: number): Promise<RawItem[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const url = `https://api.github.com/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=${Math.min(limit * 3, 100)}`

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Prism-Ingest/1.0',
  }
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`

  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`)
  const json: { items: GHRepo[] } = await res.json()

  const items: RawItem[] = []
  for (const repo of json.items) {
    if (!looksLikeProduct(repo)) continue

    const slug = `gh-${repo.full_name.replace('/', '-').toLowerCase().replace(/[^a-z0-9-]/g, '-')}`
    const website = repo.homepage && repo.homepage.startsWith('http') ? repo.homepage : null

    items.push({
      name: repo.name,
      description: [
        repo.description ?? '',
        repo.language ? `Built with ${repo.language}.` : '',
        `${repo.stargazers_count.toLocaleString()} GitHub stars.`,
        repo.topics.length ? `Topics: ${repo.topics.join(', ')}.` : '',
      ].filter(Boolean).join(' '),
      website,
      sourceUrl: repo.html_url,
      source: 'github_trending',
      slug,
      github: repo.full_name,
      logoUrl: repo.owner.avatar_url,
    })

    if (items.length >= limit) break
  }

  return items
}

async function main() {
  const limitArg = process.argv.find(a => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 20

  console.log(`Fetching ${limit} trending GitHub repos (last 7 days)...`)
  const items = await fetchTrendingRepos(limit)
  console.log(`  ${items.length} repos retrieved after filtering`)

  await runIngestion('github_trending', items)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
