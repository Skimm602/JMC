/**
 * VIP Solar — customer support relay.
 *
 * The site cannot send mail on its own: Next.js has no mailbox, and wiring
 * SMTP into it would mean storing a Gmail app password in the deployment.
 * This script is the mailbox instead. It runs as the Google account that owns
 * it, so MailApp already has the right to send — no password leaves the site,
 * and revoking it is a matter of undeploying rather than rotating a secret.
 *
 * One entry point, one job: take a support request from the site and put it
 * in front of whoever is on the admin roster.
 *
 * ---------------------------------------------------------------------------
 * SCRIPT PROPERTIES (Project Settings -> Script Properties)
 *
 *   SHARED_TOKEN    required. Must match SUPPORT_SCRIPT_TOKEN in the site's
 *                   .env.local. A web app deployed to "Anyone" is a public
 *                   URL, and this is the only thing standing between it and
 *                   a stranger with a mail cannon.
 *
 *   SUPPORT_INBOX   optional. Comma-separated fallback recipients, used only
 *                   when the site does not send a roster of its own.
 * ---------------------------------------------------------------------------
 */

/** Kept out of the mail body so a stray value cannot break the layout. */
var MAX_FIELD = 5000

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return reply(400, { error: 'Empty request' })
    }

    var body
    try {
      body = JSON.parse(e.postData.contents)
    } catch (parseError) {
      return reply(400, { error: 'Body is not JSON' })
    }

    var expected = scriptProperty('SHARED_TOKEN')
    if (!expected) {
      return reply(500, { error: 'SHARED_TOKEN is not set on this script' })
    }
    // Compared as whole strings rather than by prefix. Timing is not a real
    // concern across an HTTPS round trip, but a sloppy comparison here is the
    // kind that quietly accepts an empty token.
    if (String(body.token || '') !== String(expected)) {
      return reply(401, { error: 'Bad token' })
    }

    var recipients = normaliseRecipients(body.recipients)
    if (!recipients.length) recipients = normaliseRecipients(scriptProperty('SUPPORT_INBOX'))
    // Last resort, and the reason this script can never silently swallow a
    // message: whoever owns the script always has an address.
    if (!recipients.length) {
      var owner = Session.getEffectiveUser().getEmail()
      if (owner) recipients = [owner]
    }
    if (!recipients.length) {
      return reply(500, { error: 'No recipients — set SUPPORT_INBOX' })
    }

    var from = {
      name: clamp(body.name) || 'VIP customer',
      email: clamp(body.email),
      account: clamp(body.account),
    }
    var subject = clamp(body.subject) || 'Support request'
    var message = clamp(body.message)

    if (!from.email || !message) {
      return reply(400, { error: 'email and message are both required' })
    }

    MailApp.sendEmail({
      to: recipients.join(','),
      // The subject is prefixed rather than passed through, so a rule in the
      // shared inbox can file every one of these without guessing.
      subject: '[VIP Support] ' + subject,
      // Hitting reply should reach the customer, not this script's owner —
      // that is the whole difference between a support inbox and a log file.
      replyTo: from.email,
      name: 'VIP Solar Support',
      body: plainBody(from, subject, message),
      htmlBody: htmlBody(from, subject, message),
    })

    return reply(200, {
      ok: true,
      delivered: recipients,
      quotaRemaining: MailApp.getRemainingDailyQuota(),
    })
  } catch (err) {
    // Logged where the script owner can find it, and reported back plainly so
    // the site can tell the customer something true rather than "sent".
    console.error(err)
    return reply(500, { error: String((err && err.message) || err) })
  }
}

/**
 * Opening the deployment URL in a browser is how everybody checks whether a
 * web app is live, so it answers instead of throwing.
 *
 * It also reports enough to tell a working deployment from a misconfigured
 * one without anybody having to read an execution log: whether the token is
 * set, and which property names the script can actually see. Names, never
 * values — the URL is unguessable rather than secret, and a diagnostic that
 * prints the shared token would hand over the thing the token protects.
 *
 * The property read is wrapped because it is exactly the call that fails when
 * the manifest pins an OAuth scope list that leaves PropertiesService out. A
 * thrown exception here would read as "the script is broken" when the real
 * answer is "the script is not allowed to look".
 */
