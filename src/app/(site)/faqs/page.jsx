import { ArrowLink, Eyebrow, Lede, Rule, SectionHeading } from '@/components/ui.jsx'
import { ChevronDownIcon } from '@/components/icons.jsx'

export const metadata = {
  title: 'FAQs — VIP Solar',
  description:
    'Answers on pricing and VAT, payment and delivery, installer trade accounts and verification, and the warranty that comes with VIP inverters and batteries.',
}

/**
 * The questions that arrive most often, answered where somebody can read them
 * without waiting for a reply.
 *
 * Every answer here is the same rule the rest of the site enforces rather than
 * a friendlier restatement of it — the VAT line matches @/utils/pricing, the
 * warranty and verification answers match the terms in LegalDialog, and the
 * payment methods match the ones the checkout actually offers. A help page
 * that drifts from the system it describes is worse than no help page: it
 * gets quoted back at you.
 */
const SECTIONS = [
  {
    id: 'pricing',
    eyebrow: 'Pricing',
    heading: 'Prices and payment',
    questions: [
      {
        q: 'Do the prices include VAT?',
        a: 'No. Every price on the site is VAT-exclusive, and 12% VAT is added at checkout. The order summary shows the subtotal, the VAT and the total separately before you commit to anything, so the figure you agree to is the figure you pay.',
      },
      {
        q: 'A product says "Price on request" — why can I not order it?',
        a: 'That line is in the catalogue with its full specification and datasheet, but its price has not been set yet. Nothing is hidden from you: you can read everything about the product, and we will quote it — including delivery, and installation if you need it — if you ask through Customer support.',
      },
      {
        q: 'How can I pay?',
        a: 'GCash, QR Ph, or a PesoNet bank transfer. You choose the method on the product page before the order is placed.',
      },
      {
        q: 'Can I get a refund?',
        a: 'No. There are no refunds once an order is placed, and this is why the checkout asks you to tick a box that states both the exact amount and the no-refund rule before it will take the order. Check the quantity and the delivery address carefully before you confirm.',
      },
      {
        q: 'When is delivery arranged?',
        a: 'After payment clears. For a multi-unit or commercial order, or anything that needs to be quoted together with installation, talk to us first rather than ordering through the site.',
      },
    ],
  },
  {
    id: 'installers',
    eyebrow: 'Trade',
    heading: 'Installer accounts',
    questions: [
      {
        q: 'What does an installer account get me?',
        a: 'Trade pricing on the catalogue, and advance-replacement RMA — a replacement unit ships before the faulty one comes back, so a customer is not left without power while a claim is assessed.',
      },
      {
        q: 'How is trade pricing shown?',
        a: 'The list price stays on screen with a line through it and the trade price sits beside it, so you can always see what the discount is. A product with no trade price set is simply never discounted.',
      },
      {
        q: 'How do I get verified?',
        a: 'Register as an installer and upload your business registration, contractor licence and proof of insurance. They must be current and issued in the name of the company on the account. Verification is a manual review, not an automatic check.',
      },
      {
        q: 'What happens to the documents I upload?',
        a: 'They are used for one thing: confirming the account belongs to a real installer. Access is limited to the verification team, they are never shown to other customers, never used for marketing and never sold. They are deleted twelve months after the licence they show expires.',
      },
    ],
  },
  {
    id: 'warranty',
    eyebrow: 'Equipment',
    heading: 'Warranty and specifications',
    questions: [
      {
        q: 'What warranty comes with the equipment?',
        a: 'Ten years on inverters and five years on accessories, both counted from the date of dispatch rather than the date of installation.',
      },
      {
        q: 'What could invalidate a claim?',
        a: 'Cover depends on two things: the unit being installed by a qualified electrician in line with the product manual, and the unit staying inside its published operating envelope. Both are in the datasheet on each product page.',
      },
      {
        q: 'Where do I find the full specification?',
        a: 'Every product page carries the complete specification table transcribed from the manufacturer datasheet, plus links to the original datasheet and user manual as PDFs. Those link to HYXiPOWER’s own files rather than copies hosted here, so a revision upstream cannot leave this page quoting last year’s numbers.',
      },
      {
        q: 'Does the monitoring portal come with a guarantee?',
        a: 'No. It is a convenience layer rather than a safety system, and it is provided as it stands without an uptime guarantee. The inverter runs independently of it — if the portal is down, your system is not.',
      },
    ],
  },
  {
    id: 'account',
    eyebrow: 'Account',
    heading: 'Your account and data',
    questions: [
      {
        q: 'Can several people share one account?',
        a: 'No — one account per person. Anything done through your account is treated as done by you, so keep your credentials to yourself.',
      },
      {
        q: 'Can I get a copy of my data, or have it deleted?',
        a: 'Yes. You can ask for a copy of what we hold, have it corrected, or have it deleted where we are not required by law to keep it. Account and order records are kept while the account is open and for six years after, which is what tax and warranty obligations require.',
      },
    ],
  },
]

