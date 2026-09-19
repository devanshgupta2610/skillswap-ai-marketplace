import clsx from 'clsx'
import type { ReactNode } from 'react'

export function Card({
  children,
  className,
  hover,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div
      className={clsx(
        'glass rounded-2xl p-5',
        hover && 'transition hover:border-accent/30 hover:shadow-accent/10',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <Card>
      <p className="text-sm text-text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-text">{value}</p>
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </Card>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />
}

export function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'accent'
}) {
  return (
    <span
      className={clsx('inline-flex rounded-lg px-2 py-0.5 text-xs font-medium capitalize', {
        'bg-white/10 text-text-muted': tone === 'default',
        'bg-success/15 text-success': tone === 'success',
        'bg-warning/15 text-warning': tone === 'warning',
        'bg-accent-soft text-accent': tone === 'accent',
      })}
    >
      {children}
    </span>
  )
}
