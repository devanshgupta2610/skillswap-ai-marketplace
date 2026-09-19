import clsx from 'clsx'
import type { BookingStatus } from '@/types'

const STEPS: BookingStatus[] = ['pending', 'accepted', 'in_progress', 'submitted', 'completed']

export function BookingStepper({ status }: { status: BookingStatus }) {
  const current = STEPS.indexOf(status)
  const terminal = status === 'cancelled' || status === 'declined'

  if (terminal) {
    return <p className="text-xs capitalize text-danger">{status}</p>
  }

  return (
    <ol className="grid grid-cols-5 gap-1">
      {STEPS.map((step, index) => (
        <li key={step} className="text-center">
          <div
            className={clsx(
              'h-1.5 rounded-full',
              index <= current ? 'bg-accent' : 'bg-white/10',
            )}
          />
          <p
            className={clsx(
              'mt-1 hidden truncate text-[10px] capitalize sm:block',
              index <= current ? 'text-accent' : 'text-text-muted',
            )}
          >
            {step.replace('_', ' ')}
          </p>
        </li>
      ))}
    </ol>
  )
}
