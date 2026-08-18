import { cx } from './ui.jsx'
import { CheckIcon } from './icons.jsx'

/**
 * Where an order has got to, drawn the way the energy-flow diagram draws a
 * circuit.
 *
 * The site already has a visual language for "something moving along a
 * path" — the dashed current running between the array, the inverter and the
 * grid. An order is the same shape of idea, so it borrows the same drawing
 * rather than inventing a second one: settled stages are solid line, the leg
 * being travelled right now has the current running through it, and the rest
 * is faint and still.
 *
 * That mapping is the whole point of the animation. It is not decoration —
 * the one moving segment is the answer to "what is happening to my order",
 * readable without reading a word.
 */

/**
 * The lifecycle a customer actually experiences, which is shorter than the
 * one the database keeps: `paid` and `processing` are both "we have your
 * money and are getting it ready", and splitting them would ask the customer
 * to care about a distinction that is ours.
 */
const STAGES = [
  { id: 'ordered', label: 'Ordered', statuses: [] },
  { id: 'confirming', label: 'Awaiting confirmation', statuses: ['pending', 'pending_bank_transfer'] },
  { id: 'payment', label: 'Awaiting payment', statuses: ['approved'] },
  { id: 'processing', label: 'Processing', statuses: ['paid', 'processing'] },
  { id: 'shipped', label: 'Shipped', statuses: ['shipped'] },
  { id: 'received', label: 'Received', statuses: ['completed'] },
]

/** Which stage the order is standing on. Ordered is always behind you — the
    order exists, so that step happened by definition. */
function stageIndexFor(status) {
  const found = STAGES.findIndex((stage) => stage.statuses.includes(status))
  return found === -1 ? 0 : found
}

export default function OrderFlow({ status }) {
  // A cancelled order is not partway along this path, it is off it. Drawing
  // it as a progress bar frozen somewhere would suggest it might still move.
  if (status === 'cancelled') {
    return (
      <p className="border-hot-600/45 bg-hot-600/[0.06] text-hot-700 rounded-row border px-3.5 py-2.5 text-xs">
        This order was cancelled. Nothing further will happen to it.
      </p>
    )
  }

  const current = stageIndexFor(status)
  const finished = status === 'completed'

  return (
    <ol
      aria-label="Order progress"
      className="flex flex-col gap-0 sm:flex-row sm:items-start"
    >
      {STAGES.map((stage, i) => {
        const done = i < current || finished
        const active = i === current && !finished

        return (
          <li key={stage.id} className="flex gap-3 sm:flex-1 sm:flex-col sm:gap-0">
            {/* --------------------------- the marker -------------------------- */}
            <div className="flex flex-col items-center sm:w-full sm:flex-row">
              {/* The leg arriving at this stage. Hidden on the first, which
                  has nothing behind it to travel from. */}
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={cx(
                    'hidden h-px flex-1 sm:block',
                    done ? 'text-cool-600 flow-done' : active ? 'text-cool-600 flow-dash' : 'text-hush flow-todo',
                  )}
                />
              )}

              <span
                aria-hidden="true"
                className={cx(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors duration-300',
                  done
                    ? 'border-cool-600 bg-cool-600 text-glare'
                    : active
                      ? 'border-cool-600 text-cool-600 bg-glare'
                      : 'border-hush text-hush bg-glare',
                )}
              >
                {done ? (
                  <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
                ) : (
                  <span className={cx('h-1.5 w-1.5 rounded-full', active ? 'bg-cool-600' : 'bg-hush')} />
                )}
              </span>

              {i < STAGES.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cx(
                    'hidden h-px flex-1 sm:block',
                    i < current || finished
                      ? 'text-cool-600 flow-done'
                      : i === current && !finished
                        ? 'text-cool-600 flow-dash'
                        : 'text-hush flow-todo',
                  )}
                />
              )}

              {/* The vertical run, for the stacked layout on a phone. */}
              {i < STAGES.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cx(
                    'w-px flex-1 sm:hidden',
                    done ? 'bg-cool-600' : 'bg-hush/50',
                    'min-h-7',
                  )}
                />
              )}
            </div>

            {/* --------------------------- the label --------------------------- */}
            <p
              className={cx(
                'pb-6 text-xs leading-relaxed sm:pb-0 sm:pt-3 sm:text-center',
                active ? 'text-ink font-medium' : done ? 'text-ink-soft' : 'text-hush',
              )}
            >
              {stage.label}
              {active && <span className="sr-only"> — current stage</span>}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
