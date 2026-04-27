/**
 * GitHub star/fork/issue snapshot cron.
 *
 * Fetches current star, fork, and open issue counts from the GitHub API for
 * all products with a github_repo field. Upserts daily snapshots into the
 * github_snapshots table (one row per product per day).
 *
 * Usage:
 *   pnpm tsx --env-file=.env.local scripts/snapshot-github-stars.ts
 *
 * Env required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Env optional:
 *   GITHUB_TOKEN  — Personal access token. Without it you're capped at 60
 *                   unauthenticated requests/hour. With it: 5,000/hour.
 */

import { supabaseAdmin } from '../lib/supabase-server'
import { sleep } from './shared/ingest-core'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductRow = {
  id: string
  slug: string
  github_repo: string
}

type GitHubSnapshot = {
  product_id: string
  snapshot_date: string
  stars: number
  forks: number
  open_issues: number
}

type GitHubRepoResponse = {
  stargazers_count: number
  forks_count: number
  open_issues_count: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse a raw github_repo value into an "owner/repo" string.
 * Handles URLs (https://github.com/owner/repo), URL-with-.git suffix,
 * and values already in "owner/repo" form.
 * Returns null if the value can't be parsed into a two-segment path.
 */
function parseGitHubRepo(raw: string): string | null {
  let value = raw.trim()

  // URL form — extract path after github.com/
  if (value.includes('github.com')) {
    try {
      const url = value.startsWith('http') ? value : `https://${value}`
      const { pathname } = new URL(url)
      value = pathname.replace(/^\//, '')
    } catch {
      // Malformed URL — try splitting on 'github.com/' manually
      const idx = value.indexOf('github.com/')
      if (idx === -1) return null
      value = value.slice(idx + 'github.com/'.length)
    }
  }

  // Strip trailing slash and .git suffix
  value = value.replace(/\/+$/, '').replace(/\.git$/, '')

  // Must be exactly owner/repo (two non-empty segments)
  const parts = value.split('/')
  if (parts.length < 2 || !parts[0] || !parts[1]) return null

  return `${parts[0]}/${parts[1]}`
}

/**
 * Build GitHub API request headers.
 */
function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  console.log(`\nGitHub Stars Snapshot — ${today}`)
  if (!process.env.GITHUB_TOKEN) {
    console.log('  GITHUB_TOKEN not set — using unauthenticated API (60 req/hr limit)')
  } else {
    console.log('  Using authenticated GitHub API (5,000 req/hr)')
  }
  console.log()

  // ── Paginate products with github_repo ────────────────────────────────────
  const FETCH_LIMIT = 500
  const allProducts: ProductRow[] = []
  let offset = 0

  while (true) {
    const { data: batch, error } = await supabaseAdmin
      .from('products')
      .select('id, slug, github_repo')
      .not('github_repo', 'is', null)
      .range(offset, offset + FETCH_LIMIT - 1)

    if (error) throw error
    if (!batch || batch.length === 0) break

    allProducts.push(...(batch as ProductRow[]))
    offset += FETCH_LIMIT
    if (batch.length < FETCH_LIMIT) break
  }

  console.log(`  Found ${allProducts.length} products with github_repo\n`)

  // ── Fetch from GitHub API and upsert snapshots ────────────────────────────
  const headers = buildHeaders()

  let processed = 0
  let inserted = 0
  let skipped = 0
  let errors = 0

  for (const product of allProducts) {
    const ownerRepo = parseGitHubRepo(product.github_repo)

    if (!ownerRepo) {
      console.log(`  SKIP ${product.slug} — could not parse repo: "${product.github_repo}"`)
      skipped++
      processed++
      continue
    }

    const url = `https://api.github.com/repos/${ownerRepo}`
    let repoData: GitHubRepoResponse | null = null
    let attemptCount = 0

    while (attemptCount < 2) {
      const res = await fetch(url, { headers })

      if (res.ok) {
        repoData = (await res.json()) as GitHubRepoResponse
        break
      }

      if (res.status === 404) {
        console.log(`  SKIP ${product.slug} — repo not found (${ownerRepo})`)
        skipped++
        break
      }

      if (res.status === 403 || res.status === 429) {
        if (attemptCount === 0) {
          console.log(`  RATE LIMIT hit for ${product.slug} — waiting 60s before retry`)
          await sleep(60000)
          attemptCount++
          continue
        } else {
          console.log(`  ERROR ${product.slug} — rate limit persists after retry, skipping`)
          errors++
          break
        }
      }

      // Other error statuses
      const body = await res.text().catch(() => '')
      console.log(`  ERROR ${product.slug} — HTTP ${res.status}: ${body.slice(0, 120)}`)
      errors++
      break
    }

    processed++

    if (repoData) {
      const snapshot: GitHubSnapshot = {
        product_id: product.id,
        snapshot_date: today,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        open_issues: repoData.open_issues_count,
      }

      const { error: upsertErr } = await supabaseAdmin
        .from('github_snapshots')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert(snapshot as any, { onConflict: 'product_id,snapshot_date' })

      if (upsertErr) {
        console.log(`  ERROR ${product.slug} — upsert failed: ${upsertErr.message}`)
        errors++
      } else {
        console.log(
          `  OK ${product.slug} (${ownerRepo}) — stars=${snapshot.stars} forks=${snapshot.forks} issues=${snapshot.open_issues}`,
        )
        inserted++
      }
    }

    // Rate-limit buffer between each API call
    await sleep(1200)
  }

  console.log(`\nDone.`)
  console.log(`  Processed : ${processed}`)
  console.log(`  Inserted  : ${inserted}`)
  console.log(`  Skipped   : ${skipped}`)
  console.log(`  Errors    : ${errors}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
