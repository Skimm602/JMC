/**
 * How a customer may pay, once an order has been confirmed on the call.
 *
 * ── FILL THESE IN ────────────────────────────────────────────────────────
 * `account` and `number` below are what the customer reads off the screen
 * and types into their banking app, so they have to be VIP's real details.
 * Replace the placeholders once and every order uses them.
 *
 * A QR is optional. Drop an image at public/payment/<id>.png — gcash.png,
 * qr_ph.png — and it appears automatically; leave it out and the panel shows
 * the account details alone. Nothing in the code needs changing either way.
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * GCash caps what a wallet can hold and move. Offering it on an order past
 * that ceiling sends somebody to an app that will refuse them halfway
 * through, so the option is simply not shown — a limit explained after the
 * fact is a support call.
 */
export const GCASH_LIMIT = 50000

export const PAYMENT_METHODS = [
  {
    id: 'gcash',
    label: 'GCash',
    hint: 'Send to the number below, then screenshot the receipt.',
    account: 'VIP Solar',
    number: '0917 000 0000',
    maxTotal: GCASH_LIMIT,
  },
  {
    id: 'qr_ph',
    label: 'QR Ph',
    hint: 'Scan with any bank or e-wallet app that supports QR Ph.',
    account: 'VIP Solar',
    number: null,
    maxTotal: null,
  },
  {
    id: 'pesonet',
    label: 'PesoNet bank transfer',
    hint: 'Clears the next banking day. Use the order reference as the remark.',
    account: 'VIP Solar — <BANK NAME>',
    number: '0000 0000 0000',
    maxTotal: null,
  },
]

/**
 * The methods a given total may actually be paid with.
 *
 * A quoted order has no total yet, so nothing is filtered — by the time the
 * customer sees this screen the call has happened and the figure is set.
 */
export function methodsFor(total) {
  const amount = Number(total)
  if (!Number.isFinite(amount) || amount <= 0) return PAYMENT_METHODS
  return PAYMENT_METHODS.filter((m) => m.maxTotal == null || amount <= m.maxTotal)
}
