/**
 * The support form's limits, in one place because both ends need them.
 *
 * A `'use server'` module may only export async functions, so these cannot
 * live next to the action that enforces them — and the field counter has to
 * agree with the server anyway, or the form counts a customer down to zero
 * and then rejects them for a limit it never showed.
 *
 * The browser's copy is a courtesy. The action re-checks every one of these
 * against what actually arrives.
 */

/** Long enough for a real problem, short enough that a pasted log file is
    turned away here rather than by Gmail. */
export const MESSAGE_LIMIT = 4000

/** A subject line, not a summary. Anything longer is truncated by the mail
    client anyway. */
export const SUBJECT_LIMIT = 120

/** Below this, a request costs the back office a round trip to find out what
    is actually wrong. */
export const MESSAGE_MINIMUM = 10
