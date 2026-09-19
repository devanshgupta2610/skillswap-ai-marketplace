export function SkillChips({ value }: { value?: string | null }) {
  if (!value) return null
  const chips = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8)
  if (!chips.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span key={chip} className="rounded-lg bg-accent-soft px-2 py-0.5 text-xs text-accent">
          {chip}
        </span>
      ))}
    </div>
  )
}
