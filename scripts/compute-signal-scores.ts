/**
 * Signal score computation for all active products.
 *
 * Bootstrapped approach: derives real scores from available product metadata
 * (recency, data richness, category heat, confidence) immediately, then
 * improves automatically as social_mentions / press_mentions / funding_rounds
 * accumulate via the hourly/daily crons.
 *
 * Usage:
 *   pnpm signals          — compute all products
 *   pnpm signals:new      — skip products already scored today
 *
 * Env required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * No Anthropic API calls — pure Supabase, no credit cost.
 */

import { supabaseAdmin } from '../lib/supabase-server'

// ─── Category heat weights (0–15) ────────────────────────────────────────────

const CATEGORY_HEAT: Record<string, number> = {
  'ai-tools':      15,
  'dev-tools':     12,
  'productivity':  9,
  'design':        7,
  'marketing':     6,
  'analytics':     5,
  'security':      5,
  'education':     4,
  'finance':       4,
  'communication': 4,
  'health':        3,
  'e-commerce':    3,
  'gaming':        3,
  'hardware':      2,
  'entertainment': 2,
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductRow = {
  id: string
  slug: string
  sub_category: string | null
  launched_year: number | null
  launched_month: number | null
  status: string
  website_url: string | null
  twitter_handle: string | null
  github_repo: string | null
  description: string | null
  confidence_score: number | null
}

type SignalScoreUpsert = {
  product_id: string
  score_date: string
  signal_score: number
  mention_score: number
  sentiment_score: number
  velocity_score: number
  press_score: number
  funding_score: number
  github_velocity_score: number
  wow_velocity: number
  mom_velocity: number
  is_breakout: boolean
}

// ─── Pure sub-score functions ─────────────────────────────────────────────────

function computeRecencyScore(launchedYear: number | null, launchedMonth: number | null, asOf?: Date): number {
  if (!launchedYear) return 5
  const ref = asOf ?? new Date()
  const ageInMonths =
    (ref.getFullYear() - launchedYear) * 12 +
    (ref.getMonth() + 1 - (launchedMonth ?? 6))
  return 25 * Math.max(0, (60 - ageInMonths) / 60)
}

function computeRichnessScore(row: ProductRow): number {
  let score = 0
  if (row.website_url)                          score += 5
  if (row.twitter_handle)                        score += 5
  if (row.github_repo)                           score += 5
  if ((row.description ?? '').length > 100)      score += 5
  return score  // 0–20
}

function computeCategoryHeat(subCategory: string | null): number {
  return CATEGORY_HEAT[subCategory ?? ''] ?? 2
}

function computeConfidenceScore(confidence: number | null): number {
  return Math.min(10, Math.max(0, (confidence ?? 3) * 2))
}

function computeGitHubStarVelocityScore(delta: number): number {
  if (delta <= 0) return 0
  return Math.min(15, Math.log10(delta + 1) * 6)
}

// ─── Batch data helpers ───────────────────────────────────────────────────────

/**
 * Build a mention count + avg sentiment map from social_mentions,
 * grouped by product_id, for the last 30 days.
 */
async function fetchSocialData(
  thirtyDaysAgo: string,
): Promise<Map<string, { mentions: number; sentimentAvg: number }>> {
  const { data } = await supabaseAdmin
    .from('social_mentions')
    .select('product_id, mention_count, sentiment_avg')
    .gte('snapshot_date', thirtyDaysAgo)

  const map = new Map<string, { mentions: number; sentimentAvg: number }>()
  for (const row of data ?? []) {
    const existing = map.get(row.product_id) ?? { mentions: 0, sentimentAvg: 0 }
    map.set(row.product_id, {
      mentions: existing.mentions + (row.mention_count ?? 0),
      // Running average (simplified — good enough for daily batch)
      sentimentAvg: (existing.sentimentAvg + (row.sentiment_avg ?? 0)) / 2,
    })
  }
  return map
}

/**
 * Build a press mention count map grouped by product_id, for the last 30 days.
 */
async function fetchPressData(thirtyDaysAgo: string): Promise<Map<string, number>> {
  const { data } = await supabaseAdmin
    .from('press_mentions')
    .select('product_id')
    .gte('mention_date', thirtyDaysAgo)

  const map = new Map<string, number>()
  for (const row of data ?? []) {
    map.set(row.product_id, (map.get(row.product_id) ?? 0) + 1)
  }
  return map
}

/**
 * Build a set of product_ids that have any funding round.
 */
async function fetchFundingIds(): Promise<Set<string>> {
  const { data } = await supabaseAdmin
    .from('funding_rounds')
    .select('product_id')

  return new Set((data ?? []).map(r => r.product_id))
}

/**
 * Fetch signal_score values for a specific date, keyed by product_id.
 */
async function fetchScoresByDate(date: string): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  const PAGE = 1000
  let offset = 0

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('product_signal_scores')
      .select('product_id, signal_score')
      .eq('score_date', date)
      .range(offset, offset + PAGE - 1)

    if (error || !data || data.length === 0) break

    for (const row of data) {
      if (row.signal_score !== null) map.set(row.product_id, row.signal_score)
    }

    if (data.length < PAGE) break
    offset += PAGE
  }

  return map
}

