/**
 * Day 4.5 — Firecrawl enrichment
 *
 * For each product where website_url IS NULL:
 *   1. Follow the PH redirect URL (ph.do/...) via Firecrawl scrape → extract real website
 *   2. Scrape the real website → extract twitter_handle, github_repo, description
 *   3. UPDATE products row in Supabase
 *
 * Also backfills twitter_handle + github_repo where missing for products that do have website_url.
 *
 * Run:
 *   pnpm tsx --env-file=.env.local scripts/enrich-firecrawl.ts
 *
 * Env required:
 *   FIRECRAWL_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { FirecrawlClient } from '@mendable/firecrawl-js'
import { supabaseAdmin } from '../lib/supabase-server'

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

const DELAY_MS = 1500 // be polite to Firecrawl API

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Extract twitter handle from text/markdown.
 * Looks for twitter.com/x.com profile URLs or @handle patterns.
 */
function extractTwitterHandle(text: string): string | null {
  const patterns = [
    /(?:twitter\.com|x\.com)\/([A-Za-z0-9_]{1,15})(?:\/|"|'|\s|$)/gi,
    /"twitter":\s*"@?([A-Za-z0-9_]{1,15})"/i,
    /@([A-Za-z0-9_]{4,15})/g, // broader — only use if nothing else found
  ]

  // Try specific patterns first
  for (const [i, pat] of patterns.slice(0, 2).entries()) {
    const m = pat.exec(text)
    if (m) {
      const handle = m[1].toLowerCase()
      // filter obvious false positives
      if (!['share', 'intent', 'home', 'explore', 'search', 'login', 'signup'].includes(handle)) {
        return handle
      }
    }
  }

  // Fall back to @handle scan
  const matches = [...text.matchAll(/@([A-Za-z0-9_]{4,15})/g)]
    .map((m) => m[1])
    .filter((h) => !['twitter', 'gmail', 'example', 'email', 'domain'].includes(h.toLowerCase()))

  return matches[0]?.toLowerCase() ?? null
}

/**
 * Extract GitHub repo (org/repo) from text.
 */
function extractGithubRepo(text: string): string | null {
  const m = /github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)(?:\/|"|'|\s|$)/.exec(text)
  if (!m) return null
  const repo = m[1].replace(/\.git$/, '')
  // Filter out common non-repo paths
  if (['features', 'about', 'pricing', 'enterprise', 'login', 'signup', 'marketplace'].includes(repo.split('/')[1])) {
    return null
  }
  return repo
}

/**
 * Given a PH redirect URL (ph.do/…) or any URL, use Firecrawl to scrape
 * and extract metadata. Returns the canonical URL after redirect.
 */
async function scrapeUrl(
  fc: FirecrawlClient,
  url: string,
): Promise<{
  finalUrl: string | null
  markdown: string | null
  metadata: Record<string, unknown>
}> {
  try {
    const result = await fc.scrape(url, {
      formats: ['markdown'],
      onlyMainContent: false,
      timeout: 20000,
    })

    return {
      finalUrl: (result as { url?: string }).url ?? null,
      markdown: (result as { markdown?: string }).markdown ?? null,
      metadata: (result as { metadata?: Record<string, unknown> }).metadata ?? {},
    }
  } catch (err) {
    console.warn(`  Firecrawl error for ${url}:`, (err as Error).message?.slice(0, 120))
    return { finalUrl: null, markdown: null, metadata: {} }
  }
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  const fcKey = process.env.FIRECRAWL_API_KEY
  if (!fcKey) throw new Error('FIRECRAWL_API_KEY not set')

  const fc = new FirecrawlClient({ apiKey: fcKey })

  type ProductRow = {
    id: string
    name: string
    slug: string
    website_url: string | null
    twitter_handle: string | null
    github_repo: string | null
    description: string | null
    source_url: string | null
  }
  // Fetch all products that need enrichment
  const { data: rawProducts, error } = await supabaseAdmin
    .from('products')
    .select('id, name, slug, website_url, twitter_handle, github_repo, description, source_url')
    .or('website_url.is.null,twitter_handle.is.null,github_repo.is.null')
    .order('created_at', { ascending: true })
  const products = (rawProducts ?? []) as unknown as ProductRow[]

  if (error) throw error
  if (!products.length) {
    console.log('No products need enrichment.')
    return
  }

  console.log(`\nEnriching ${products.length} products...\n`)

  let enriched = 0
  let skipped = 0

  for (const product of products) {
    console.log(`[${product.name}] (${product.slug})`)

    const updates: Record<string, string | null> = {}

    // ── Step 1: Resolve website_url via PH redirect ──────────
    if (!product.website_url && product.source_url) {
      console.log(`  Resolving PH redirect: ${product.source_url}`)
      const { finalUrl, markdown, metadata } = await scrapeUrl(fc, product.source_url)

      // PH redirect pages contain the real site URL in meta or as a button href
      // The final resolved URL after redirect IS the website
      const metaUrl = (metadata?.ogUrl as string) ?? (metadata?.sourceURL as string) ?? finalUrl

      // Try to extract the actual product site from the PH page markdown
      let resolvedSite: string | null = null
      if (markdown) {
        // PH pages have "Visit Website" links
        const visitMatch = /\[Visit\s+(?:Website|Site)\]\(([^)]+)\)/i.exec(markdown)
        if (visitMatch) resolvedSite = visitMatch[1]

        // Also look for `website: https://...` pattern
        if (!resolvedSite) {
          const wsMatch = /website[:\s]+([https://][^\s"']+)/i.exec(markdown)
          if (wsMatch) resolvedSite = wsMatch[1]
        }
      }

      const siteUrl = resolvedSite ?? metaUrl
      if (siteUrl && !siteUrl.includes('producthunt.com') && !siteUrl.includes('ph.do')) {
        updates.website_url = siteUrl
        console.log(`  ✓ website_url → ${siteUrl}`)
      } else {
        console.log(`  ✗ Could not resolve website_url`)
      }

      // Extract twitter/github from PH page too
      if (markdown) {
        if (!product.twitter_handle) {
          const tw = extractTwitterHandle(markdown)
          if (tw) { updates.twitter_handle = tw; console.log(`  ✓ twitter_handle → @${tw}`) }
        }
        if (!product.github_repo) {
          const gh = extractGithubRepo(markdown)
          if (gh) { updates.github_repo = gh; console.log(`  ✓ github_repo → ${gh}`) }
        }
      }

      await sleep(DELAY_MS)
    }

    // ── Step 2: Scrape real website for more signals ──────────
    const targetUrl = updates.website_url ?? product.website_url
    if (targetUrl && (!product.twitter_handle || !product.github_repo)) {
      console.log(`  Scraping product site: ${targetUrl}`)
      const { markdown, metadata } = await scrapeUrl(fc, targetUrl)

      if (markdown) {
        if (!product.twitter_handle && !updates.twitter_handle) {
          const tw = extractTwitterHandle(markdown)
          if (tw) { updates.twitter_handle = tw; console.log(`  ✓ twitter_handle → @${tw} (from site)`) }
        }
        if (!product.github_repo && !updates.github_repo) {
          const gh = extractGithubRepo(markdown)
          if (gh) { updates.github_repo = gh; console.log(`  ✓ github_repo → ${gh} (from site)`) }
        }

        // Backfill description if empty (use OG description from metadata)
        if (!product.description) {
          const desc = (metadata?.description as string) ?? (metadata?.ogDescription as string)
          if (desc && desc.length > 20) {
            updates.description = desc.slice(0, 1000)
            console.log(`  ✓ description → ${desc.slice(0, 80)}...`)
          }
        }
      }

      await sleep(DELAY_MS)
    }

    // ── Step 3: Write updates to DB ───────────────────────────
    if (Object.keys(updates).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const builder = supabaseAdmin.from('products') as any
      const { error: updateError } = await builder
        .update(updates)
        .eq('id', product.id)

      if (updateError) {
        console.error(`  ✗ DB update failed:`, updateError.message)
      } else {
        enriched++
        console.log(`  ✓ Saved ${Object.keys(updates).length} field(s)`)
      }
    } else {
      skipped++
      console.log(`  - Nothing to update`)
    }

    console.log()
  }

  console.log(`\n✅ Done. Enriched: ${enriched} | Skipped: ${skipped}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
