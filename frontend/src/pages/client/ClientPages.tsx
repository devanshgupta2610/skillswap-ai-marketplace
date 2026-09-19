import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { clientApi, creatorApi, bookingApi, reviewApi } from '@/services/endpoints'
import { getErrorMessage } from '@/services/api'
import { Badge, Card, Skeleton, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkillChips } from '@/components/ui/SkillChips'
import { AssistantCard } from '@/components/AssistantCard'
import { BookingStepper } from '@/components/ui/BookingStepper'
import type { MatchResult } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboard } from '@/hooks/useDashboard'
import { useBookings } from '@/hooks/useBookings'

export function ClientDashboard() {
  const { user } = useAuth()
  const { data, isLoading } = useDashboard('client')
  const { data: jobs } = useQuery({ queryKey: ['client-jobs'], queryFn: clientApi.myJobs })
  const { data: bookings } = useBookings()
  const recent = (bookings || []).slice(0, 4)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-accent">Client workspace</p>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user?.full_name}</h1>
          <p className="mt-1 text-sm text-text-muted">
            Hire on skill, portfolio similarity, and trust — not the lowest bid.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/client/gigs">
            <Button variant="secondary">Browse gigs</Button>
          </Link>
          <Link to="/client/post-job">
            <Button>Post a job</Button>
          </Link>
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-28" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active bookings" value={data?.active_bookings ?? 0} />
          <StatCard label="Completed" value={data?.completed_bookings ?? 0} />
          <StatCard label="Total spent" value={`₹${(data?.total_spent ?? 0).toLocaleString()}`} />
          <StatCard label="Unread messages" value={data?.unread_messages ?? 0} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Your jobs</h2>
            <Link to="/client/post-job" className="text-sm text-accent">
              New job
            </Link>
          </div>
          {!jobs?.length ? (
            <EmptyState
              title="No jobs posted"
              body="Describe the brief. AI Talent Match returns compatibility scores and reasons."
            />
          ) : (
            jobs.slice(0, 4).map((job) => (
              <Card key={job.id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{job.title}</p>
                  <Badge>{job.status}</Badge>
                </div>
                <p className="line-clamp-2 text-sm text-text-muted">{job.description}</p>
                <Link to="/client/post-job" className="text-sm text-accent">
                  Match talent again from Post Job
                </Link>
              </Card>
            ))
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Live bookings</h2>
          {!recent.length ? (
            <EmptyState title="No bookings" body="Browse creators or gigs and request a milestone-safe booking." />
          ) : (
            recent.map((booking) => (
              <Card key={booking.id} className="space-y-3">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-medium">{booking.title}</p>
                    <p className="text-sm text-text-muted">{booking.creator_name}</p>
                  </div>
                  <Badge tone="accent">{booking.status.replace('_', ' ')}</Badge>
                </div>
                <BookingStepper status={booking.status} />
              </Card>
            ))
          )}
          <AssistantCard />
        </div>
      </div>
    </div>
  )
}

export function PostJobPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title: '',
    description: '',
    required_skills: '',
    category: 'development',
    budget_min: 1000,
    budget_max: 5000,
  })
  const [matches, setMatches] = useState<MatchResult[]>([])
  const { data: myJobs } = useQuery({ queryKey: ['client-jobs'], queryFn: clientApi.myJobs })

  const create = useMutation({
    mutationFn: () => clientApi.createJob(form),
    onSuccess: async (job) => {
      toast.success('Job posted')
      void qc.invalidateQueries({ queryKey: ['client-jobs'] })
      const ranked = await clientApi.match(job.id)
      setMatches(ranked)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const rematch = useMutation({
    mutationFn: (jobId: number) => clientApi.match(jobId),
    onSuccess: (ranked) => {
      setMatches(ranked)
      toast.success('Matches refreshed')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    create.mutate()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Post a job</h1>
        <p className="mt-1 text-sm text-text-muted">
          After posting, AI Talent Match ranks creators by skills, portfolio, and trust.
        </p>
      </div>
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
          <Textarea
            label="Description"
            required
            minLength={20}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <Input
            label="Required skills"
            value={form.required_skills}
            onChange={(event) => setForm({ ...form, required_skills: event.target.value })}
          />
          <Select
            label="Category"
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
          >
            <option value="development">Development</option>
            <option value="design">Design</option>
            <option value="writing">Writing</option>
            <option value="marketing">Marketing</option>
            <option value="video">Video</option>
          </Select>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Budget min (₹)"
              type="number"
              value={form.budget_min}
              onChange={(event) => setForm({ ...form, budget_min: Number(event.target.value) })}
            />
            <Input
              label="Budget max (₹)"
              type="number"
              value={form.budget_max}
              onChange={(event) => setForm({ ...form, budget_max: Number(event.target.value) })}
            />
          </div>
          <Button type="submit" loading={create.isPending}>
            Post & match talent
          </Button>
        </form>
      </Card>

      {!!myJobs?.length && (
        <Card className="space-y-3">
          <h2 className="font-medium">Rematch an existing job</h2>
          <div className="flex flex-wrap gap-2">
            {myJobs.map((job) => (
              <Button key={job.id} size="sm" variant="secondary" onClick={() => rematch.mutate(job.id)}>
                {job.title}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {!!matches.length && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium">AI Talent Match</h2>
          {matches.slice(0, 8).map((match) => (
            <Card key={match.creator_id} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{match.full_name}</p>
                  <p className="text-sm text-text-muted">{match.headline || match.skills}</p>
                </div>
                <Badge tone="accent">{match.compatibility_score}% match</Badge>
              </div>
              <SkillChips value={match.skills} />
              <ul className="list-inside list-disc text-sm text-text-muted">
                {match.matching_reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <Link to={`/client/creators/${match.user_id}`}>
                <Button size="sm" variant="secondary">
                  View profile
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function BrowseCreatorsPage() {
  const [q, setQ] = useState('')
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['browse-creators', q],
    queryFn: () => creatorApi.browse({ q: q || undefined }),
  })
  const { data: saved } = useQuery({
    queryKey: ['saved-creators'],
    queryFn: clientApi.savedCreators,
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Browse creators</h1>
        <p className="mt-1 text-sm text-text-muted">Discover talent ranked by trust and ratings.</p>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void refetch()
        }}
      >
        <Input placeholder="Search skills or name" value={q} onChange={(event) => setQ(event.target.value)} />
        <Button type="submit">Search</Button>
      </form>
      {!!saved?.length && (
        <p className="text-sm text-text-muted">{saved.length} saved creator{saved.length === 1 ? '' : 's'}</p>
      )}
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : !data?.length ? (
        <EmptyState title="No creators yet" body="Ask a student to register as a creator, then match them from a job brief." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((creator) => (
            <Card key={creator.id} hover className="space-y-2">
              <h3 className="font-medium">{creator.full_name}</h3>
              <p className="text-sm text-text-muted">{creator.headline || 'Creator'}</p>
              <SkillChips value={creator.skills} />
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>
                  {creator.rating_avg.toFixed(1)}★ · Trust {creator.trust_score.toFixed(0)}
                </span>
                <Link to={`/client/creators/${creator.user_id}`} className="text-accent">
                  View
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function CreatorPublicProfilePage({ userId }: { userId: number }) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['creator-public', userId],
    queryFn: () => creatorApi.publicProfile(userId),
  })
  const { data: portfolio } = useQuery({
    queryKey: ['creator-public-portfolio', userId],
    queryFn: () => creatorApi.publicPortfolio(userId),
  })
  const { data: reviews } = useQuery({
    queryKey: ['creator-reviews', userId],
    queryFn: () => reviewApi.forUser(userId),
  })
  const [amount, setAmount] = useState(2000)
  const [title, setTitle] = useState('Project booking')

  const book = useMutation({
    mutationFn: () =>
      bookingApi.create({
        creator_user_id: userId,
        title,
        amount,
        description: 'Booked via SkillSwap AI',
        milestones: [
          { title: 'Kickoff', amount: amount * 0.3 },
          { title: 'Delivery', amount: amount * 0.7 },
        ],
      }),
    onSuccess: () => toast.success('Booking requested with milestones'),
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const save = useMutation({
    mutationFn: () => clientApi.saveCreator(userId),
    onSuccess: () => toast.success('Creator saved'),
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  if (isLoading) return <Skeleton className="mx-auto h-64 max-w-4xl" />
  if (!profile) return <p>Creator not found</p>

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{profile.full_name}</h1>
            <p className="text-text-muted">{profile.headline}</p>
          </div>
          <Badge tone="accent">Trust {profile.trust_score.toFixed(0)}</Badge>
        </div>
        <p className="text-sm text-text-muted">{profile.bio}</p>
        <SkillChips value={profile.skills} />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => save.mutate()}>
            Save creator
          </Button>
          <Link to={`/client/messages?peer=${userId}`}>
            <Button size="sm" variant="ghost">
              Message
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-medium">Book this creator</h2>
        <Input label="Project title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <Input
          label="Amount (₹)"
          type="number"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
        />
        <Button loading={book.isPending} onClick={() => book.mutate()}>
          Request booking with milestones
        </Button>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {(portfolio || []).map((project) => (
          <Card key={project.id}>
            <h3 className="font-medium">{project.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm text-text-muted">{project.description}</p>
            <div className="mt-3">
              <SkillChips value={project.skills_used} />
            </div>
          </Card>
        ))}
      </div>

      {!!reviews?.length && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Verified reviews</h2>
          {reviews.map((item) => (
            <Card key={item.id} className="space-y-1">
              <p className="text-sm font-medium">
                {item.rating}★ · {item.reviewer_name || 'Client'}
              </p>
              <p className="text-sm text-text-muted">{item.feedback}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function ClientReviewsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reviews-mine'],
    queryFn: reviewApi.mine,
  })

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : !data?.length ? (
        <EmptyState
          title="No verified reviews yet"
          body="Reviews unlock only after a booking is marked completed. That keeps trust signals honest."
        />
      ) : (
        data.map((review) => (
          <Card key={review.id} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{review.rating}★ verified</p>
              <Badge tone="success">Project verified</Badge>
            </div>
            <p className="text-sm text-text-muted">
              {review.reviewer_name} → {review.reviewee_name}
            </p>
            <p className="text-sm">{review.feedback}</p>
          </Card>
        ))
      )}
    </div>
  )
}

export function ClientAnalyticsPage() {
  const { data, isLoading } = useDashboard('client')
  const { data: jobs } = useQuery({ queryKey: ['client-jobs'], queryFn: clientApi.myJobs })
  const { data: bookings } = useBookings()
  const completed = (bookings || []).filter((booking) => booking.status === 'completed')

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Client analytics</h1>
        <p className="mt-1 text-sm text-text-muted">Hiring quality over cheapest bids.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-28" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Jobs posted" value={jobs?.length ?? 0} />
          <StatCard label="Completed hires" value={data?.completed_bookings ?? 0} />
          <StatCard label="Active pipeline" value={data?.active_bookings ?? 0} />
          <StatCard label="Spend" value={`₹${(data?.total_spent ?? 0).toLocaleString()}`} />
        </div>
      )}
      <Card>
        <h2 className="mb-4 font-medium">Completed work</h2>
        {!completed.length ? (
          <p className="text-sm text-text-muted">Complete a milestone booking to see spend history.</p>
        ) : (
          <ul className="divide-y divide-border">
            {completed.map((booking) => (
              <li key={booking.id} className="flex justify-between py-3 text-sm">
                <span>
                  {booking.title} · {booking.creator_name}
                </span>
                <span className="text-accent">₹{booking.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
