'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createOrder } from '@/app/actions/checkout'
import { clearCart, removeFromCart, updateCartItem } from '@/app/actions/cart'
import { formatPeso, VAT_RATE } from '@/utils/pricing'
import NoRefundsDialog from './NoRefundsDialog.jsx'
import { Checkbox, Field, Textarea, TextInput } from './form.jsx'
import { Button, Rule, cx } from './ui.jsx'
import { AlertIcon, ArrowRightIcon, CheckIcon, FileIcon, SpinnerIcon, XIcon } from './icons.jsx'

/**
 * The cart, checked out in two screens rather than one — the same shape
 * ProductCheckout uses for a single unit, extended to however many lines are
 * in it:
 *
 *   cart      every line, editable, plus the address and how it is paid for
 *   summary   the total, and the undertaking to pay it
 *   placed    the order reference
 *
 * Quantity and remove act straight on the database (updateCartItem /
 * removeFromCart) and then ask the server component above for a refresh
 * rather than keeping a second copy of the cart in state — the row a button
 * is on is the only thing that needs to know it is mid-request.
 *
 * createOrder() re-reads and re-prices every line itself before it
 * writes anything, the same as the single-product flow, so nothing pulled
 * from `data` here is trusted further than drawing the screen.
 */


const EMPTY_ADDRESS = { streetAddress: '', city: '', province: '', postalCode: '' }

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

