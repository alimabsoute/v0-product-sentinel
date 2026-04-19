import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

function slugToLabel(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const GROUP_LABEL_OVERRIDES: Record<string, string> = {
  business_model: 'Business Model',
  pricing_model: 'Pricing Model',
  data_format: 'Data Format',
}

function groupLabel(group: string): string {
  return GROUP_LABEL_OVERRIDES[group] ?? slugToLabel(group)
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('tags')
      .select('id, slug, tag_group, product_tags(count)')

    if (error) throw error

    type TagRow = {
      id: string
      slug: string
      tag_group: string
      product_tags: { count: number }[]
    }

    const rows = (data ?? []) as unknown as TagRow[]

    const groupMap = new Map<
      string,
      { slug: string; label: string; count: number }[]
    >()

    for (const row of rows) {
      const group = row.tag_group ?? 'other'
      const count =
        Array.isArray(row.product_tags) && row.product_tags.length > 0
          ? (row.product_tags[0] as { count: number }).count
          : 0

      if (!groupMap.has(group)) groupMap.set(group, [])
      groupMap.get(group)!.push({
        slug: row.slug,
        label: slugToLabel(row.slug),
        count,
      })
    }

    const groups = Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, tags]) => ({
        group,
        label: groupLabel(group),
        tags: tags
          .sort((a, b) => b.count - a.count)
          .slice(0, 8),
      }))

    return NextResponse.json({ groups })
  } catch (err) {
    console.error('/api/products/tags error:', err)
    return NextResponse.json({ groups: [] }, { status: 500 })
  }
}
