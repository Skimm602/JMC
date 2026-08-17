/**
 * The assistant chat's limits, in one place because both ends need them —
 * same reasoning as utils/support/limits.js.
 */

/** A question, not an essay — long enough for a real comparison request. */
export const MESSAGE_LIMIT = 2000

/** Below this there's nothing to answer. */
export const MESSAGE_MINIMUM = 2

/** How much of the conversation rides along on every turn. The API is
    stateless, so the whole thing is resent each time — this bounds how far
    back that goes before the oldest turns fall off. */
export const HISTORY_LIMIT = 20
