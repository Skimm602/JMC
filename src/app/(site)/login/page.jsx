import LoginCard from '@/components/LoginCard.jsx'
import { Eyebrow, Rule, SectionHeading } from '@/components/ui.jsx'
import { CheckIcon, ShieldIcon } from '@/components/icons.jsx'

export const metadata = {
  title: 'Log in — VIP Solar',
  description: 'Log in to your VIP Solar account for datasheets, firmware, monitoring and ordering.',
}

/**
 * Registration ends here rather than on a receipt: an account that exists but
 * has never been logged into is a dead end, so the last step of signing up is
 * the first step of using it.
 *
 * The two notices are driven by query parameters because the page that sets
 * them is a different document — a redirect cannot carry component state.
 */
export default async function LoginPage({ searchParams }) {
  const params = await searchParams
  const justRegistered = params?.registered === '1'
  const needsVerification = params?.verify === '1'

  return (
    <main id="content" className="pt-nav">
      <section className="band-sheet rail py-24 lg:py-32 xl:py-40">
        <div className="rail-inner grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow>Account access</Eyebrow>
            <SectionHeading className="mt-6">Log in</SectionHeading>
            <p className="text-ink-soft mt-6 leading-relaxed">
              One account covers datasheets, firmware, monitoring and ordering. Installer accounts see trade pricing
              once verification clears.
            </p>

            <Rule className="my-8" />

            <div className="border-rule flex gap-3 border p-4">
              <ShieldIcon className="text-cool-600 h-5 w-5 shrink-0" />
              <p className="text-ink-soft text-xs leading-relaxed">
                Sessions are held in a signed cookie and expire on their own. Log out from any device and the rest stay
                as they were.
              </p>
            </div>
          </div>

          <LoginCard
            footer={
              <p className="border-rule text-ink-soft mt-8 border-t pt-6 text-sm">
                No account yet?{' '}
                <a
                  href="/register"
                  className="text-ink border-b border-current/40 pb-px font-medium transition-colors hover:border-current"
                >
                  Create one
                </a>
              </p>
            }
          >
            {justRegistered && (
              <div className="border-cool-600/40 bg-cool-600/[0.06] mb-8 flex items-start gap-3 border px-4 py-3.5">
                <CheckIcon className="text-cool-600 mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} />
                <div className="text-sm leading-relaxed">
                  <p className="text-ink font-medium">Your account has been created.</p>
                  <p className="text-ink-soft mt-1">
                    {needsVerification
                      ? 'Confirm your email, then log in here to finish submitting your verification documents.'
                      : 'Log in below to continue. A confirmation email is on its way.'}
                  </p>
                </div>
              </div>
            )}

          </LoginCard>
        </div>
      </section>
    </main>
  )
}
