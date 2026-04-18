/**
 * lib/auth.ts
 *
 * Auth helpers for both server and client contexts.
 *
 * Server functions (getSession, getUser, createServerSupabaseClient):
 *   - Use @supabase/ssr createServerClient with Next.js cookies()
 *   - Only call from Server Components, Route Handlers, or Server Actions
 *
 * Client function (createBrowserSupabaseClient):
 *   - Use @supabase/ssr createBrowserClient
 *   - Only call from Client Components (browser)
 */

import { createServerClient, createBrowserClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Session, User, SupabaseClient } from '@supabase/supabase-js'

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    )
  }
  return { url, anonKey }
}

/**
 * Creates a Supabase client wired to the current request's cookies.
 * Suitable for server components, route handlers, and server actions.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const { url, anonKey } = getEnv()
  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // setAll is called from Server Components where cookies are read-only.
          // Middleware handles the actual token refresh — this catch is intentional.
        }
      },
    },
  })
}

/**
 * Returns the current session or null.
 * Uses cookie-based auth — no network round-trip if token is valid.
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

/**
 * Returns the authenticated user (verified server-side) or null.
 * Prefer this over getSession() when you only need user identity —
 * getUser() validates the JWT against Supabase, getSession() trusts the cookie.
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Browser-side Supabase client for Client Components.
 * Uses @supabase/ssr createBrowserClient for cookie-based session sync
 * with the server (middleware can then refresh the token).
 */
export function createBrowserSupabaseClient(): SupabaseClient {
  const { url, anonKey } = getEnv()
  return createBrowserClient(url, anonKey)
}
