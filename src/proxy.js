import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

/** Storage lives on the project's own Supabase domain — product photos from
    the public product-images bucket, and signed URLs from the private
    payment-proof/delivery-proof/verification-doc buckets, both rendered
    inline as <img> in the admin panel, and the verification-doc <object>
    fallback for a PDF proof. Both img-src and object-src need it. */
const SUPABASE_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL

function generateNonce() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}

/**
 * script-src is nonce-based and strict — Next's own hydration scripts pick
 * the nonce up automatically once it is on the response's CSP header, and
 * IntroScreen.jsx reads it via headers() for its one inline script.
 *
 * style-src keeps 'unsafe-inline' rather than matching that strictness: this
 * codebase uses React's style={{...}} for real, non-decorative reasons (chart
 * bars, animation delays, a computed grid-template) across seven components,
 * and CSP has no nonce mechanism for the style attribute the way it does for
 * <script> — only for <style> blocks. Hashing every computed value is not
 * practical, and rewriting those seven components to push every dynamic value
 * through CSS custom properties instead is a real refactor, not a header
 * change. Inline CSS injection is a narrower, lower-severity risk than script
 * injection, which is where the strict half of this policy is spent.
 */
function buildCsp(nonce) {
  // React's dev-mode debugging tools (Fast Refresh's stack-frame remapping)
  // call eval() — a dev-only, framework-internal need. React's own docs are
  // explicit that production never uses eval(), so this exception is scoped
  // out of what actually ships.
  const scriptSrc = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${
    process.env.NODE_ENV === 'production' ? '' : ` 'unsafe-eval'`
  }`

  return [
    `default-src 'self'`,
    scriptSrc,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' ${SUPABASE_ORIGIN}`,
    `font-src 'self'`,
    `object-src 'self' ${SUPABASE_ORIGIN}`,
    `connect-src 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ')
}

/**
 * Renamed from middleware.js/export function middleware — Next.js 16
 * deprecated that convention in favor of proxy.js/export function proxy
 * (same runtime behavior, file and export renamed only). See
 * node_modules/next/dist/docs/.../file-conventions/proxy.md. Everything
 * below is otherwise unchanged from the original middleware.
 */
export async function proxy(request) {
  const nonce = generateNonce()
  const csp = buildCsp(nonce)

  // x-nonce rides on the *request* headers so Server Components can read it
  // back via headers() (see IntroScreen.jsx); the CSP itself is a response
  // header, set once at the end regardless of which branch below produced
  // supabaseResponse.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

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
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
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

  supabaseResponse.headers.set('Content-Security-Policy', csp)
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
