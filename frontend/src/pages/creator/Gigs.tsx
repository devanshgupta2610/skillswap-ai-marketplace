import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { creatorApi, gigApi } from '@/services/endpoints'
import { getErrorMessage } from '@/services/api'
import { Badge, Card, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkillChips } from '@/components/ui/SkillChips'
import { useMyGigs } from '@/hooks/useGigs'
import type { Gig } from '@/types'
import { useState } from 'react'
import type { FormEvent } from 'react'

const emptyForm = {
  title: '',
  description: '',
  category: 'development',
  tags: '',
  price: 1500,
  delivery_days: 7,
}

export function CreatorGigsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useMyGigs()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Gig | null>(null)
  const [form, setForm] = useState(emptyForm)

  const create = useMutation({
    mutationFn: () => gigApi.create(form),
    onSuccess: () => {
      toast.success('Gig published')
      reset()
      void qc.invalidateQueries({ queryKey: ['gigs-mine'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const update = useMutation({
    mutationFn: () => gigApi.update(editing!.id, form),
    onSuccess: () => {
      toast.success('Gig updated')
      reset()
      void qc.invalidateQueries({ queryKey: ['gigs-mine'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const remove = useMutation({
    mutationFn: (id: number) => gigApi.remove(id),
    onSuccess: () => {
      toast.success('Gig deleted')
      void qc.invalidateQueries({ queryKey: ['gigs-mine'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const suggest = useMutation({
    mutationFn: () =>
      creatorApi.suggestPricing({
        category: form.category,
        skills: form.tags,
        delivery_days: form.delivery_days,
      }),
    onSuccess: (data: { suggested_price: number; rationale: string }) => {
      setForm((current) => ({ ...current, price: Math.round(data.suggested_price) }))
      toast.success(data.rationale)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  function reset() {
    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  function startEdit(gig: Gig) {
    setEditing(gig)
    setOpen(true)
    setForm({
      title: gig.title,
      description: gig.description,
      category: gig.category,
      tags: gig.tags || '',
      price: gig.price,
      delivery_days: gig.delivery_days,
    })
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (editing) update.mutate()
    else create.mutate()
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gig management</h1>
          <p className="mt-1 text-sm text-text-muted">Create, edit, and retire offers clients can book directly.</p>
        </div>
        <Button
          onClick={() => {
            if (open) reset()
            else setOpen(true)
          }}
        >
          {open ? 'Close' : 'New gig'}
        </Button>
      </div>

      {open && (
        <Card>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Title"
              required
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
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
            <div className="sm:col-span-2">
              <Textarea
                label="Description"
                required
                minLength={20}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </div>
            <Input
              label="Tags"
              value={form.tags}
              onChange={(event) => setForm({ ...form, tags: event.target.value })}
            />
            <Input
              label="Price (₹)"
              type="number"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: Number(event.target.value) })}
            />
            <Input
              label="Delivery days"
              type="number"
              value={form.delivery_days}
              onChange={(event) => setForm({ ...form, delivery_days: Number(event.target.value) })}
            />
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button type="submit" loading={create.isPending || update.isPending}>
                {editing ? 'Save changes' : 'Publish gig'}
              </Button>
              <Button type="button" variant="secondary" loading={suggest.isPending} onClick={() => suggest.mutate()}>
                Suggest AI price
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : !data?.length ? (
        <EmptyState
          title="No gigs yet"
          body="Publish your first offer. Price is visible, but matching still ranks trust and portfolio fit first."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              Create a gig
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((gig) => (
            <Card key={gig.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium">{gig.title}</h3>
                <Badge tone="accent">₹{gig.price}</Badge>
              </div>
              <p className="line-clamp-2 text-sm text-text-muted">{gig.description}</p>
              <SkillChips value={gig.tags} />
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>
                  {gig.category} · {gig.delivery_days}d · {gig.views} views
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(gig)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => remove.mutate(gig.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
