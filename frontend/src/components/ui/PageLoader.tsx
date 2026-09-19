export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
    </div>
  )
}

export function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
    </div>
  )
}
