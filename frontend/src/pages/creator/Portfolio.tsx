import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { creatorApi } from '@/services/endpoints'
import { Badge, Card, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SkillChips } from '@/components/ui/SkillChips'
import { EmptyState } from '@/components/ui/EmptyState'

export function CreatorPortfolioPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['creator-portfolio'],
    queryFn: creatorApi.portfolio,
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
          <p className="mt-1 text-sm text-text-muted">Your showcase of verified skill.</p>
        </div>
        <Link to="/creator/ai-builder">
          <Button>Add with AI</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          title="No projects yet"
          body="Generate your first AI portfolio card from notes, an image, or a PDF."
          action={
            <Link to="/creator/ai-builder">
              <Button>Open AI Builder</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <Card key={p.id} hover className="flex flex-col">
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.title}
                  className="mb-4 h-36 w-full rounded-xl object-cover"
                />
              ) : (
                <div className="mb-4 flex h-36 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  Portfolio
                </div>
              )}
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-medium">{p.title}</h3>
                {p.ai_generated && <Badge tone="accent">AI</Badge>}
              </div>
              <p className="line-clamp-3 text-sm text-text-muted">{p.description}</p>
              {p.skills_used && <div className="mt-3"><SkillChips value={p.skills_used} /></div>}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
