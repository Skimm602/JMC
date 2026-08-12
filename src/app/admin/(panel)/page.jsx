import { getPendingVerifications } from '@/app/actions/verification'
import ReviewQueue from '@/components/admin/ReviewQueue.jsx'

export const metadata = { title: 'Back office — verification' }

/**
 * The panel's front page. The gate and the rail live in the layout above, so
 * this is only the queue — and the queue is only what has not been decided
 * yet, because a page of finished work is a page nobody reads.
 */
export default async function VerificationPage() {
  const queue = await getPendingVerifications()

  return <ReviewQueue initialQueue={queue.data ?? []} />
}
