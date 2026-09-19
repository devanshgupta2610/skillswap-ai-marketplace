import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { bookingApi, reviewApi } from '@/services/endpoints'
import { getErrorMessage } from '@/services/api'
import { Badge, Card, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { BookingStepper } from '@/components/ui/BookingStepper'
import { useAuth } from '@/contexts/AuthContext'
import { useBookings } from '@/hooks/useBookings'
import type { BookingStatus } from '@/types'
import { useState } from 'react'

const tone = (status: string) =>
  status === 'completed' ? 'success' : status === 'pending' ? 'warning' : 'accent'

export function BookingsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data, isLoading } = useBookings()
  const [reviewFor, setReviewFor] = useState<number | null>(null)
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')
  const [delivery, setDelivery] = useState({ notes: '', url: '' })

  const update = useMutation({
    mutationFn: ({
      id,
      status,
      delivery_notes,
      delivery_url,
    }: {
      id: number
      status?: BookingStatus
      delivery_notes?: string
      delivery_url?: string
    }) => bookingApi.update(id, { status, delivery_notes, delivery_url }),
    onSuccess: () => {
      toast.success('Booking updated')
      void qc.invalidateQueries({ queryKey: ['bookings'] })
      void qc.invalidateQueries({ queryKey: ['creator-dashboard'] })
      void qc.invalidateQueries({ queryKey: ['client-dashboard'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const review = useMutation({
    mutationFn: () => reviewApi.create({ booking_id: reviewFor!, rating, feedback }),
    onSuccess: () => {
      toast.success('Verified review submitted')
      setReviewFor(null)
      setFeedback('')
      void qc.invalidateQueries({ queryKey: ['bookings'] })
      void qc.invalidateQueries({ queryKey: ['reviews-mine'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Pending → Accepted → In Progress → Submitted → Completed. Milestones keep delivery staged.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : !data?.length ? (
        <EmptyState
          title="No bookings yet"
          body="Clients request work from a creator profile or gig. Creators accept, deliver, and collect verified reviews after completion."
        />
      ) : (
        <div className="space-y-4">
          {data.map((booking) => {
            const isCreator = user?.id === booking.creator_user_id
            const counterpart = isCreator ? booking.client_name : booking.creator_name
            return (
              <Card key={booking.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{booking.title}</h3>
                    <p className="text-sm text-text-muted">
                      {counterpart || 'Participant'} · ₹{booking.amount.toLocaleString()}
                    </p>
                  </div>
                  <Badge tone={tone(booking.status)}>{booking.status.replace('_', ' ')}</Badge>
                </div>
                <BookingStepper status={booking.status} />
                {booking.description && <p className="text-sm text-text-muted">{booking.description}</p>}
                {!!booking.milestones?.length && (
                  <div className="rounded-xl border border-border p-3">
                    <p className="mb-2 text-xs font-medium text-text-muted">Milestones</p>
                    <ul className="space-y-1 text-sm">
                      {booking.milestones.map((milestone) => (
                        <li key={milestone.id} className="flex justify-between gap-2">
                          <span>{milestone.title}</span>
                          <span className="text-text-muted">
                            ₹{milestone.amount} · {milestone.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {isCreator && booking.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => update.mutate({ id: booking.id, status: 'accepted' })}>
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => update.mutate({ id: booking.id, status: 'declined' })}
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  {isCreator && booking.status === 'accepted' && (
                    <Button
                      size="sm"
                      onClick={() => update.mutate({ id: booking.id, status: 'in_progress' })}
                    >
                      Start work
                    </Button>
                  )}
                  {isCreator && booking.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() =>
                        update.mutate({
                          id: booking.id,
                          status: 'submitted',
                          delivery_notes: delivery.notes,
                          delivery_url: delivery.url,
                        })
                      }
                    >
                      Submit delivery
                    </Button>
                  )}
                  {!isCreator && booking.status === 'submitted' && (
                    <Button
                      size="sm"
                      onClick={() => update.mutate({ id: booking.id, status: 'completed' })}
                    >
                      Mark completed
                    </Button>
                  )}
                  {booking.status === 'completed' && (
                    <Button size="sm" variant="secondary" onClick={() => setReviewFor(booking.id)}>
                      Leave verified review
                    </Button>
                  )}
                </div>
                {isCreator && booking.status === 'in_progress' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Textarea
                      label="Delivery notes"
                      value={delivery.notes}
                      onChange={(event) => setDelivery({ ...delivery, notes: event.target.value })}
                    />
                    <Textarea
                      label="Delivery URL"
                      value={delivery.url}
                      onChange={(event) => setDelivery({ ...delivery, url: event.target.value })}
                    />
                  </div>
                )}
                {reviewFor === booking.id && (
                  <div className="space-y-3 border-t border-border pt-3">
                    <label className="flex flex-col gap-1.5 text-left text-sm text-text-muted">
                      Rating
                      <select
                        className="rounded-xl border border-border bg-[#12121a] px-3 py-2 text-text"
                        value={rating}
                        onChange={(event) => setRating(Number(event.target.value))}
                      >
                        {[5, 4, 3, 2, 1].map((value) => (
                          <option key={value} value={value}>
                            {value} stars
                          </option>
                        ))}
                      </select>
                    </label>
                    <Textarea
                      label="Feedback"
                      value={feedback}
                      onChange={(event) => setFeedback(event.target.value)}
                    />
                    <Button size="sm" loading={review.isPending} onClick={() => review.mutate()}>
                      Submit review
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