/**
 * Batch-fetch the two most recent github_snapshots per product (last 48 h)
 * and return a map of product_id → star delta (new - old, clamped to ≥0).
 */
async function fetchGitHubVelocityMap(productIds: string[]): Promise<Map<string, number>> {
  const velocityMap = new Map<string, number>()
  if (productIds.length === 0) return velocityMap

  const { data, error } = await supabaseAdmin
    .from('github_snapshots')
    .select('product_id, stars, snapshot_date')
    .in('product_id', productIds)
    .gte('snapshot_date', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('snapshot_date', { ascending: false })

  if (error || !data) return velocityMap

  // Group by product_id, keep only the 2 most recent snapshots
  const grouped = new Map<string, { stars: number; date: string }[]>()
  for (const row of data) {
    const arr = grouped.get(row.product_id) ?? []
    if (arr.length < 2) arr.push({ stars: row.stars, date: row.snapshot_date })
    grouped.set(row.product_id, arr)
  }

  for (const [productId, snapshots] of grouped) {
    if (snapshots.length < 2) { velocityMap.set(productId, 0); continue }
    const delta = snapshots[0].stars - snapshots[1].stars
    velocityMap.set(productId, Math.max(0, delta))
  }

  return velocityMap
}

/**
 * Fetch last 90 days of wow_velocity per product for breakout detection.
 * Returns a map of product_id → sorted array of wow_velocity values (oldest first).
 */
async function fetchWowHistory(ninetyDaysAgo: string, today: string): Promise<Map<string, number[]>> {
  const map = new Map<string, number[]>()
  const PAGE = 1000
  let offset = 0

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('product_signal_scores')
      .select('product_id, wow_velocity, score_date')
      .gte('score_date', ninetyDaysAgo)
      .lt('score_date', today)
      .not('wow_velocity', 'is', null)
      .order('score_date', { ascending: true })
      .range(offset, offset + PAGE - 1)

    if (error || !data || data.length === 0) break

    for (const row of data) {
      const arr = map.get(row.product_id) ?? []
      arr.push(row.wow_velocity)
      map.set(row.product_id, arr)
    }

    if (data.length < PAGE) break
    offset += PAGE
  }

  return map
}

// ─── Score assembly ───────────────────────────────────────────────────────────

function assembleSignalScore(sub: {
  recency: number
  richness: number
  categoryHeat: number
  confidence: number
  social: number
  press: number
  funding: number
  githubVelocity: number
}): number {
  // Max raw = 25 + 20 + 15 + 10 + 25 + 15 + 15 + 15 = 140
  const raw =
    sub.recency + sub.richness + sub.categoryHeat +
    sub.confidence + sub.social + sub.press + sub.funding + sub.githubVelocity
  return Math.min(100, Math.max(0, (raw / 140) * 100))
}

function computeVelocity(current: number, prior: number | undefined): number {
  if (prior === undefined || prior === 0) return 0
  return ((current - prior) / prior) * 100
}

