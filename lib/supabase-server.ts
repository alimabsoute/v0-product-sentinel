import { createClient } from '@supabase/supabase-js'

/**
 * Lazy-initialized admin client — evaluated on first call, not at import time.
 * This lets `next build` succeed even when env vars aren't set at build time.
 * The error only fires at runtime if the vars are actually missing.
 */
let _client: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase server env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. The service role key bypasses RLS — never import this from client code.',
    )
  }

  _client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return _client
}

/** Backwards-compat alias — use getSupabaseAdmin() for new code. */
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getSupabaseAdmin() as never)[prop]
  },
})
