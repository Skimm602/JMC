'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui.jsx'
import { SpinnerIcon } from '../icons.jsx'
import { adminSignOut } from '@/app/actions/admin'

/**
 * The whole of the back office's navigation, because the back office is one
 * page. A sidebar with a single destination in it would be furniture.
 */
export default function AdminTopBar({ name, pending }) {
  const router = useRouter()
  const [status, setStatus] = useState('idle')

  const onSignOut = async () => {
    setStatus('submitting')
    await adminSignOut()
    router.refresh()
    router.replace('/admin/login')
  }

  return (
    <header className="band-pit border-rule-shade sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-14 max-w-[76rem] items-center gap-4 px-5 sm:px-8">
        <span className="font-display display-wide bg-glint text-pit rounded-[0.5rem] px-2.5 py-1 text-[0.9375rem] leading-none font-bold tracking-[0.02em]">
          VIP
        </span>
        <span className="label text-glint-soft hidden sm:inline">Back office</span>

        {pending > 0 && (
          <span className="border-hot-400/50 text-hot-400 label ml-1 rounded-full border px-2.5 py-1 tabular-nums">
            {pending} waiting
          </span>
        )}

        <span className="text-glint-soft ml-auto hidden truncate text-xs sm:inline">{name}</span>

        <Button variant="ghostShade" size="sm" onClick={onSignOut} disabled={status === 'submitting'}>
          {status === 'submitting' ? (
            <>
              <SpinnerIcon className="h-3.5 w-3.5" />
              Signing out…
            </>
          ) : (
            'Log out'
          )}
        </Button>
      </div>
    </header>
  )
}
