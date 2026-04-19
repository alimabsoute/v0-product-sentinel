import { supabaseAdmin } from '@/lib/supabase-server'

export type TagWithCount = {
  slug: string
  tag_group: string
  label: string
  count: number
}

export type TagGroupData = {
  group: string
  label: string
  tags: TagWithCount[]
  total_products: number
}

export type ProductForTag = {
  id: string
  slug: string
  name: string
  logo_url: string | null
  category: string
}

function slugToLabel(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const GROUP_LABELS: Record<string, string> = {
  audience: 'Audience',
  capability: 'Capabilities',
  business_model: 'Business Models',
  pricing_model: 'Pricing',
  deployment: 'Deployment',
  data_format: 'Data Formats',
  compliance: 'Compliance',
  integration: 'Integrations',
}

function groupLabel(group: string): string {
  return GROUP_LABELS[group] ?? group.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export async function getTagGroups(): Promise<TagGroupData[]> {
  try {
    type JoinRow = { tag_id: string; tags: { slug: string; tag_group: string } }

    const { data: joinData, error: joinError } = await supabaseAdmin
      .from('product_tags')
      .select('tag_id, tags!inner(slug, tag_group)') as unknown as {
        data: JoinRow[] | null
        error: unknown
      }

    if (joinError || !joinData) return []

    const tagCounts = new Map<string, { slug: string; tag_group: string; count: number }>()

    for (const row of joinData) {
      const { slug, tag_group } = row.tags
      const existing = tagCounts.get(slug)
      if (existing) {
        existing.count += 1
      } else {
        tagCounts.set(slug, { slug, tag_group, count: 1 })
      }
    }

    const groupMap = new Map<string, { tags: TagWithCount[]; total: number }>()

    for (const [, tag] of tagCounts) {
      const entry = groupMap.get(tag.tag_group) ?? { tags: [], total: 0 }
      entry.tags.push({
        slug: tag.slug,
        tag_group: tag.tag_group,
        label: slugToLabel(tag.slug),
        count: tag.count,
      })
      entry.total += tag.count
      groupMap.set(tag.tag_group, entry)
    }

    const result: TagGroupData[] = []

    for (const [group, entry] of groupMap) {
      const sortedTags = entry.tags.sort((a, b) => b.count - a.count).slice(0, 12)
      result.push({
        group,
        label: groupLabel(group),
        tags: sortedTags,
        total_products: entry.total,
      })
    }

    return result.sort((a, b) => b.total_products - a.total_products)
  } catch {
    return []
  }
}

export async function getProductsForTag(tagSlug: string, limit = 20): Promise<ProductForTag[]> {
  try {
    const { data: tagData, error: tagError } = await supabaseAdmin
      .from('tags')
      .select('id')
      .eq('slug', tagSlug)
      .single() as unknown as { data: { id: string } | null; error: unknown }

    if (tagError || !tagData) return []

    type ProductRow = { products: { id: string; slug: string; name: string; logo_url: string | null; category: string } }

    const { data, error } = await supabaseAdmin
      .from('product_tags')
      .select('products!inner(id, slug, name, logo_url, category)')
      .eq('tag_id', tagData.id)
      .eq('products.status', 'active')
      .order('products.created_at', { ascending: false })
      .limit(limit) as unknown as { data: ProductRow[] | null; error: unknown }

    if (error || !data) return []

    return data.map(row => row.products)
  } catch {
    return []
  }
}

export async function getTagBySlug(slug: string): Promise<TagWithCount | null> {
  try {
    const { data: tagData, error: tagError } = await supabaseAdmin
      .from('tags')
      .select('id, slug, tag_group')
      .eq('slug', slug)
      .single() as unknown as { data: { id: string; slug: string; tag_group: string } | null; error: unknown }

    if (tagError || !tagData) return null

    const { count, error: countError } = await supabaseAdmin
      .from('product_tags')
      .select('*', { count: 'exact', head: true })
      .eq('tag_id', tagData.id)

    if (countError) return null

    return {
      slug: tagData.slug,
      tag_group: tagData.tag_group,
      label: slugToLabel(tagData.slug),
      count: count ?? 0,
    }
  } catch {
    return null
  }
}
