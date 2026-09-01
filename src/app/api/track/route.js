import { createHash } from 'node:crypto'
import { createClient } from '@/utils/supabase/server'
import { clientIp } from '@/utils/client-ip'

/**
 * One visit, counted.
 *
 * The browser pings this once per page it opens; record_page_view() folds
 * that into the visitor's row for the day. It answers 204 either way and
 * never says what the counter reads — a public endpoint that reports the
 * traffic figure is a public traffic figure.
 *
 * Who the visitor is never leaves this function. The address and browser
 * string are hashed together with the Manila date and thrown away in the same
 * breath, so the database holds a value that identifies a returning visitor
 * for the rest of the day and matches nothing at all tomorrow. No cookie, no
 * address stored, nothing to hand over or leak.
 *
 * What that trades away: a household behind one router, on the same browser
 * and OS, counts once rather than twice. For a figure whose job is "is the
 * site busier this month than last", under-counting a shared connection is
 * the right side to err on — it never invents a visitor.
 */

/** Optional. Without it the hash is still one-way and still rotates daily;
    with it, a stolen table cannot be tested against a guessed address list. */
const SALT = process.env.PAGE_VIEW_SALT ?? 'vip-solar-page-views'

/** The same calendar the SQL function stamps rows with, so the hash rolls
    over at Manila midnight rather than eight hours late. 'en-CA' is the
    shortest route to YYYY-MM-DD. */
const manilaDay = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())

export async function POST(request) {
  const address = clientIp(request.headers)
  const agent = request.headers.get('user-agent') ?? ''

  // Nothing to tell one visitor from another. Counting this would merge every
  // such request onto a single row and report one visitor for all of them.
  if (!address && !agent) return new Response(null, { status: 204 })

  const visitorHash = createHash('sha256')
    .update(`${address}|${agent}|${manilaDay()}|${SALT}`)
    .digest('hex')

  const supabase = await createClient()
  await supabase.rpc('record_page_view', { p_visitor_hash: visitorHash })

  // Deliberately not surfacing the RPC's error. A visitor cannot act on it,
  // and a missed count is not worth a failed request on their page — see the
  // beacon in PageViewTracker, which cannot handle a failure either.
  return new Response(null, { status: 204 })
}
