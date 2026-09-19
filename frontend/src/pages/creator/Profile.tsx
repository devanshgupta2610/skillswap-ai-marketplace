import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { creatorApi } from '@/services/endpoints'
import { getErrorMessage } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card, Skeleton } from '@/components/ui/Card'

export function CreatorProfilePage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['creator-profile'], queryFn: creatorApi.profile })
  const [form, setForm] = useState({
    headline: '',
    bio: '',
    skills: '',
    tags: '',
    experience_years: 0,
    hourly_rate: 0,
    location: '',
    availability: 'available',
  })

  useEffect(() => {
    if (data) {
      setForm({
        headline: data.headline || '',
        bio: data.bio || '',
        skills: data.skills || '',
        tags: data.tags || '',
        experience_years: data.experience_years || 0,
        hourly_rate: data.hourly_rate || 0,
        location: data.location || '',
        availability: data.availability || 'available',
      })
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: () => creatorApi.updateProfile(form),
    onSuccess: () => {
      toast.success('Profile updated')
      void qc.invalidateQueries({ queryKey: ['creator-profile'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  if (isLoading) return <Skeleton className="h-96 max-w-3xl" />

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Creator profile</h1>
        <p className="mt-1 text-sm text-text-muted">
          Trust score {data?.trust_score?.toFixed(0)} · {data?.rating_avg?.toFixed(1)}★ (
          {data?.rating_count} reviews)
        </p>
      </div>
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Headline"
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
          />
          <Textarea
            label="Bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          <Input
            label="Skills (comma-separated)"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
          />
          <Input
            label="Tags"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Experience (years)"
              type="number"
              step="0.5"
              value={form.experience_years}
              onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })}
            />
            <Input
              label="Hourly rate (₹)"
              type="number"
              value={form.hourly_rate}
              onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })}
            />
          </div>
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <Button type="submit" loading={mutation.isPending}>
            Save profile
          </Button>
        </form>
      </Card>
    </div>
  )
}