function computeIsBreakout(wowVelocity: number, history: number[]): boolean {
  if (history.length < 7) return false  // not enough history
  if (wowVelocity < 5) return false     // require at least 5% wow to filter noise
  const mean = history.reduce((a, b) => a + b, 0) / history.length
  const variance = history.reduce((a, b) => a + (b - mean) ** 2, 0) / history.length
  const stddev = Math.sqrt(variance)
  return wowVelocity > mean + 2 * stddev
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const onlyNew = process.argv.includes('--only-new')

  const now = new Date()
  const dateArg = process.argv.find(a => a.startsWith('--date='))
  const today = dateArg ? dateArg.split('=')[1] : now.toISOString().split('T')[0]

  const baseDate = new Date(today + 'T12:00:00Z')
  const sevenDaysAgo  = new Date(baseDate); sevenDaysAgo.setDate(baseDate.getDate() - 7)
  const thirtyDaysAgo = new Date(baseDate); thirtyDaysAgo.setDate(baseDate.getDate() - 30)
  const ninetyDaysAgo = new Date(baseDate); ninetyDaysAgo.setDate(baseDate.getDate() - 90)

  const d7  = sevenDaysAgo.toISOString().split('T')[0]
  const d30 = thirtyDaysAgo.toISOString().split('T')[0]
  const d90 = ninetyDaysAgo.toISOString().split('T')[0]

  console.log(`\n📊 Signal Score Computation — ${today}${dateArg ? ' (retroactive)' : ''}`)
  console.log(`   Mode: ${onlyNew ? 'only-new (skip already scored)' : 'all active products'}\n`)

  // ── Batch fetch all reference data upfront ──────────────────────────────────
  console.log('  Loading reference data...')
  const [socialMap, pressMap, fundingIds, scores7, scores30, wowHistory] = await Promise.all([
    fetchSocialData(d30),
    fetchPressData(d30),
    fetchFundingIds(),
    fetchScoresByDate(d7),
    fetchScoresByDate(d30),
    fetchWowHistory(d90, today),
  ])
  console.log(`  Social records: ${socialMap.size} products with recent mentions`)
  console.log(`  Press records:  ${pressMap.size} products with recent mentions`)
  console.log(`  Funding records: ${fundingIds.size} products with funding data\n`)

  // ── Fetch products (paginated — Supabase caps at 1,000 rows per query) ───────
  let existingIds: string[] = []
  if (onlyNew) {
    const { data: existing } = await supabaseAdmin
      .from('product_signal_scores')
      .select('product_id')
      .eq('score_date', today)
    existingIds = (existing ?? []).map(r => r.product_id)
    console.log(`  Skipping ${existingIds.length} already-scored products`)
  }

  const FETCH_LIMIT = 500
  type ProductRow = { id: string; slug: string; sub_category: string; launched_year: number | null; launched_month: number | null; status: string; website_url: string | null; twitter_handle: string | null; github_repo: string | null; description: string | null; confidence_score: number | null }
  const allProducts: ProductRow[] = []
  let offset = 0

  while (true) {
    let q = supabaseAdmin
      .from('products')
      .select('id, slug, sub_category, launched_year, launched_month, status, website_url, twitter_handle, github_repo, description, confidence_score')
      .eq('status', 'active')
      .range(offset, offset + FETCH_LIMIT - 1)

    if (onlyNew && existingIds.length > 0) {
      q = q.not('id', 'in', `(${existingIds.join(',')})`)
    }

    const { data: batch, error } = await q
    if (error) throw error
    if (!batch || batch.length === 0) break
    allProducts.push(...batch)
    offset += FETCH_LIMIT
    if (batch.length < FETCH_LIMIT) break
  }

  const products = allProducts
  console.log(`  Computing scores for ${products.length} products...\n`)

  // ── Batch-fetch GitHub star velocity for this product set ───────────────────
  const productIds = products.map(p => p.id)
  const velocityMap = await fetchGitHubVelocityMap(productIds)
  console.log(`  GitHub velocity records: ${velocityMap.size} products with recent snapshots\n`)

  // ── Score each product ──────────────────────────────────────────────────────
  const rows: SignalScoreUpsert[] = []
  let logged = 0

  for (const product of products ?? []) {
    const socialEntry = socialMap.get(product.id)
    const pressMentions = pressMap.get(product.id) ?? 0
    const hasFunding = fundingIds.has(product.id)

    // Sub-scores
    const recency    = computeRecencyScore(product.launched_year, product.launched_month, baseDate)
    const richness   = computeRichnessScore(product as ProductRow)
    const catHeat    = computeCategoryHeat(product.sub_category)
    const confidence = computeConfidenceScore(product.confidence_score)

    // Social score (0–25)
    const totalMentions = socialEntry?.mentions ?? 0
    const avgSentiment  = socialEntry?.sentimentAvg ?? 0
    const mentionSub    = Math.min(20, (totalMentions / 100) * 20)
    const sentimentSub  = ((avgSentiment + 1) / 2) * 5   // -1..1 → 0..5
    const social        = mentionSub + sentimentSub

    // Press score (0–15)
    const press = Math.min(15, (pressMentions / 10) * 15)

    // Funding score (0–15) — TODO: weight by round size once schema confirmed
    const funding = hasFunding ? 10 : 0

    // GitHub star velocity score (0–15)
    const starDelta = velocityMap.get(product.id) ?? 0
    const githubVelocityScore = computeGitHubStarVelocityScore(starDelta)

    // Composite
    const signalScore = assembleSignalScore({ recency, richness, categoryHeat: catHeat, confidence, social, press, funding, githubVelocity: githubVelocityScore })

    // Velocity
    const wowVelocity = computeVelocity(signalScore, scores7.get(product.id))
    const momVelocity = computeVelocity(signalScore, scores30.get(product.id))

    // Breakout
    const history   = wowHistory.get(product.id) ?? []
    const isBreakout = computeIsBreakout(wowVelocity, history)

    // Velocity score proxy: recency + category heat, normalized to 0–100
    const velocityScore = Math.min(100, ((recency + catHeat) / 40) * 100)

    rows.push({
      product_id:           product.id,
      score_date:           today,
      signal_score:         +signalScore.toFixed(2),
      mention_score:        +social.toFixed(2),
      sentiment_score:      +sentimentSub.toFixed(2),
      velocity_score:       +velocityScore.toFixed(2),
      press_score:          +press.toFixed(2),
      funding_score:        +funding.toFixed(2),
      github_velocity_score: +githubVelocityScore.toFixed(2),
      wow_velocity:         +wowVelocity.toFixed(4),
      mom_velocity:         +momVelocity.toFixed(4),
      is_breakout:          isBreakout,
    })

    // Log first 10 and every 100th after that
    if (logged < 10 || rows.length % 100 === 0) {
      const flag = isBreakout ? ' 🚀' : ''
      console.log(`  ${product.slug}: score=${signalScore.toFixed(1)} wow=${wowVelocity.toFixed(1)}%${flag}`)
      logged++
    }
  }

  // ── Batch upsert in chunks of 500 ──────────────────────────────────────────
  const CHUNK = 500
  let success = 0, failed = 0

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const { error: upsertErr } = await supabaseAdmin
      .from('product_signal_scores')
      .upsert(chunk, { onConflict: 'product_id,score_date' })

    if (upsertErr) {
      console.error(`  Chunk ${i}–${i + chunk.length} failed:`, upsertErr.message)
      failed += chunk.length
    } else {
      success += chunk.length
    }
  }

  console.log(`\n✅ Done: scored=${success} failed=${failed} total=${rows.length}`)
  if (rows.length > 0) {
    const scores = rows.map(r => r.signal_score)
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    const max = Math.max(...scores)
    const min = Math.min(...scores)
    console.log(`   Score range: min=${min.toFixed(1)} avg=${avg.toFixed(1)} max=${max.toFixed(1)}`)
    console.log(`   Breakouts: ${rows.filter(r => r.is_breakout).length}`)
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
