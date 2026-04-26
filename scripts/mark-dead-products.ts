/**
 * scripts/mark-dead-products.ts
 *
 * Scores all active products on 5 signals (recency, velocity, ph_silence, github_archived, url_health)
 * and marks discontinued/dead/inactive/sunset based on decision rules.
 *
 * Usage:
 *   npm run mark:dead              # Live run
 *   npm run mark:dead -- --dry-run # CSV to stdout, no writes
 *   npm run mark:dead -- --batch 100 200  # Only process products 100-200
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

// ─── Config ───────────────────────────────────────────────────────────────────

const BATCH_SIZE = 50
const MAX_PRODUCTS = Number(process.env.MAX_PRODUCTS ?? '2000')
const DRY_RUN = process.argv.includes('--dry-run')

// Parse --batch arg if provided: npm run mark:dead -- --batch 100 200
let batchStart = 0
let batchEnd = MAX_PRODUCTS
const batchIdx = process.argv.indexOf('--batch')
if (batchIdx !== -1 && process.argv[batchIdx + 2]) {
  batchStart = parseInt(process.argv[batchIdx + 1], 10)
  batchEnd = parseInt(process.argv[batchIdx + 2], 10)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// GitHub API rate-limit cache (simple in-memory, not persisted)
const githubArchiveCache = new Map<string, { archived: boolean; date?: string }>()
const urlHealthCache = new Map<string, { dead: boolean; date?: string }>()

// ─── Types ────────────────────────────────────────────────────────────────────

type DbProduct = {
  id: string
  slug: string
  name: string
  category: string
  website: string | null
  gh_url: string | null
  status: string
  created_at: string
}

type SignalScore = {
  product_id: string
  total_score: number
  score_date: string
}

type DeathSignals = {
  recency_days: number
  recency_score: number
  velocity_slope: number
  velocity_score: number
  ph_silence: boolean
  github_archived: boolean
  url_dead: boolean
  composite_score: number
  reason: string
}

type DeathResult = {
  product_id: string
  product_name: string
  status: 'discontinued' | 'dead' | 'inactive' | 'sunset' | 'active'
  discontinued_year?: number
  discontinued_month?: number
  signals: DeathSignals
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchProductBatch(offset: number): Promise<DbProduct[]> {
  const { data, error } = await db
    .from('products')
    .select('id, slug, name, category, website, gh_url, status, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + BATCH_SIZE - 1)

  if (error) throw error
  return (data ?? []) as DbProduct[]
}

async function fetchLatestScore(productId: string): Promise<SignalScore | null> {
  const { data, error } = await db
    .from('product_signal_scores')
    .select('product_id, total_score, score_date')
    .eq('product_id', productId)
    .order('score_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return (data as SignalScore | null) ?? null
}

async function fetchVelocity(productId: string): Promise<number> {
  // Get last 90 days of scores; compute linear slope
  const now = new Date()
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  const { data, error } = await db
    .from('product_signal_scores')
    .select('total_score, score_date')
    .eq('product_id', productId)
    .gte('score_date', ninetyDaysAgo.toISOString())
    .order('score_date', { ascending: true })

  if (error || !data || data.length < 2) return 0

  const scores = data as { total_score: number; score_date: string }[]
  const xs = scores.map((s, i) => i)
  const ys = scores.map((s) => s.total_score)

  // Linear regression slope: Σ((x - x_mean) * (y - y_mean)) / Σ((x - x_mean)²)
  const xMean = xs.reduce((a, b) => a + b, 0) / xs.length
  const yMean = ys.reduce((a, b) => a + b, 0) / ys.length
  const numerator = xs.reduce((acc, x, i) => acc + (x - xMean) * (ys[i] - yMean), 0)
  const denominator = xs.reduce((acc, x) => acc + (x - xMean) ** 2, 0)

  return denominator > 0 ? numerator / denominator : 0
}

async function checkPhSilence(productId: string): Promise<boolean> {
  // Check if product has 0 PH score in last 180 days
  const now = new Date()
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

  const { data, error } = await db
    .from('product_signal_scores')
    .select('ph_score')
    .eq('product_id', productId)
    .gte('score_date', sixMonthsAgo.toISOString())
    .order('score_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return true // Assume silent if no data
  return (data as { ph_score?: number }).ph_score === 0 || (data as { ph_score?: number }).ph_score === null
}

async function checkGithubArchived(ghUrl: string | null): Promise<boolean> {
  if (!ghUrl) return false

  // Check cache first
  if (githubArchiveCache.has(ghUrl)) {
    return githubArchiveCache.get(ghUrl)!.archived
  }

  try {
    // Extract owner/repo from GitHub URL
    const match = ghUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) return false

    const [, owner, repo] = match
    const repoName = repo.replace('.git', '')

    // GitHub API: check if repo is archived
    const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // Add token if available for higher rate limit
        ...(process.env.GITHUB_TOKEN ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } : {}),
      },
    })

    if (response.status === 404 || response.status === 403) {
      // Repo deleted or rate-limited; cache result and skip
      githubArchiveCache.set(ghUrl, { archived: false })
      return false
    }

    const repoData = (await response.json()) as { archived?: boolean; archived_at?: string }
    const archived = repoData.archived === true
    githubArchiveCache.set(ghUrl, { archived, date: repoData.archived_at })
    return archived
  } catch (e) {
    console.warn(`    GitHub check error for ${ghUrl}: ${(e as Error).message}`)
    return false
  }
}

async function checkUrlHealth(website: string | null): Promise<boolean> {
  if (!website) return false

  // Check cache first
  if (urlHealthCache.has(website)) {
    return urlHealthCache.get(website)!.dead
  }

  try {
    // HTTP HEAD request to check if URL responds
    const response = await fetch(website, {
      method: 'HEAD',
      redirect: 'follow',
      timeout: 5000,
    })

    // 4xx/5xx = dead; 403 = Cloudflare, skip; 2xx/3xx = alive
    const dead = response.status >= 400 && response.status !== 403
    urlHealthCache.set(website, { dead })
    return dead
  } catch (e) {
    // Network error, assume dead
    urlHealthCache.set(website, { dead: true })
    return true
  }
}

async function scoreProduct(product: DbProduct): Promise<DeathResult> {
  const signals: DeathSignals = {
    recency_days: 0,
    recency_score: 0,
    velocity_slope: 0,
    velocity_score: 0,
    ph_silence: false,
    github_archived: false,
    url_dead: false,
    composite_score: 0,
    reason: 'active',
  }

  // Signal 1: Recency
  const latestScore = await fetchLatestScore(product.id)
  if (latestScore) {
    const scoreDate = new Date(latestScore.score_date)
    const now = new Date()
    signals.recency_days = Math.floor((now.getTime() - scoreDate.getTime()) / (24 * 60 * 60 * 1000))
    signals.recency_score = Math.min(signals.recency_days / 540, 1.0) // Caps at 540d = 1.0 score
  }

  // Signal 2: Velocity (90-day slope)
  signals.velocity_slope = await fetchVelocity(product.id)
  signals.velocity_score = signals.velocity_slope < -0.1 ? 1.0 : Math.max(0, 0.5 + signals.velocity_slope / 2)

  // Signal 3: PH Silence (180d)
  signals.ph_silence = await checkPhSilence(product.id)

  // Signal 4: GitHub Archived
  signals.github_archived = await checkGithubArchived(product.gh_url)

  // Signal 5: URL Health
  signals.url_dead = await checkUrlHealth(product.website)

  // Composite score: weighted average of recency + velocity
  signals.composite_score = signals.recency_score * 0.6 + signals.velocity_score * 0.4

  // Decision rules
  let status: 'discontinued' | 'dead' | 'inactive' | 'sunset' | 'active' = 'active'
  let discontinued_year: number | undefined
  let discontinued_month: number | undefined

  if (signals.github_archived) {
    status = 'discontinued'
    signals.reason = 'github_archived'
    // Extract year from product created_at as fallback
    const date = new Date(product.created_at)
    discontinued_year = date.getFullYear()
    discontinued_month = date.getMonth() + 1
  } else if (signals.url_dead && signals.recency_days > 365) {
    status = 'dead'
    signals.reason = 'url_dead_365d'
    // Use current year/month as the death date
    const now = new Date()
    discontinued_year = now.getFullYear()
    discontinued_month = now.getMonth() + 1
  } else if (signals.recency_days > 730 && signals.ph_silence) {
    status = 'inactive'
    signals.reason = 'no_signal_2y'
  } else if (signals.composite_score > 0.7 && signals.velocity_slope < -0.05) {
    status = 'sunset'
    signals.reason = 'negative_velocity_trajectory'
  }

  return {
    product_id: product.id,
    product_name: product.name,
    status,
    discontinued_year,
    discontinued_month,
    signals,
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Prism Death Model Scorer ===`)
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (CSV to stdout)' : 'LIVE (write to DB)'}`)
  console.log(`Products: ${batchStart} to ${batchEnd}`)
  console.log(`Batch size: ${BATCH_SIZE}\n`)

  const results: DeathResult[] = []
  let offset = batchStart
  let totalProcessed = 0
  let totalMarked = 0

  while (offset < batchEnd) {
    const batch = await fetchProductBatch(offset)
    if (batch.length === 0) {
      console.log('No more products to process.')
      break
    }

    console.log(`Processing batch ${offset / BATCH_SIZE + 1} (${batch.length} products)...`)

    for (const product of batch) {
      if (totalProcessed >= batchEnd - batchStart) break
      totalProcessed++

      process.stdout.write(`  [${totalProcessed}] ${product.name}... `)

      const result = await scoreProduct(product)
      results.push(result)

      if (result.status !== 'active') {
        totalMarked++
        console.log(`${result.status}`)

        if (!DRY_RUN) {
          const { error } = await db.from('products').update({
            status: result.status,
            discontinued_year: result.discontinued_year,
            discontinued_month: result.discontinued_month,
            updated_at: new Date().toISOString(),
          }).eq('id', product.id)

          if (error) {
            console.warn(`    Update error: ${error.message}`)
          }
        }
      } else {
        console.log('active')
      }

      // Rate-limit: GitHub checks can be heavy
      await new Promise((r) => setTimeout(r, 300))
    }

    offset += BATCH_SIZE
    if (batch.length < BATCH_SIZE) break
  }

  // Output CSV (for inspection)
  if (DRY_RUN || totalMarked > 0) {
    const csv = [
      ['product_id', 'name', 'status', 'recency_days', 'velocity_slope', 'ph_silence', 'github_archived', 'url_dead', 'reason']
        .join(','),
      ...results
        .filter((r) => r.status !== 'active')
        .map((r) =>
          [
            r.product_id,
            `"${r.product_name.replace(/"/g, '""')}"`,
            r.status,
            r.signals.recency_days,
            r.signals.velocity_slope.toFixed(4),
            r.signals.ph_silence,
            r.signals.github_archived,
            r.signals.url_dead,
            r.signals.reason,
          ].join(','),
        ),
    ].join('\n')

    if (DRY_RUN) {
      console.log('\n=== Results (CSV) ===')
      console.log(csv)
    } else {
      // Save to file
      const fileName = `dead-products-${new Date().toISOString().split('T')[0]}.csv`
      fs.writeFileSync(fileName, csv)
      console.log(`\nResults saved to ${fileName}`)
    }
  }

  console.log(`\n=== Done ===`)
  console.log(`Products scored: ${totalProcessed}`)
  console.log(`Products marked for death: ${totalMarked}`)
  console.log(`Write mode: ${DRY_RUN ? 'DRY RUN' : 'COMMITTED'}`)
}

main().catch((e) => {
  console.error('Fatal error:', e)
  process.exit(1)
})
