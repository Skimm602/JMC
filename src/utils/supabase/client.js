import { createBrowserClient } from '@supabase/ssr'

/**
 * createClient()
 *
 * Use this inside 'use client' components — anything running in the
 * browser (e.g. checking auth state client-side, listening for auth
 * changes). Do NOT use this inside Server Actions or Server Components;
 * use utils/supabase/server.js there instead.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
