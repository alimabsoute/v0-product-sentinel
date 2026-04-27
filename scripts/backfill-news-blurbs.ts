/**
 * Backfill condensed_title + blurb onto existing press_mentions that predate
 * the new ingest pipeline. One-shot script — safe to re-run (skips rows that
 * already have condensed_title).
 *
 * Run: pnpm backfill:news-blurbs
 */

import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '../lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const BATCH = 20
const DELAY_MS = 120

async function generateBlurb(
  headline: string,
  snippet: string | null,
  publication: string | null,
): Promise<{ condensed_title: string | null; blurb: string | null }> {
  const prompt = `You are summarizing a tech news article for a product intelligence archive. Return ONLY valid JSON.

Publication: ${publication ?? 'Unknown'}
Headline: ${headline}
Snippet: ${(snippet ?? '').slice(0, 400)}

Return:
{
  "condensed_title": "<punchy rewrite under 80 chars, present tense, no clickbait>",
  "blurb": "<1-2 sentence standalone summary: what happened + why it matters>"
}`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { condensed_title: null, blurb: null }
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

type PressMentionRow = {
  id: string
  headline: string | null
  snippet: string | null
  publication: string | null
  metadata: Record<string, unknown> | null
}

async function main() {
  const { data: rawRows, error } = await supabaseAdmin
    .from('press_mentions')
    .select('id, headline, snippet, publication, metadata')
    .is('metadata->condensed_title' as never, null)
    .not('headline', 'is', null)
    .order('mention_date', { ascending: false })

  if (error) {
    console.error('Failed to fetch rows:', error.message)
    process.exit(1)
  }

  const rows = (rawRows ?? []) as unknown as PressMentionRow[]

  const todo = rows.filter(
    (r) => !(r.metadata as Record<string, unknown> | null)?.condensed_title
  )

  console.log(`\n🔁 Backfilling blurbs for ${todo.length} articles...\n`)

  let done = 0
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH)
    await Promise.all(
      batch.map(async (row) => {
        const { condensed_title, blurb } = await generateBlurb(
          row.headline as string,
          row.snippet as string | null,
          row.publication as string | null,
        )
        const existingMeta = (row.metadata as Record<string, unknown> | null) ?? {}
        await supabaseAdmin
          .from('press_mentions')
          // @ts-ignore — no generated DB types; update payload is correct at runtime
          .update({
            metadata: { ...existingMeta, condensed_title, blurb },
          })
          .eq('id', row.id as string)
        done++
      })
    )
    console.log(`   ✓ ${Math.min(done, todo.length)} / ${todo.length}`)
    if (i + BATCH < todo.length) await sleep(DELAY_MS)
  }

  console.log(`\n✅ Done — ${done} articles updated`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
