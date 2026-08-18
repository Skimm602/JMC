'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createOrder } from '@/app/actions/checkout'
import { addToCart } from '@/app/actions/cart'
import { formatPeso, isPriced, quote, VAT_RATE } from '@/utils/pricing'
import NoRefundsDialog from './NoRefundsDialog.jsx'
import { Checkbox, Field, Textarea, TextInput } from './form.jsx'
import { Button, Rule, cx } from './ui.jsx'
import { AlertIcon, ArrowRightIcon, CartIcon, CheckIcon, SpinnerIcon } from './icons.jsx'

/**
 * Buying one unit, in three screens.
 *
 *   address   what it costs, how many, and where it goes
 *   summary   what that adds up to, and the undertaking to pay it
 *   placed    the order reference, and where to find it again
 *
 * The summary is a step rather than a panel that grows under the form
 * because agreeing to a total is a different act from typing an address, and
 * running them together is how someone commits to a number they never read.
 * Nothing is written until the second button, and the address stays editable
 * right up to that point.
 *
 * Every figure shown here is computed by @/utils/pricing, which is the same
 * module createOrder() runs server-side against the database's own
 * prices. This screen cannot set a price; it can only predict one.
 */

/* --------------------------------- pieces --------------------------------- */

function Money({ label, value, note, sign, tone = 'ink', strong }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <span className={cx('text-sm', strong ? 'text-ink font-medium' : 'text-ink-soft')}>
        {label}
        {note && <span className="text-ink-soft ml-1.5 text-xs">{note}</span>}
      </span>
      <span
        className={cx(
          'shrink-0 font-mono tabular-nums',
          strong ? 'text-ink text-lg font-semibold' : 'text-sm',
          tone === 'cool' && 'text-cool-600',
          tone === 'ink' && !strong && 'text-ink',
        )}
      >
        {sign}
        {formatPeso(value)}
      </span>
    </div>
  )
}

function Notice({ children }) {
  return (
    <p
      role="alert"
      className="border-hot-600/40 bg-hot-600/[0.06] text-ink flex items-start gap-2.5 border px-3.5 py-3 text-sm leading-relaxed"
    >
      <AlertIcon className="text-hot-600 mt-0.5 h-4 w-4 shrink-0" />
      {children}
    </p>
  )
}

/* -------------------------------- component ------------------------------- */

