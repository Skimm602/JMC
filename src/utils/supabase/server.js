import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * createClient()
 *
 * Use this inside Server Actions, Server Components, and Route Handlers
 * (i.e. anything running on the server). It reads/writes the user's auth
 * session via cookies, so supabase.auth.getUser() correctly reflects who
 * is logged in for the current request.
 *
 * Do NOT import this into a 'use client' component — it will not work
 * in the browser. Use utils/supabase/client.js there instead.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll can be called from a Server Component, where cookies
            // can't be set. This is safe to ignore if you have middleware
            // refreshing the user session (see middleware.js).
          }
        },
      },
    }
  )
}