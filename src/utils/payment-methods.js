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

/**
 * Not a technical ceiling like GCASH_LIMIT — QR Ph itself has no such cap.
 * This is a fee decision: a merchant-registered QR Ph payment carries a
 * ~1.8-2% MDR, real money on a battery or inverter order but noise on an
 * accessory. PesoNet has no equivalent per-transaction fee, so past this
 * total PesoNet is the only option offered; GCash and QR Ph stay on offer
 * below it. Matches the ₱60k floor of the inverter/battery catalogue.
 */
export const SMALL_ORDER_LIMIT = 60000

/**
 * PesoNet leads the list — it is the default for every order regardless of
 * size, fee-free on both ends, and the only option left once a total passes
 * SMALL_ORDER_LIMIT. GCash and QR Ph are the smaller-order options beneath
 * it, listed second and third.
 */
export const PAYMENT_METHODS = [
  {
    id: 'pesonet',
    label: 'PesoNet bank transfer',
    hint: 'Clears the next banking day. Use the order reference as the remark.',
    account: 'VIP Solar — <BANK NAME>',
    number: '0000 0000 0000',
    maxTotal: null,
  },
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
    maxTotal: SMALL_ORDER_LIMIT,
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
