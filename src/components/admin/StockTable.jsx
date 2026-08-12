'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, cx } from '../ui.jsx'
import { AlertIcon, CheckIcon, SpinnerIcon } from '../icons.jsx'
import { setStockBulk } from '@/app/actions/catalogue'

/** Below this, the row starts saying so rather than waiting to be read. */
const LOW = 3

const when = (iso) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

/**
 * The stock count.
 *
 * Edited as a sheet and saved in one press, not row by row. Counting stock is
 * one walk down the shelves, and a page that demanded a save after every
 * number would be a page that gets half-filled and abandoned.
 *
 * Rows that have not been touched are not sent at all, so a save is only ever
 * as large as the change.
 */
export default function StockTable({ products }) {
  const router = useRouter()
  const [draft, setDraft] = useState(() => Object.fromEntries(products.map((p) => [p.model, String(p.stock ?? 0)])))
  const [status, setStatus] = useState('idle')
  const [failure, setFailure] = useState('')
  const [saved, setSaved] = useState(0)

  const dirty = useMemo(
    () => products.filter((p) => draft[p.model] !== String(p.stock ?? 0)),
    [products, draft],
  )

  const invalid = useMemo(
    () => dirty.filter((p) => !/^\d+$/.test(String(draft[p.model] ?? '').trim())),
    [dirty, draft],
  )

  const set = (model) => (e) => {
    const { value } = e.target
    setDraft((d) => ({ ...d, [model]: value }))
    setSaved(0)
    setFailure('')
  }

  const save = async () => {
    if (!dirty.length || invalid.length) return

    setStatus('saving')
    setFailure('')

    const result = await setStockBulk(dirty.map((p) => ({ model: p.model, stock: Number(draft[p.model]) })))
    setStatus('idle')

    if (result?.error) {
      setFailure(result.error)
      return
    }

    if (result.failed?.length) {
      setFailure(result.failed.map((f) => `${f.model}: ${f.error}`).join(' · '))
      return
    }

    setSaved(dirty.length)
    // The row values this page compares against are server-rendered, so they
    // have to come back changed or every row would still read as dirty.
    router.refresh()
  }

  const revert = () => {
    setDraft(Object.fromEntries(products.map((p) => [p.model, String(p.stock ?? 0)])))
    setFailure('')
    setSaved(0)
  }

  return (
    <>
      <div className="border-rule bg-glare mt-8 overflow-x-auto border">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <thead>
            <tr className="border-rule border-b">
              {['Product', 'Model', 'Series', 'Last updated', 'In stock'].map((head) => (
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
                const value = draft[product.model] ?? ''
                const bad = value.trim() !== '' && !/^\d+$/.test(value.trim())
                const changed = value !== String(product.stock ?? 0)
                const low = Number(product.stock ?? 0) <= LOW

                return (
                  <tr key={product.model} className="border-rule border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.photo && (
                          <img src={product.photo} alt="" loading="lazy" className="h-9 w-9 shrink-0 object-contain" />
                        )}
                        <span className="text-ink text-sm">{product.name || '—'}</span>
                      </div>
                    </td>
                    <td className="text-ink px-4 py-3 font-mono text-xs font-medium">{product.model}</td>
                    <td className="text-ink-soft px-4 py-3 text-sm">{product.family || '—'}</td>
                    <td className="text-ink-soft px-4 py-3 font-mono text-xs">
                      {when(product.updated_at)}
                      {low && !changed && (
                        <span className="text-hot-600 ml-2 font-sans text-[11px] font-medium">low</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <label className="sr-only" htmlFor={`stock-${product.model}`}>
                        Stock for {product.model}
                      </label>
                      <input
                        id={`stock-${product.model}`}
                        inputMode="numeric"
                        value={value}
                        onChange={set(product.model)}
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
