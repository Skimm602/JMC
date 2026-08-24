import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes the session if expired — required for Server Components,
  // which can't set cookies themselves.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The heartbeat behind "how long did they stay" in the login history admin
  // panel — see touch_login_session() in supabase-login-history.sql, which
  // throttles the actual write to once per five minutes so this is cheap on
  // every other request. Wrapped rather than just awaited: this runs on
  // every request site-wide, so a network hiccup here — or the migration
  // simply not having been run yet — must never turn into a broken page.
  if (user) {
    try {
      await supabase.rpc('touch_login_session')
    } catch {
      // Best-effort. See above.
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