export default function ProductCheckout({ product, isInstaller, signedIn }) {
  const router = useRouter()

  const [step, setStep] = useState('address')
  const [quantity, setQuantity] = useState(1)
  const [address, setAddress] = useState({ streetAddress: '', city: '', province: '', postalCode: '' })
  // The confirmation call is the next step after this form, so the number to
  // ring is asked for here rather than looked up later. The note is what makes
  // that call short.
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [agreementError, setAgreementError] = useState(null)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const [placed, setPlaced] = useState(null)
  const [cartStatus, setCartStatus] = useState('idle')
  const [cartError, setCartError] = useState(null)
  const [refundWarningOpen, setRefundWarningOpen] = useState(false)

  const stock = product.stock_quantity
  const soldOut = stock === 0

  // A catalogued product with no price yet. It can still be ordered — the
  // confirmation call is where the figure is agreed — but nothing on this
  // screen may pretend to know what it costs.
  const quoted = !isPriced(product)

  const priced = useMemo(
    () => quote({ lines: [{ product, quantity }], isInstaller }),
    [product, quantity, isInstaller],
  )

  const set = (key) => (event) => setAddress((current) => ({ ...current, [key]: event.target.value }))

  const review = (event) => {
    event.preventDefault()
    setError(null)
    setRefundWarningOpen(true)
  }

  const addToCartNow = async () => {
    setCartStatus('adding')
    setCartError(null)

    const result = await addToCart(product.id, quantity)
    setCartStatus(result?.error ? 'idle' : 'added')

    if (result?.error) {
      setCartError(result.error)
      return
    }

    // Only the header's cart badge reads server state on this page — nothing
    // else here depends on the cart, so a refresh is enough to update it.
    router.refresh()
  }

  const place = async (event) => {
    event.preventDefault()

    // The browser cannot enforce a checkbox that is not `required`, and making
    // it required would let the native bubble say "please check this box" —
    // far too casual for the one control that waives a refund.
    if (!agreed) {
      setAgreementError('You have to accept this before the order can be placed.')
      return
    }

    setAgreementError(null)
    setError(null)
    setPending(true)

    // FormData rather than a plain object: a File cannot cross a server-action
    // boundary inside JSON.
    const data = new FormData()
    data.set('items', JSON.stringify([{ productId: product.id, quantity }]))
    data.set('shipping', JSON.stringify(address))
    data.set('phone', phone.trim())
    data.set('note', note.trim())
    data.set('acceptedTerms', 'true')

    const result = await createOrder(data)

    setPending(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    setPlaced(result)
    setStep('placed')
    // The order exists now, so the history page behind this one is stale.
    router.refresh()
  }

  /* ------------------------------- signed out ------------------------------ */

  if (!signedIn) {
    return (
      <div className="border-rule bg-glare rounded-panel border p-6 sm:p-8">
        <p className="label text-ink-soft">Price</p>
        <p className="text-ink text-display-3 mt-2 font-mono font-semibold tabular-nums">
          {formatPeso(Number(product.retail_price))}
        </p>
        <p className="text-ink-soft mt-1.5 text-xs">
          VAT-exclusive · {Math.round(VAT_RATE * 100)} % added at checkout
        </p>

        <Rule className="my-6" />

        <p className="text-ink-soft text-sm leading-relaxed">
          Ordering needs an account — it is what the delivery address and the order record hang off. Installer
          accounts also see trade pricing here once they are registered.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button as="a" href="/login">
            Log in to order
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
          <Button as="a" href="/register" variant="outline">
            Create an account
          </Button>
        </div>
      </div>
    )
  }

  /* --------------------------------- placed -------------------------------- */

  if (step === 'placed') {
    return (
      <div className="border-cool-600/40 bg-cool-600/[0.05] animate-reveal rounded-panel border p-6 sm:p-8">
        <p className="text-ink flex items-center gap-2.5 font-medium">
          <CheckIcon className="text-cool-600 h-5 w-5 shrink-0" strokeWidth={2.4} />
          Order placed
        </p>

        <p className="text-ink-soft mt-4 text-sm leading-relaxed">
          {quantity} × {product.name}, going to {address.city}, {address.province}. Somebody from VIP will call you
          to confirm the details before anything is charged — sizing, installation and delivery. Payment comes after
          that call, and nothing leaves the warehouse until it clears.
        </p>

        <Rule className="my-6" />

        <dl className="grid gap-3">
          <div className="flex items-baseline justify-between gap-6">
            <dt className="label text-ink-soft">Reference</dt>
            <dd className="text-ink font-mono text-xs break-all">{placed?.orderId}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-6">
            <dt className="label text-ink-soft">Total due</dt>
            <dd className={quoted ? 'text-ink-soft text-sm' : 'text-ink font-mono text-lg font-semibold tabular-nums'}>
              {quoted ? 'confirmed on the call' : formatPeso(placed?.total)}
            </dd>
          </div>
        </dl>

        <Button as={Link} href="/account/orders" className="mt-7 w-full">
          View it in purchase history
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  /* -------------------------------- summary -------------------------------- */

  if (step === 'summary') {
    return (
      <form onSubmit={place} className="border-rule bg-glare animate-reveal rounded-panel border p-6 sm:p-8">
        <p className="label text-ink-soft">Step 2 of 2</p>
        <h2 className="display-wide text-ink mt-2 text-xl font-semibold">What you are paying</h2>

        <div className="border-rule mt-6 border-t">
          <Money
            label={product.name}
            note={`× ${quantity}`}
            value={priced.retailSubtotal}
            tone="ink"
          />

          {/* Only shown when it is not zero: a "— ₱0.00" discount line reads
              as a saving that failed rather than one that never applied. */}
          {priced.discount > 0 && (
            <Money label="Installer discount" value={priced.discount} sign="− " tone="cool" />
          )}

          <Rule />

          <Money label="Subtotal" note="VAT-exclusive" value={priced.subtotal} />
          <Money label={`VAT ${Math.round(VAT_RATE * 100)} %`} value={priced.vat} sign="+ " />

          <Rule />

          {quoted ? (
            /* No figure exists yet, so none is shown. Rendering ₱0.00 as a
               "total due" would be a number nobody agreed to on a screen whose
               whole job is agreeing to one. */
            <div className="flex items-baseline justify-between gap-6 py-2.5">
              <span className="text-ink text-sm font-medium">Total due</span>
              <span className="text-ink-soft shrink-0 text-sm">confirmed on the call</span>
            </div>
          ) : (
            <Money label="Total due" value={priced.total} strong />
          )}
        </div>

        <Rule className="my-6" />

        <div>
          <p className="label text-ink-soft">Delivering to</p>
          <address className="text-ink mt-2 text-sm leading-relaxed not-italic">
            {address.streetAddress}
            <br />
            {address.city}, {address.province} {address.postalCode}
          </address>
          <p className="text-ink-soft mt-3 text-xs">
            We will call <span className="text-ink font-mono">{phone}</span> to confirm before any payment.
          </p>
        </div>

        <Rule className="my-6" />


        {/* tone="hot" is reserved on this site for the control that changes
            what is being agreed to, and this is that control. */}
        <Checkbox
          tone="hot"
          checked={agreed}
          onChange={(next) => {
            setAgreed(next)
            if (next) setAgreementError(null)
          }}
          error={agreementError}
          label={
            quoted
              ? 'I understand the price will be confirmed on the call before I pay anything.'
              : `I agree to pay ${formatPeso(priced.total)} for this order.`
          }
          description={
            quoted
              ? 'Nothing is charged when you submit this. We call to confirm the specification and the price, and only then are you asked to pay. Once you have paid, the sale is final — payments are not refunded and equipment is not taken back.'
              : 'This amount is due in full and this sale is final — once the order is placed, payments are not refunded and equipment is not taken back. Check the address, the quantity and the total above before you continue.'
          }
        />

        {error && <div className="mt-6">
          <Notice>{error}</Notice>
        </div>}

        <div className="mt-7 flex flex-wrap gap-3">
          <Button type="submit" size="lg" disabled={pending} className="flex-1">
            {pending && <SpinnerIcon className="h-4 w-4" />}
            {pending ? 'Placing order…' : 'Place order'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={pending}
            onClick={() => {
              setError(null)
              setStep('address')
            }}
          >
            Back
          </Button>
        </div>
      </form>
    )
  }

  /* -------------------------------- address -------------------------------- */

  return (
    <form onSubmit={review} className="border-rule bg-glare rounded-panel border p-6 sm:p-8">
      <NoRefundsDialog
        open={refundWarningOpen}
        onConfirm={() => {
          setRefundWarningOpen(false)
          setStep('summary')
        }}
        onClose={() => setRefundWarningOpen(false)}
      />
      <p className="label text-ink-soft">Step 1 of 2</p>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          {priced.discount > 0 && (
            <p className="text-ink-soft font-mono text-sm">
              <span className="sr-only">List price </span>
              <s>{formatPeso(priced.items[0].retailUnitPrice)}</s>
            </p>
          )}
          {quoted ? (
            <>
              <p className="display-wide text-display-3 text-ink mt-1 font-semibold">Price on request</p>
              <p className="text-ink-soft mt-1.5 text-xs">agreed on the confirmation call</p>
            </>
          ) : (
            <>
              <p className="text-ink text-display-3 mt-1 font-mono font-semibold tabular-nums">
                {formatPeso(priced.items[0].unitPrice)}
              </p>
              <p className="text-ink-soft mt-1.5 text-xs">
                {priced.discount > 0 && <span className="text-cool-600 font-medium">Installer price · </span>}
                per unit, VAT-exclusive
              </p>
            </>
          )}
        </div>
      </div>

      <Rule className="my-6" />

      {soldOut ? (
        <Notice>
          This is out of stock, so it cannot be ordered right now. Everything else in the catalogue is unaffected.
        </Notice>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Quantity" required className="sm:col-span-2">
              {(p) => (
                <TextInput
                  {...p}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={stock ?? undefined}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="max-w-[8rem]"
                />
              )}
            </Field>

            <Field label="Street address" required span={2}>
              {(p) => (
                <TextInput
                  {...p}
                  name="streetAddress"
                  autoComplete="address-line1"
                  placeholder="House / unit number, street, barangay"
                  value={address.streetAddress}
                  onChange={set('streetAddress')}
                />
              )}
            </Field>

            <Field label="City" required>
              {(p) => (
                <TextInput
                  {...p}
                  name="city"
                  autoComplete="address-level2"
                  placeholder="City or municipality"
                  value={address.city}
                  onChange={set('city')}
                />
              )}
            </Field>

            <Field label="Province" required>
              {(p) => (
                <TextInput
                  {...p}
                  name="province"
                  autoComplete="address-level1"
                  value={address.province}
                  onChange={set('province')}
                />
              )}
            </Field>

            {/* Four digits, and the pattern says so before the server has to.
                inputMode="numeric" rather than type="number" — a ZIP is a
                label, not a quantity, and spinner arrows on one are nonsense. */}
            <Field label="Phone number" required span={2} hint="We call to confirm the order before any payment.">
              {(p) => (
                <TextInput
                  {...p}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="09XX XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              )}
            </Field>

            <Field
              label="Anything we should know?"
              span={2}
              hint="Roof type, existing system, or the time of day you can take a call. It makes the call shorter."
            >
              {(p) => (
                <Textarea {...p} rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
              )}
            </Field>

            <Field label="ZIP code" required hint="Four digits.">
              {(p) => (
                <TextInput
                  {...p}
                  name="postalCode"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  pattern="\d{4}"
                  maxLength={4}
                  placeholder="6000"
                  value={address.postalCode}
                  onChange={set('postalCode')}
                />
              )}
            </Field>

          </div>

          {stock != null && quantity > stock && (
            <div className="mt-6">
              <Notice>Only {stock} in stock. Lower the quantity to continue.</Notice>
            </div>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            <Button type="submit" size="lg" disabled={stock != null && quantity > stock} className="flex-1">
              Checkout
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={(stock != null && quantity > stock) || cartStatus === 'adding'}
              onClick={addToCartNow}
            >
              {cartStatus === 'adding' ? (
                <SpinnerIcon className="h-4 w-4" />
              ) : cartStatus === 'added' ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <CartIcon className="h-4 w-4" />
              )}
              {cartStatus === 'added' ? 'Added' : 'Add to cart'}
            </Button>
          </div>

          {cartError && (
            <div className="mt-4">
              <Notice>{cartError}</Notice>
            </div>
          )}

          <p className="text-ink-soft mt-4 text-xs leading-relaxed">
            Nothing is charged yet. The next screen shows the full total, including {Math.round(VAT_RATE * 100)} %
            VAT, before you commit to it.
          </p>
        </>
      )}
    </form>
  )
}
