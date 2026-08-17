/**
 * Getting a support request in front of a human.
 *
 * Sent via Resend, straight from the server — the API key never reaches the
 * browser. Recipients come from `public.admins`, read with the service key,
 * the same as before: a customer's own session cannot see who to write to.
 *
 * Server-only. Every value read below is unprefixed on purpose: none of it
 * may reach the browser.
 */

// Hard boundary rather than a convention. This module reads RESEND_API_KEY and
// the Supabase service key; importing it from a client component would be a
// build error here instead of a secret in a browser bundle.
import 'server-only'

import { Resend } from 'resend'

/** A roster is a handful of people. The cap is here so a misconfigured
    service key cannot turn one button press into a bulk send. */
const ROSTER_LIMIT = 25

/**
 * The admin roster, read with the service key.
 *
 * `public.admins` is readable only by admins — that is the point of the
 * policy — so the customer's own session cannot see who to write to. This
 * reads it with the service role instead, over REST rather than through a
 * Supabase client, because a client that carries this key must never be one
 * that could accidentally be handed a cookie store and reused elsewhere.
 *
 * Optional. Without the key the send still happens; it falls back to
 * SUPPORT_INBOX or, failing that, the configured from-address's own inbox.
 */
async function rosterFromDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) return []

  try {
    const res = await fetch(`${url}/rest/v1/admins?select=email&limit=${ROSTER_LIMIT}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
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

function envList(value) {
  if (!value) return []
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

/**
 * Who this request should reach, most specific first.
 *
 * SUPPORT_INBOX wins because it is the deliberate answer — someone typed it.
 * The roster is the standing answer.
 */
export async function supportRecipients() {
  const override = envList(process.env.SUPPORT_INBOX)
  if (override.length) return override
  return rosterFromDatabase()
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
  )
}

/**
 * Hand the request to Resend.
 *
 * Never throws. A support form that explodes because the mail provider is
 * having a bad afternoon is worse than one that says so, and the caller needs
 * the outcome to record it either way.
 *
 * The sandbox address `onboarding@resend.dev` (the default for
 * SUPPORT_FROM_EMAIL until a domain is verified) only delivers to the email
 * address on the Resend account itself — sends to any other admin address
 * will fail with a 403 until a real domain is added and verified in Resend.
 */
export async function notifySupportTeam({ name, email, account, subject, message, recipients }) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.SUPPORT_FROM_EMAIL?.trim() || 'onboarding@resend.dev'

  if (!apiKey) {
    console.warn('[support] RESEND_API_KEY is not set — nothing was emailed.')
    return { ok: false, reason: 'not-configured', delivered: [] }
  }

  if (!recipients?.length) {
    console.warn('[support] no admin recipients configured — nothing was emailed.')
    return { ok: false, reason: 'no-recipients', delivered: [] }
  }

  const resend = new Resend(apiKey)

  const text = `From: ${name} <${account}>\n\n${message}`
  const html = `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(account)}&gt;</p><p>${escapeHtml(
    message
  ).replace(/\n/g, '<br>')}</p>`

  const { data, error } = await resend.emails.send({
    from,
    to: recipients,
    replyTo: email,
    subject: `[Support] ${subject}`,
    text,
    html,
  })

  if (error) {
    console.error('[support] Resend refused the request:', error.message)
    return { ok: false, reason: error.message, delivered: [] }
  }

  return { ok: true, delivered: recipients, id: data?.id }
}
