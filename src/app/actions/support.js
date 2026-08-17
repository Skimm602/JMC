'use server'

import { createClient } from '@/utils/supabase/server'
import { notifySupportTeam, supportRecipients } from '@/utils/support/notify'
import { MESSAGE_LIMIT, MESSAGE_MINIMUM, SUBJECT_LIMIT } from '@/utils/support/limits'

/** Three in ten minutes is more than anybody with one problem needs, and few
    enough that a bored account cannot fill the inbox. */
const RATE_WINDOW_MINUTES = 10
const RATE_LIMIT = 3

/** PostgREST's two ways of saying the table is not there. The support table
    ships in supabase-support.sql, and until that has been run the button
    should still send mail rather than fail — the record is the audit trail,
    not the errand. */
const MISSING_TABLE = new Set(['42P01', 'PGRST205'])

const isMissingTable = (error) => Boolean(error) && MISSING_TABLE.has(error.code)

/**
 * A logged-in customer asking for help.
 *
 * The name and address are taken from the session rather than from the form.
 * A support request that can claim to be from anyone is a way to make the
 * back office answer a stranger's mail in a customer's name, and it is also
 * why this is not open to logged-out visitors.
 */
export async function sendSupportRequest({ subject, message }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Log in first so we know who to reply to.' }

  const cleanSubject = String(subject ?? '').trim()
  const cleanMessage = String(message ?? '').trim()

  if (!cleanSubject) return { error: 'Give the request a subject.' }
  if (cleanSubject.length > SUBJECT_LIMIT) return { error: `Keep the subject under ${SUBJECT_LIMIT} characters.` }
  if (cleanMessage.length < MESSAGE_MINIMUM) return { error: 'Tell us a little more about the problem.' }
  if (cleanMessage.length > MESSAGE_LIMIT) return { error: `Keep the message under ${MESSAGE_LIMIT} characters.` }

  const since = new Date(Date.now() - RATE_WINDOW_MINUTES * 60_000).toISOString()

  const { count, error: countError } = await supabase
    .from('support_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', since)

  if (countError && !isMissingTable(countError)) {
    return { error: 'Something went wrong. Try again in a moment.' }
  }

  if (!countError && (count ?? 0) >= RATE_LIMIT) {
    return { error: `You have sent ${RATE_LIMIT} requests recently. We will reply to those first.` }
  }

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()

  const recipients = await supportRecipients()

  const outcome = await notifySupportTeam({
    name: profile?.full_name || user.email,
    email: user.email,
    account: user.email,
    subject: cleanSubject,
    message: cleanMessage,
    recipients,
  })

  // Written after the send so the row records what actually happened. If the
  // table is not there yet this is a no-op, and the customer is none the
  // wiser — the mail has already gone.
  const { error: insertError } = await supabase.from('support_requests').insert({
    user_id: user.id,
    name: profile?.full_name || null,
    email: user.email,
    subject: cleanSubject,
    message: cleanMessage,
    delivered: outcome.ok,
    delivered_to: outcome.delivered,
  })

  if (insertError && !isMissingTable(insertError)) {
    console.error('[support] the request was not recorded:', insertError.message)
  }

  if (!outcome.ok) {
    // Deliberately vague to the customer and specific in the server log: the
    // reason is always a configuration problem on our side, and naming it
    // here would tell them about our deployment rather than about their
    // request.
    return { error: 'We could not send that just now. Please email jmcsolarph@gmail.com directly.' }
  }

  return { data: { sent: true } }
}
