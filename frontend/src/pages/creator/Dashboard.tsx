import { Link } from 'react-router-dom'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { creatorApi } from '@/services/endpoints'
import { StatCard, Skeleton, Card, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { AssistantCard } from '@/components/AssistantCard'
import { BookingStepper } from '@/components/ui/BookingStepper'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboard } from '@/hooks/useDashboard'
import { useBookings } from '@/hooks/useBookings'
import { useQuery } from '@tanstack/react-query'

export function CreatorDashboard() {
  const { user } = useAuth()
  const { data, isLoading } = useDashboard(user?.role)
  const { data: bookings } = useBookings()
  const { data: profile } = useQuery({
    queryKey: ['creator-profile'],
    queryFn: creatorApi.profile,
  })
  const recent = (bookings || []).slice(0, 4)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-accent">Creator workspace</p>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user?.full_name}</h1>
          <p className="mt-1 text-sm text-text-muted">
            Lead with proof of work. Trust score {profile?.trust_score?.toFixed(0) ?? '—'} ·{' '}
            {profile?.rating_avg?.toFixed(1) ?? '0.0'}★
          </p>
        </div>
        <Link to="/creator/ai-builder">
          <Button>
            <Sparkles size={16} /> Build AI portfolio
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active bookings" value={data?.active_bookings ?? 0} />
          <StatCard label="Completed" value={data?.completed_bookings ?? 0} />
          <StatCard label="Earnings" value={`₹${(data?.total_earnings ?? 0).toLocaleString()}`} />
          <StatCard label="Avg rating" value={(data?.avg_rating ?? 0).toFixed(1)} />
          <StatCard label="Portfolio items" value={data?.portfolio_count ?? 0} />
          <StatCard label="Active gigs" value={data?.gig_count ?? 0} />
          <StatCard label="Gig views" value={data?.views ?? 0} />
          <StatCard label="Unread messages" value={data?.unread_messages ?? 0} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Recent bookings</h2>
            <Link to="/creator/bookings" className="text-sm text-accent">
              View all
            </Link>
          </div>
          {!recent.length ? (
            <EmptyState
              title="No bookings yet"
              body="Publish a gig and keep your AI portfolio current so clients can match you on skill and trust."
              action={
                <Link to="/creator/gigs">
                  <Button size="sm">Manage gigs</Button>
                </Link>
              }
            />
          ) : (
            recent.map((booking) => (
              <Card key={booking.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{booking.title}</p>
                    <p className="text-sm text-text-muted">
                      {booking.client_name || 'Client'} · ₹{booking.amount.toLocaleString()}
                    </p>
                  </div>
                  <Badge tone={booking.status === 'completed' ? 'success' : 'accent'}>
                    {booking.status.replace('_', ' ')}
                  </Badge>
                </div>
                <BookingStepper status={booking.status} />
              </Card>
            ))
          )}
        </div>
        <div className="space-y-4">
          <Card className="space-y-3">
            <h2 className="font-medium">Quick actions</h2>
            <div className="grid gap-2">
              <Link to="/creator/ai-builder" className="text-sm text-accent">
                Generate a portfolio card <ArrowUpRight className="inline" size={14} />
              </Link>
              <Link to="/creator/gigs" className="text-sm text-accent">
                Publish or edit a gig
              </Link>
              <Link to="/creator/messages" className="text-sm text-accent">
                Open messages
              </Link>
            </div>
          </Card>
          <AssistantCard />
        </div>
      </div>
    </div>
  )
}
