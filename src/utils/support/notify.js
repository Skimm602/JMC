/**
 * Getting a support request in front of a human.
 *
 * The site has no mailbox of its own. Sending is delegated to a Google Apps
 * Script web app (see apps-script/Code.gs), which runs as the account that
 * owns it and therefore already has the right to send mail — so nothing here
 * holds a mail password, and turning support off is an undeploy rather than a
 * secret rotation.
 *
 * Server-only. Every value read below is unprefixed on purpose: none of it
 * may reach the browser.
 */

/** A roster is a handful of people. The cap is here so a misconfigured
    service key cannot turn one button press into a bulk send. */
const ROSTER_LIMIT = 25

/** The script is a network call to somebody else's infrastructure, and a
    customer is watching a spinner while it happens. */
const SEND_TIMEOUT_MS = 15_000

function envList(value) {
  if (!value) return []
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

/**
 * The admin roster, read with the service key.
 *
 * `public.admins` is readable only by admins — that is the point of the
 * policy — so the customer's own session cannot see who to write to. This
 * reads it with the service role instead, over REST rather than through a
 * Supabase client, because a client that carries this key must never be one
 * that could accidentally be handed a cookie store and reused elsewhere.
 *
 * Optional. Without the key the send still happens; the script falls back to
 * its own inbox setting, and finally to the address that owns it.
 */
async function rosterFromDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) return []

  try {
    const res = await fetch(`${url}/rest/v1/admins?select=email&limit=${ROSTER_LIMIT}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    })

    if (!res.ok) {
      console.warn('[support] could not read the admin roster:', res.status, await res.text())
      return []
    }

    const rows = await res.json()
    return (Array.isArray(rows) ? rows : []).map((row) => row?.email).filter(Boolean)
  } catch (error) {
    console.warn('[support] could not read the admin roster:', error.message)
    return []
  }
}

/**
 * Who this request should reach, most specific first.
 *
 * SUPPORT_INBOX wins because it is the deliberate answer — someone typed it.
 * The roster is the standing answer. An empty list is not a failure: it means
 * "you decide", and the script's own fallbacks take over from there.
 */
export async function supportRecipients() {
  const override = envList(process.env.SUPPORT_INBOX)
  if (override.length) return override
  return rosterFromDatabase()
}

/**
 * Hand the request to the Apps Script relay.
 *
 * Never throws. A support form that explodes because a Google deployment is
 * having a bad afternoon is worse than one that says so, and the caller needs
 * the outcome to record it either way.
 */
export async function notifySupportTeam({ name, email, account, subject, message, recipients }) {
  const url = process.env.SUPPORT_SCRIPT_URL?.trim()
  const token = process.env.SUPPORT_SCRIPT_TOKEN?.trim()

  if (!url) {
    console.warn('[support] SUPPORT_SCRIPT_URL is not set — nothing was emailed.')
    return { ok: false, reason: 'not-configured', delivered: [] }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      // text/plain rather than application/json: Apps Script reads
      // e.postData.contents identically either way, and this content type is
      // the one its web apps handle without argument.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token, name, email, account, subject, message, recipients }),
      // /exec answers with a 302 to googleusercontent, where the result is
      // actually served. doPost has already run by then.
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    })

    const raw = await res.text()

    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      // Almost always the Google sign-in page: the deployment is set to
      // "Only myself" instead of "Anyone".
      console.error('[support] the relay did not answer with JSON. Check the deployment is open to "Anyone".')
      return { ok: false, reason: 'bad-response', delivered: [] }
    }

    if (!payload.ok) {
      console.error('[support] the relay refused the request:', payload.error)
      return { ok: false, reason: payload.error || 'refused', delivered: [] }
    }

    // Apps Script caps a consumer account at 100 mails a day. Running out is
    // silent from the site's side — sends simply start failing — so the warning
    // goes out while there is still time to do something about it.
    if (typeof payload.quotaRemaining === 'number' && payload.quotaRemaining < 20) {
      console.warn(`[support] only ${payload.quotaRemaining} sends left on the relay's daily quota.`)
    }

    return { ok: true, delivered: payload.delivered ?? [] }
  } catch (error) {
    console.error('[support] could not reach the relay:', error.message)
    return { ok: false, reason: 'unreachable', delivered: [] }
  }
}
