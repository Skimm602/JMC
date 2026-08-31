import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * createServiceClient()
 *
 * For code with no user session to speak of — a server-to-server webhook,
 * not a request from someone's browser. Authenticated with the service role
 * key rather than a cookie, so it bypasses RLS entirely rather than acting
 * as anon or authenticated.
 *
 * Use this instead of utils/supabase/server.js wherever the caller isn't a
 * signed-in visitor: the anon-key client can only reach what RLS and a
 * function's own grants allow anon/authenticated to touch, which is
 * deliberately little. A route that authorizes itself another way (a shared
 * secret, in the payments webhook's case) needs a client that is allowed to
 * act on that authorization.
 *
 * 'server-only' turns an accidental import from a Client Component into a
 * build error rather than shipping this key to a browser.
 */
export function createServiceClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
