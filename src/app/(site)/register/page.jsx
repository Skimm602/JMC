import Registration from '@/components/Registration.jsx'

export const metadata = {
  title: 'Register — VIP Solar installer program',
  description:
    'Register as a VIP Solar installer partner: trade pricing, technical support and warranty handling for certified installers.',
}

/**
 * The form gets its own route because it is a task, not a section: arriving
 * here means having decided, and everything that was scrolling past it on the
 * way down is exactly what a person filling it in does not need.
 *
 * `pt-nav` is the only layout this page adds — the section already carries the
 * band and the rail, and the header is fixed over both.
 */
export default function RegisterPage() {
  return (
    <main id="content" className="pt-nav">
      <Registration />
    </main>
  )
}
