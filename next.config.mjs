/**
 * Headers with no functional risk to opt into now. A real Content-Security-
 * Policy is deliberately not here yet — this app's script/connect surface
 * (Next's own hydration scripts, the browser Supabase client, Resend) needs
 * scoping and testing against every interactive page before a strict CSP
 * ships, or it risks breaking hydration rather than blocking an attacker.
 * These five don't have that risk: none of them restrict what this site
 * itself can load or run, only how other sites may treat it.
 */
const securityHeaders = [
  // No legitimate reason for this site to be framed by another origin.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stops a browser guessing a response's type against what it was served as.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Full URL to same-origin links, origin-only cross-origin — enough for
  // analytics referrers without leaking a customer's full order-page path.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Nothing on this site needs a camera, microphone or the visitor's location.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Vercel already forces HTTPS at the edge; this pins it in the browser too
  // so a subsequent visit can't be downgraded even if a link is typed as http.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Works around an open Next.js 16 bug where the streaming-metadata
  // wrapper causes a hydration mismatch (vercel/next.js#93401, #95347).
  // Matching every UA disables streaming metadata entirely.
  htmlLimitedBots: /.*/,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default nextConfig
