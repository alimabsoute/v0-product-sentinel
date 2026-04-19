import { supabaseAdmin } from '@/lib/supabase-server'

export type Comment = {
  id: string
  product_id: string
  user_id: string
  content: string
  parent_id: string | null
  created_at: string
  author_name: string
}

export async function getProductComments(productId: string): Promise<Comment[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_comments')
      .select('*')
      .eq('product_id', productId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error || !data) return []
    return (data as unknown as Comment[]).map(c => ({
      ...c,
      author_name: 'User', // display name resolved client-side
    }))
  } catch { return [] }
}

export async function getProductCommentCount(productId: string): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin
      .from('product_comments')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
    if (error) return 0
    return count ?? 0
  } catch { return 0 }
}
