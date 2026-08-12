'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, cx } from '../ui.jsx'
import { AlertIcon, CheckIcon, SpinnerIcon, XIcon } from '../icons.jsx'
import { createProduct, deleteProduct, setStockBulk } from '@/app/actions/catalogue'

/** Below this, the row starts saying so rather than waiting to be read. */
const LOW = 3

const when = (iso) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

const peso = (n) =>
  n == null ? '—' : new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n))

/* -------------------------------- add product ------------------------------ */

/** Plain file input styled to match the text fields around it. */
function FileField({ label, name, accept }) {
  return (
    <label className="grid gap-1.5">
      <span className="label text-ink-soft">{label}</span>
      <input
        type="file"
        name={name}
        accept={accept}
        className="border-rule-strong bg-glare text-ink file:text-cool-600 file:mr-3 file:border-0 file:bg-transparent file:text-xs file:font-medium border px-3 py-2 text-xs outline-none"
      />
    </label>
  )
}

function AddProduct({ onAdded }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    setStatus('saving')
    setError('')

    const result = await createProduct(new FormData(form))
    setStatus('idle')

    if (result?.error) {
      setError(result.error)
      return
    }

    form.reset()
    setOpen(false)
    onAdded()
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Add product
      </Button>
    )
  }

  return (
    <form onSubmit={submit} className="border-rule bg-glare animate-reveal grid gap-3 border p-5 sm:grid-cols-2">
      <label className="grid gap-1.5 sm:col-span-2">
        <span className="label text-ink-soft">Name</span>
        <input
          required
          name="name"
          className="border-rule-strong bg-glare text-ink focus:border-ink border px-3 py-2 text-sm outline-none"
        />
      </label>
      <label className="grid gap-1.5">
        <span className="label text-ink-soft">Retail price</span>
        <input
          required
          inputMode="decimal"
          name="retail_price"
          className="border-rule-strong bg-glare text-ink focus:border-ink border px-3 py-2 text-sm outline-none"
        />
      </label>
      <label className="grid gap-1.5">
        <span className="label text-ink-soft">Installer price (optional)</span>
        <input
          inputMode="decimal"
          name="installer_price"
          className="border-rule-strong bg-glare text-ink focus:border-ink border px-3 py-2 text-sm outline-none"
        />
      </label>
      <label className="grid gap-1.5">
        <span className="label text-ink-soft">Starting stock</span>
        <input
          inputMode="numeric"
          name="stock_quantity"
          defaultValue="0"
          className="border-rule-strong bg-glare text-ink focus:border-ink border px-3 py-2 text-sm outline-none"
        />
      </label>

      <FileField label="Image (optional)" name="image" accept="image/*" />
      <FileField label="Datasheet PDF (optional)" name="datasheet" accept="application/pdf" />
      <FileField label="User manual PDF (optional)" name="manual" accept="application/pdf" />

      {error && (
        <p role="alert" className="text-hot-600 sm:col-span-2 flex items-start gap-1.5 text-xs leading-relaxed">
          <AlertIcon className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 sm:col-span-2">
        <Button size="sm" disabled={status === 'saving'}>
          {status === 'saving' ? (
            <>
              <SpinnerIcon className="h-3.5 w-3.5" />
              Adding…
            </>
          ) : (
            'Add to catalogue'
          )}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={status === 'saving'}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

/* ---------------------------------- remove --------------------------------- */

function RemoveProduct({ product, onRemoved }) {
  const [confirming, setConfirming] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const remove = async () => {
    setStatus('removing')
    setError('')
    const result = await deleteProduct(product.id)
    setStatus('idle')
    if (result?.error) {
      setError(result.error)
      return
    }
    setConfirming(false)
    onRemoved(result.deactivated ? `${product.name} has order history — deactivated instead of deleted.` : null)
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Remove ${product.name}`}
        className="text-ink-soft hover:text-hot-600 p-1.5 transition-colors"
      >
        <XIcon className="h-4 w-4" />
      </button>
    )
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && (
        <p role="alert" className="text-hot-600 text-xs">
          {error}
        </p>
      )}
      <Button variant="hot" size="sm" onClick={remove} disabled={status === 'removing'}>
        {status === 'removing' ? <SpinnerIcon className="h-3.5 w-3.5" /> : 'Remove'}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={status === 'removing'}>
        Keep
      </Button>
    </div>
  )
}

/* --------------------------------- screen --------------------------------- */

/**
 * The catalogue: stock counts edited as a sheet and saved in one press (not
 * row by row — counting stock is one walk down the shelves), plus adding and
 * removing products.
 *
 * Rows that have not been touched are not sent at all, so a save is only
 * ever as large as the change.
 */
export default function StockTable({ products }) {
  const router = useRouter()
  const [draft, setDraft] = useState(() => Object.fromEntries(products.map((p) => [p.id, String(p.stock_quantity ?? 0)])))
  const [status, setStatus] = useState('idle')
  const [failure, setFailure] = useState('')
  const [notice, setNotice] = useState('')
  const [saved, setSaved] = useState(0)

  const dirty = useMemo(
    () => products.filter((p) => draft[p.id] !== String(p.stock_quantity ?? 0)),
    [products, draft],
  )

  const invalid = useMemo(
    () => dirty.filter((p) => !/^\d+$/.test(String(draft[p.id] ?? '').trim())),
    [dirty, draft],
  )

  const set = (id) => (e) => {
    const { value } = e.target
    setDraft((d) => ({ ...d, [id]: value }))
    setSaved(0)
    setFailure('')
  }

  const save = async () => {
    if (!dirty.length || invalid.length) return

    setStatus('saving')
    setFailure('')

    const result = await setStockBulk(dirty.map((p) => ({ id: p.id, stock: Number(draft[p.id]) })))
    setStatus('idle')

    if (result?.error) {
      setFailure(result.error)
      return
    }

    if (result.failed?.length) {
      setFailure(result.failed.map((f) => `${f.id}: ${f.error}`).join(' · '))
      return
    }

    setSaved(dirty.length)
    router.refresh()
  }

  const revert = () => {
    setDraft(Object.fromEntries(products.map((p) => [p.id, String(p.stock_quantity ?? 0)])))
    setFailure('')
    setSaved(0)
  }

  const refresh = (message) => {
    setNotice(message ?? '')
    router.refresh()
  }

  return (
    <>
      <div className="mt-8">
        <AddProduct onAdded={() => refresh('Product added.')} />
      </div>

      {notice && (
        <p className="border-cool-600/40 bg-cool-600/[0.06] text-ink animate-reveal mt-4 flex items-center gap-2.5 border px-3.5 py-3 text-sm">
          <CheckIcon className="text-cool-600 h-4 w-4 shrink-0" strokeWidth={2.2} />
          {notice}
        </p>
      )}

      <div className="border-rule bg-glare mt-4 overflow-x-auto border">
        <table className="w-full min-w-[44rem] border-collapse text-left">
          <thead>
            <tr className="border-rule border-b">
              {['Product', 'Retail price', 'Last updated', 'In stock', ''].map((head) => (
                <th key={head} className={cx('label text-ink-soft px-4 py-3 font-medium', head === 'In stock' && 'text-right')}>
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-ink-soft px-4 py-12 text-center text-sm">
                  No products in the catalogue yet.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const value = draft[product.id] ?? ''
                const bad = value.trim() !== '' && !/^\d+$/.test(value.trim())
                const changed = value !== String(product.stock_quantity ?? 0)
                const low = Number(product.stock_quantity ?? 0) <= LOW

                return (
                  <tr key={product.id} className={cx('border-rule border-b last:border-b-0', !product.is_active && 'opacity-50')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <img src={product.image_url} alt="" loading="lazy" className="h-9 w-9 shrink-0 object-contain" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-ink text-sm">{product.name || '—'}</span>
                            {!product.is_active && <span className="label text-ink-soft">discontinued</span>}
                          </div>
                          {(product.datasheet_url || product.manual_url) && (
                            <div className="mt-1 flex gap-3">
                              {product.datasheet_url && (
                                <a
                                  href={product.datasheet_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cool-600 hover:underline text-xs"
                                >
                                  Datasheet
                                </a>
                              )}
                              {product.manual_url && (
                                <a
                                  href={product.manual_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cool-600 hover:underline text-xs"
                                >
                                  User manual
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-ink-soft px-4 py-3 font-mono text-xs">{peso(product.retail_price)}</td>
                    <td className="text-ink-soft px-4 py-3 font-mono text-xs">
                      {when(product.created_at)}
                      {low && !changed && (
                        <span className="text-hot-600 ml-2 font-sans text-[11px] font-medium">low</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <label className="sr-only" htmlFor={`stock-${product.id}`}>
                        Stock for {product.name}
                      </label>
                      <input
                        id={`stock-${product.id}`}
                        inputMode="numeric"
                        value={value}
                        onChange={set(product.id)}
                        aria-invalid={bad || undefined}
                        disabled={status === 'saving'}
                        className={cx(
                          'w-24 border px-3 py-2 text-right font-mono text-sm tabular-nums transition-colors outline-none',
                          bad
                            ? 'border-hot-600 bg-glare text-ink'
                            : changed
                              ? 'border-cool-600 bg-cool-600/[0.06] text-ink'
                              : 'border-rule-strong bg-glare text-ink hover:border-ink-soft focus:border-ink',
                        )}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RemoveProduct product={product} onRemoved={refresh} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {failure && (
        <p
          role="alert"
          className="border-hot-600/40 bg-hot-600/[0.06] text-ink mt-6 flex items-start gap-2.5 border px-3.5 py-3 text-xs leading-relaxed"
        >
          <AlertIcon className="text-hot-600 mt-px h-3.5 w-3.5 shrink-0" />
          {failure}
        </p>
      )}

      {saved > 0 && (
        <p className="border-cool-600/40 bg-cool-600/[0.06] text-ink animate-reveal mt-6 flex items-center gap-2.5 border px-3.5 py-3 text-sm">
          <CheckIcon className="text-cool-600 h-4 w-4 shrink-0" strokeWidth={2.2} />
          {saved === 1 ? 'One stock level updated.' : `${saved} stock levels updated.`}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={!dirty.length || invalid.length > 0 || status === 'saving'}>
          {status === 'saving' ? (
            <>
              <SpinnerIcon className="h-4 w-4" />
              Saving…
            </>
          ) : dirty.length ? (
            `Save ${dirty.length} ${dirty.length === 1 ? 'change' : 'changes'}`
          ) : (
            'Save changes'
          )}
        </Button>

        {dirty.length > 0 && (
          <Button variant="ghost" onClick={revert} disabled={status === 'saving'}>
            Discard
          </Button>
        )}

        <p className="text-ink-soft ml-auto text-xs">
          {invalid.length
            ? 'Whole numbers only, zero or more.'
            : dirty.length
              ? 'Unsaved changes.'
              : 'Everything saved.'}
        </p>
      </div>
    </>
  )
}
