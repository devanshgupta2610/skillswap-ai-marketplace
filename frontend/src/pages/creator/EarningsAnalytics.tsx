import { useQuery } from '@tanstack/react-query'
import { bookingApi, creatorApi } from '@/services/endpoints'
import { Card, Skeleton, StatCard } from '@/components/ui/Card'

export function CreatorEarningsPage() {
  const { data: stats, isLoading: sLoad } = useQuery({
    queryKey: ['creator-dashboard'],
    queryFn: creatorApi.dashboard,
  })
  const { data: bookings, isLoading: bLoad } = useQuery({
    queryKey: ['bookings'],
    queryFn: bookingApi.list,
  })

  const completed = (bookings || []).filter((b) => b.status === 'completed')

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Earnings</h1>
        <p className="mt-1 text-sm text-text-muted">Completed bookings only — milestone-safe revenue.</p>
      </div>
      {sLoad ? (
        <Skeleton className="h-28" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total earnings"
            value={`₹${(stats?.total_earnings ?? 0).toLocaleString()}`}
          />
          <StatCard label="Completed projects" value={stats?.completed_bookings ?? 0} />
          <StatCard label="Active pipeline" value={stats?.active_bookings ?? 0} />
        </div>
      )}
      <Card>
        <h2 className="mb-4 font-medium">Payout history</h2>
        {bLoad ? (
          <Skeleton className="h-24" />
        ) : !completed.length ? (
          <p className="text-sm text-text-muted">No completed payouts yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {completed.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-3 text-sm">
                <span>{b.title}</span>
                <span className="text-success">+₹{b.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

export function CreatorAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['creator-dashboard'],
    queryFn: creatorApi.dashboard,
  })

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-text-muted">Performance signals for your creator brand.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Gig views" value={data?.views ?? 0} />
          <StatCard label="Portfolio items" value={data?.portfolio_count ?? 0} />
          <StatCard label="Avg rating" value={(data?.avg_rating ?? 0).toFixed(2)} />
          <StatCard label="Conversion (completed)" value={data?.completed_bookings ?? 0} />
          <StatCard label="Unread messages" value={data?.unread_messages ?? 0} />
          <StatCard label="Notifications" value={data?.unread_notifications ?? 0} />
        </div>
      )}
    </div>
  )
}
