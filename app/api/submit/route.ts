import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const schema = z.object({
  name: z.string().min(1).max(100),
  website_url: z.string().url(),
  category: z.string().min(1),
  description: z.string().max(300).optional(),
  email: z.string().email().optional().or(z.literal('')),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid input'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const data = parsed.data
    const supabase = getSupabaseAdmin()

    const slug =
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Date.now().toString(36)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('products') as any).insert({
      name: data.name,
      slug,
      website_url: data.website_url,
      category: data.category.toLowerCase().replace(/\s+/g, '-'),
      description: data.description ?? null,
      status: 'pending',
      source: 'user-submission',
    })

    if (error) {
      console.error('/api/submit insert error:', error)
      return NextResponse.json({ error: 'Failed to save submission. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('/api/submit error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
