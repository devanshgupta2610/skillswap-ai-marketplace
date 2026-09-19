import clsx from 'clsx'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Input({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-left">
      {label && <span className="text-sm text-text-muted">{label}</span>}
      <input
        className={clsx(
          'w-full rounded-xl border border-border bg-white/5 px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/60 outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20',
          className,
        )}
        {...props}
      />
    </label>
  )
}

export function Textarea({
  label,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-left">
      {label && <span className="text-sm text-text-muted">{label}</span>}
      <textarea
        className={clsx(
          'min-h-28 w-full rounded-xl border border-border bg-white/5 px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/60 outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20',
          className,
        )}
        {...props}
      />
    </label>
  )
}

export function Select({
  label,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-left">
      {label && <span className="text-sm text-text-muted">{label}</span>}
      <select
        className={clsx(
          'w-full rounded-xl border border-border bg-[#12121a] px-3.5 py-2.5 text-sm text-text outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}
