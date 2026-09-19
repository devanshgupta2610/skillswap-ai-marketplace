import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { bookingApi, gigApi } from '@/services/endpoints'
import { getErrorMessage } from '@/services/api'
import { Badge, Card, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkillChips } from '@/components/ui/SkillChips'
import { useMarketplaceGigs, useSavedGigs } from '@/hooks/useGigs'
import type { Gig } from '@/types'

export function BrowseGigsPage() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showSaved, setShowSaved] = useState(false)
  const params = {
    q: q || undefined,
    category: category || undefined,
    max_price: maxPrice ? Number(maxPrice) : undefined,
  }
  const { data, isLoading, refetch } = useMarketplaceGigs(params)
  const { data: saved } = useSavedGigs()
  const gigs = showSaved ? saved : data

  const save = useMutation({
    mutationFn: (id: number) => gigApi.save(id),
    onSuccess: () => {
      toast.success('Gig saved')
      void qc.invalidateQueries({ queryKey: ['gigs-saved'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const book = useMutation({
    mutationFn: (gig: Gig) =>
      bookingApi.create({
        creator_user_id: gig.creator_user_id!,
        gig_id: gig.id,
        title: gig.title,
        amount: gig.price,
        description: gig.description,
        milestones: [
          { title: 'Kickoff', amount: gig.price * 0.3 },
          { title: 'Delivery', amount: gig.price * 0.7 },
        ],
      }),
    onSuccess: () => toast.success('Booking requested'),
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gig marketplace</h1>
          <p className="mt-1 text-sm text-text-muted">
            Search and filter offers. Price is visible; hiring quality still comes from profiles and match scores.
          </p>
        </div>
        <Button variant={showSaved ? 'primary' : 'secondary'} onClick={() => setShowSaved((value) => !value)}>
          {showSaved ? 'Showing saved' : 'Saved gigs'}
        </Button>
      </div>

      <form
        className="grid gap-3 sm:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault()
          setShowSaved(false)
          void refetch()
        }}
      >
        <Input placeholder="Search" value={q} onChange={(event) => setQ(event.target.value)} />
        <Select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">All categories</option>
          <option value="development">Development</option>
          <option value="design">Design</option>
          <option value="writing">Writing</option>
          <option value="marketing">Marketing</option>
          <option value="video">Video</option>
        </Select>
        <Input
          placeholder="Max price"
          type="number"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
        />
        <Button type="submit">Filter</Button>
      </form>

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : !gigs?.length ? (
        <EmptyState
          title={showSaved ? 'No saved gigs' : 'No gigs match'}
          body="Try another filter, or browse creators and book from a profile instead."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gigs.map((gig) => (
            <Card key={gig.id} hover className="flex flex-col space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium">{gig.title}</h3>
                <Badge tone="accent">₹{gig.price}</Badge>
              </div>
              <p className="line-clamp-3 text-sm text-text-muted">{gig.description}</p>
              <SkillChips value={gig.tags} />
              <p className="text-xs text-text-muted">
                {gig.creator_name} · {gig.creator_rating?.toFixed(1) ?? '—'}★ · {gig.delivery_days}d
              </p>
              <div className="mt-auto flex flex-wrap gap-2">
                {gig.creator_user_id && (
                  <Link to={`/client/creators/${gig.creator_user_id}`}>
                    <Button size="sm" variant="secondary">
                      Profile
                    </Button>
                  </Link>
                )}
                <Button size="sm" variant="ghost" onClick={() => save.mutate(gig.id)}>
                  Save
                </Button>
                {gig.creator_user_id && (
                  <Button size="sm" loading={book.isPending} onClick={() => book.mutate(gig)}>
                    Book
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