export default function CartView({ data, signedIn }) {
  // Any line with no price yet. The confirmation call is where those figures
  // are agreed, so the cart still checks out — it just may not claim a total.
  const quotedCart = (data?.items ?? []).some((item) => !(Number(item.product?.retail_price) > 0))
  const router = useRouter()

  const [step, setStep] = useState('cart')
  const [address, setAddress] = useState(EMPTY_ADDRESS)
  // The confirmation call comes next, so the number to ring is asked for here
  // rather than looked up later.
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [agreementError, setAgreementError] = useState(null)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const [placed, setPlaced] = useState(null)
  const [rowPending, setRowPending] = useState({})
  const [rowError, setRowError] = useState({})
  const [refundWarningOpen, setRefundWarningOpen] = useState(false)

  const items = data?.items ?? []
  const unavailable = data?.unavailable ?? []
  const empty = items.length === 0 && unavailable.length === 0
  const overStock = items.some((item) => item.product.stock_quantity != null && item.quantity > item.product.stock_quantity)

  const set = (key) => (event) => setAddress((current) => ({ ...current, [key]: event.target.value }))

  const changeQuantity = async (item, next) => {
    setRowPending((p) => ({ ...p, [item.cartItemId]: true }))
    setRowError((p) => ({ ...p, [item.cartItemId]: null }))

    const result = await updateCartItem(item.product.id, next)
    setRowPending((p) => ({ ...p, [item.cartItemId]: false }))

    if (result?.error) {
      setRowError((p) => ({ ...p, [item.cartItemId]: result.error }))
      return
    }

    router.refresh()
  }

  const remove = async (productId, cartItemId) => {
    setRowPending((p) => ({ ...p, [cartItemId]: true }))
    const result = await removeFromCart(productId)
    setRowPending((p) => ({ ...p, [cartItemId]: false }))

    if (result?.error) {
      setRowError((p) => ({ ...p, [cartItemId]: result.error }))
      return
    }

    router.refresh()
  }

  const review = (event) => {
    event.preventDefault()
    setError(null)
    setRefundWarningOpen(true)
  }

  const place = async (event) => {
    event.preventDefault()

    if (!agreed) {
      setAgreementError('You have to accept this before the order can be placed.')
      return
    }

    setAgreementError(null)
    setError(null)
    setPending(true)

    // FormData rather than a plain object: a File cannot cross a
    // server-action boundary inside JSON.
    const payload = new FormData()
    payload.set('items', JSON.stringify(items.map((item) => ({ productId: item.product.id, quantity: item.quantity }))))
    payload.set('shipping', JSON.stringify(address))
    payload.set('phone', phone.trim())
    payload.set('note', note.trim())
    payload.set('acceptedTerms', 'true')

    const result = await createOrder(payload)

    if (result?.error) {
      setPending(false)
      setError(result.error)
      return
    }

    // The order now holds its own record of what was bought; nothing here
    // still needs to.
    await clearCart()
    setPending(false)
    setPlaced(result)
    setStep('placed')
    router.refresh()
  }

  /* ------------------------------- signed out ------------------------------ */

  if (!signedIn) {
    return (
      <div className="border-rule bg-glare rounded-panel max-w-md border p-6 sm:p-8">
        <p className="text-ink-soft text-sm leading-relaxed">
          Your cart is tied to your account, so it is there on whichever device you sign in on. Log in to see it.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button as={Link} href="/login">
            Log in
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
          <Button as={Link} href="/register" variant="outline">
            Create an account
          </Button>
        </div>
      </div>
    )
  }

  /* --------------------------------- placed -------------------------------- */

  if (step === 'placed') {
    return (
      <div className="border-cool-600/40 bg-cool-600/[0.05] animate-reveal rounded-panel max-w-xl border p-6 sm:p-8">
        <p className="text-ink flex items-center gap-2.5 font-medium">
          <CheckIcon className="text-cool-600 h-5 w-5 shrink-0" strokeWidth={2.4} />
          Order placed
        </p>

        <p className="text-ink-soft mt-4 text-sm leading-relaxed">
          Going to {address.city}, {address.province}. It stays unpaid until the{' '}
          team has called to confirm it and the payment has cleared, and nothing leaves the
          warehouse before then.
        </p>

        <Rule className="my-6" />

        <dl className="grid gap-3">
          <div className="flex items-baseline justify-between gap-6">
            <dt className="label text-ink-soft">Reference</dt>
            <dd className="text-ink font-mono text-xs break-all">{placed?.orderId}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-6">
            <dt className="label text-ink-soft">Total due</dt>
            <dd className="text-ink font-mono text-lg font-semibold tabular-nums">{formatPeso(placed?.total)}</dd>
          </div>
        </dl>

        <Button as={Link} href="/account/orders" className="mt-7 w-full">
          View it in purchase history
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  /* --------------------------------- empty ---------------------------------- */

  if (empty) {
    return (
      <div className="border-rule bg-glare flex flex-col items-center border border-dashed px-6 py-20 text-center">
        <FileIcon className="text-hush h-8 w-8" />
        <p className="text-ink-soft max-w-measure mt-5 text-sm leading-relaxed">Nothing in your cart yet.</p>
        <Button as={Link} href="/products" variant="outline" className="mt-6">
          Browse products
        </Button>
      </div>
    )
  }

  /* -------------------------------- summary -------------------------------- */

  if (step === 'summary') {
    return (
      <form onSubmit={place} className="border-rule bg-glare animate-reveal max-w-xl border p-6 sm:p-8">
        <p className="label text-ink-soft">Step 2 of 2</p>
        <h2 className="display-wide text-ink mt-2 text-xl font-semibold">What you are paying</h2>

        <div className="border-rule mt-6 border-t">
          {items.map((item) => (
            <Money key={item.cartItemId} label={item.product.name} note={`× ${item.quantity}`} value={item.lineTotal} />
          ))}

          {data.discount > 0 && <Money label="Installer discount" value={data.discount} sign="− " tone="cool" />}

          <Rule />

          <Money label="Subtotal" note="VAT-exclusive" value={data.subtotal} />
          <Money label={`VAT ${Math.round(VAT_RATE * 100)} %`} value={data.vat} sign="+ " />

          <Rule />

          <Money label="Total due" value={data.total} strong />
        </div>

        <Rule className="my-6" />

        <div>
          <p className="label text-ink-soft">Delivering to</p>
          <address className="text-ink mt-2 text-sm leading-relaxed not-italic">
            {address.streetAddress}
            <br />
            {address.city}, {address.province} {address.postalCode}
          </address>
        </div>

        <Rule className="my-6" />


        <Checkbox
          tone="hot"
          checked={agreed}
          onChange={(next) => {
            setAgreed(next)
            if (next) setAgreementError(null)
          }}
          error={agreementError}
          label={
            quotedCart
              ? 'I understand the price will be confirmed on the call before I pay anything.'
              : `I agree to pay ${formatPeso(data.total)} for this order.`
          }
          description="This amount is due in full and this sale is final — once the order is placed, payments are not refunded and equipment is not taken back. Check the address, the quantities and the total above before you continue."
        />

        {error && (
          <div className="mt-6">
            <Notice>{error}</Notice>
          </div>
        )}

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
              setStep('cart')
            }}
          >
            Back
          </Button>
        </div>
      </form>
    )
  }

  /* ---------------------------------- cart ---------------------------------- */

  return (
    <form onSubmit={review} className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start lg:gap-10">
      <NoRefundsDialog
        open={refundWarningOpen}
        onConfirm={() => {
          setRefundWarningOpen(false)
          setStep('summary')
        }}
        onClose={() => setRefundWarningOpen(false)}
      />

      <div className="border-rule bg-glare border">
        {items.map((item) => {
          const stock = item.product.stock_quantity
          const atMax = stock != null && item.quantity >= stock
          const busy = Boolean(rowPending[item.cartItemId])

          return (
            <div key={item.cartItemId} className="border-rule flex flex-wrap items-center gap-4 border-b p-4 last:border-b-0">
              <div className="bg-sheet flex h-16 w-16 shrink-0 items-center justify-center">
                {item.product.image_url ? (
                  <img src={item.product.image_url} alt="" className="h-full w-full object-contain" />
                ) : (
                  <FileIcon className="text-hush h-6 w-6" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.product.id}`}
                  className="text-ink hover:text-cool-600 block truncate text-sm font-medium transition-colors"
                >
                  {item.product.name}
                </Link>
                <p className="text-ink-soft mt-1 font-mono text-xs">{formatPeso(item.unitPrice)} each</p>
                {stock != null && item.quantity > stock && (
                  <p role="alert" className="text-hot-600 mt-1.5 text-xs">
                    Only {stock} in stock.
                  </p>
                )}
                {rowError[item.cartItemId] && (
                  <p role="alert" className="text-hot-600 mt-1.5 text-xs">
                    {rowError[item.cartItemId]}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeQuantity(item, item.quantity - 1)}
                  disabled={busy}
                  aria-label={`Fewer ${item.product.name}`}
                  className="border-rule-strong text-ink hover:border-ink grid h-8 w-8 place-items-center border transition-colors disabled:opacity-45"
                >
                  −
                </button>
                <span className="w-6 text-center font-mono text-sm tabular-nums">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => changeQuantity(item, item.quantity + 1)}
                  disabled={busy || atMax}
                  aria-label={`More ${item.product.name}`}
                  className="border-rule-strong text-ink hover:border-ink grid h-8 w-8 place-items-center border transition-colors disabled:opacity-45"
                >
                  +
                </button>
              </div>

              <p className="w-24 shrink-0 text-right font-mono text-sm font-medium tabular-nums">
                {formatPeso(item.lineTotal)}
              </p>

              <button
                type="button"
                onClick={() => remove(item.product.id, item.cartItemId)}
                disabled={busy}
                aria-label={`Remove ${item.product.name}`}
                className="text-ink-soft hover:text-hot-600 p-1.5 transition-colors"
              >
                {busy ? <SpinnerIcon className="h-4 w-4" /> : <XIcon className="h-4 w-4" />}
              </button>
            </div>
          )
        })}

        {unavailable.map((u) => (
          <div
            key={u.cartItemId}
            className="border-rule bg-hot-600/[0.04] flex items-center justify-between gap-4 border-b p-4 last:border-b-0"
          >
            <div>
              <p className="text-ink text-sm font-medium">{u.name}</p>
              <p className="text-hot-600 mt-1 text-xs">No longer available — remove it to check out.</p>
            </div>
            <button
              type="button"
              onClick={() => remove(u.productId, u.cartItemId)}
              disabled={rowPending[u.cartItemId]}
              aria-label={`Remove ${u.name}`}
              className="text-ink-soft hover:text-hot-600 p-1.5 transition-colors"
            >
              {rowPending[u.cartItemId] ? <SpinnerIcon className="h-4 w-4" /> : <XIcon className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>

      <div className="border-rule bg-glare lg:sticky lg:top-28 border p-6 sm:p-8">
        <p className="label text-ink-soft">Step 1 of 2</p>

        <div className="border-rule mt-4 border-t">
          <Money label="Subtotal" note="VAT-exclusive" value={data.subtotal} />
          {data.discount > 0 && <Money label="Installer discount" value={data.discount} sign="− " tone="cool" />}
          <Money label={`VAT ${Math.round(VAT_RATE * 100)} %`} value={data.vat} sign="+ " />
          <Rule />
          <Money label="Total due" value={data.total} strong />
        </div>

        <Rule className="my-6" />

        <div className="grid gap-5">
          <Field label="Street address" required>
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

          <div className="grid gap-5 sm:grid-cols-2">
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
                <TextInput {...p} name="province" autoComplete="address-level1" value={address.province} onChange={set('province')} />
              )}
            </Field>
          </div>

          <Field label="Phone number" required hint="We call to confirm the order before any payment.">
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
            hint="Roof type, existing system, or the time of day you can take a call."
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

        {overStock && (
          <div className="mt-6">
            <Notice>One or more items ask for more than is in stock. Lower the quantity to continue.</Notice>
          </div>
        )}

        {unavailable.length > 0 && (
          <div className="mt-6">
            <Notice>Remove what is no longer available before checking out.</Notice>
          </div>
        )}

        <Button type="submit" size="lg" disabled={overStock || unavailable.length > 0 || items.length === 0} className="mt-7 w-full">
          Checkout
          <ArrowRightIcon className="h-4 w-4" />
        </Button>

        <p className="text-ink-soft mt-4 text-xs leading-relaxed">
          Nothing is charged yet. The next screen shows the full total, including {Math.round(VAT_RATE * 100)} % VAT,
          before you commit to it.
        </p>
      </div>
    </form>
  )
}