/**
 * One question. A native <details> rather than a state-driven panel: the open
 * and closed behaviour, the keyboard handling and the screen-reader semantics
 * all come from the platform, it works before — and without — JavaScript, and
 * a browser's own in-page find can open a closed answer to reach a match
 * inside it. Nothing hand-rolled does that last part.
 */
function Question({ q, a }) {
  return (
    <details className="group border-rule bg-glare rounded-row mb-2 border px-4 open:shadow-[0_1px_0_0_rgba(11,31,56,0.04)]">
      <summary className="text-ink hover:text-cool-600 flex cursor-pointer list-none items-start justify-between gap-6 py-4 text-[0.9375rem] font-medium transition-colors [&::-webkit-details-marker]:hidden">
        {q}
        <ChevronDownIcon
          aria-hidden="true"
          className="text-ink-soft mt-0.5 h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <p className="text-ink-soft max-w-measure pb-6 text-sm leading-relaxed">{a}</p>
    </details>
  )
}

export default function FaqsPage() {
  return (
    <main id="content" className="pt-nav">
      <section className="band-sheet rail py-20 lg:py-28">
        <div className="rail-inner">
          <Eyebrow>Help</Eyebrow>
          <SectionHeading className="mt-6">Frequently asked questions</SectionHeading>
          <Lede className="mt-6">
            Pricing, delivery, trade accounts and warranty — the things worth knowing before you order, rather than
            after.
          </Lede>

          {/* A jump list rather than a sidebar: there are four groups, and a
              persistent rail for four links costs more room than it saves. */}
          <nav aria-label="Sections" className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="text-ink-soft hover:text-ink border-b border-current/40 pb-px text-sm font-medium transition-colors hover:border-current"
              >
                {section.heading}
              </a>
            ))}
          </nav>

          <div className="mt-16 grid gap-16">
            {SECTIONS.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-nav">
                <Eyebrow>{section.eyebrow}</Eyebrow>
                <h2 className="display-wide text-display-3 text-ink mt-4 font-semibold">{section.heading}</h2>

                <div className="mt-8">
                  {section.questions.map((question) => (
                    <Question key={question.q} {...question} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Rule className="mt-20" />

          {/* The honest ending for a help page: it does not cover everything,
              and the next step should not be a hunt for where to ask. */}
          <div className="mt-10">
            <h2 className="display-wide text-display-3 text-ink font-semibold">Still stuck?</h2>
            <p className="text-ink-soft max-w-measure mt-4 text-sm leading-relaxed">
              Sign in and use the support button in the corner of any page — it reaches us with your account attached,
              so nobody has to ask who you are first. Or email{' '}
              <a href="mailto:jmcsolarph@gmail.com" className="text-ink font-mono underline underline-offset-2">
                jmcsolarph@gmail.com
              </a>
              .
            </p>

            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <ArrowLink href="/products">Products and pricing</ArrowLink>
              <ArrowLink href="/#sizing">Size a system</ArrowLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