function doGet() {
  var diagnostics = { tokenSet: false, propertyKeys: [], propertiesReadable: false }

  try {
    var properties = PropertiesService.getScriptProperties().getProperties()
    diagnostics.propertiesReadable = true
    diagnostics.propertyKeys = Object.keys(properties)
    diagnostics.tokenSet = Boolean(properties.SHARED_TOKEN)
  } catch (err) {
    diagnostics.propertiesError = String((err && err.message) || err)
  }

  try {
    diagnostics.mailQuotaRemaining = MailApp.getRemainingDailyQuota()
  } catch (err) {
    diagnostics.mailError = String((err && err.message) || err)
  }

  return reply(200, { ok: true, service: 'VIP Solar support relay', diagnostics: diagnostics })
}

/* ------------------------------- helpers -------------------------------- */

function scriptProperty(key) {
  var value = PropertiesService.getScriptProperties().getProperty(key)
  return value ? value.trim() : ''
}

/** Accepts either an array or a comma-separated string, and drops anything
    that is not plausibly an address rather than letting MailApp throw. */
function normaliseRecipients(input) {
  var list = []
  if (!input) return list
  if (typeof input === 'string') list = input.split(',')
  else if (Object.prototype.toString.call(input) === '[object Array]') list = input

  var seen = {}
  var out = []
  for (var i = 0; i < list.length; i++) {
    var address = String(list[i] || '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) continue
    var key = address.toLowerCase()
    if (seen[key]) continue
    seen[key] = true
    out.push(address)
  }
  return out
}

function clamp(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim().slice(0, MAX_FIELD)
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function plainBody(from, subject, message) {
  return [
    'From:    ' + from.name + ' <' + from.email + '>',
    from.account ? 'Account: ' + from.account : null,
    'Subject: ' + subject,
    '',
    message,
    '',
    '--',
    'Sent from the support button on the VIP Solar site. Reply to this email',
    'and the customer receives it directly.',
  ]
    .filter(function (line) {
      return line !== null
    })
    .join('\n')
}

/** Deliberately plain HTML. Mail clients disagree about everything else, and
    this is read on a phone between other jobs. */
function htmlBody(from, subject, message) {
  var rows = [['From', from.name + ' &lt;' + escapeHtml(from.email) + '&gt;']]
  if (from.account) rows.push(['Account', escapeHtml(from.account)])
  rows.push(['Subject', escapeHtml(subject)])

  var table = rows
    .map(function (row) {
      return (
        '<tr>' +
        '<td style="padding:4px 12px 4px 0;color:#4c6484;white-space:nowrap;vertical-align:top">' +
        row[0] +
        '</td>' +
        '<td style="padding:4px 0;color:#0b1f38">' +
        row[1] +
        '</td>' +
        '</tr>'
      )
    })
    .join('')

  return (
    '<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:14px;line-height:1.6;color:#0b1f38">' +
    '<table style="border-collapse:collapse;font-size:13px">' +
    table +
    '</table>' +
    '<hr style="border:none;border-top:1px solid #c2d8ec;margin:16px 0">' +
    '<div style="white-space:pre-wrap">' +
    escapeHtml(message) +
    '</div>' +
    '<hr style="border:none;border-top:1px solid #c2d8ec;margin:16px 0">' +
    '<p style="color:#4c6484;font-size:12px;margin:0">' +
    'Sent from the support button on the VIP Solar site. Reply to this email and the customer receives it directly.' +
    '</p>' +
    '</div>'
  )
}

function reply(status, payload) {
  // Apps Script web apps always answer 200 — the status travels in the body
  // instead, and the site reads it from there.
  payload.status = status
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON)
}
