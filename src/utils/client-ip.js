/**
 * The visitor's IP, as far as this deployment can tell.
 *
 * x-forwarded-for is a list when proxies chain (Vercel's edge, then this),
 * so the client is the first entry. x-real-ip is the fallback some other
 * hosts set instead. Neither header can be trusted against a request that
 * chooses its own headers directly, so this is fine for rate-limiting — an
 * attacker gains nothing by spoofing the value used to throttle them — but
 * must never be treated as an authenticated identity.
 *
 * Takes anything with a Headers-shaped .get(), so the same function reads a
 * Route Handler's request.headers and a Server Action's next/headers().
 */
export function clientIp(headers) {
  const forwarded = headers.get('x-forwarded-for') ?? ''
  return forwarded.split(',')[0].trim() || headers.get('x-real-ip') || ''
}
