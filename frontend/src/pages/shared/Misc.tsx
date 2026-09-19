import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import toast from 'react-hot-toast'
import { notificationApi, clientApi } from '@/services/endpoints'
import { Card, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { AssistantCard } from '@/components/AssistantCard'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/services/api'

export function NotificationsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useNotifications()

  const markAll = useMutation({
    mutationFn: notificationApi.markAll,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markOne = useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <Button size="sm" variant="secondary" onClick={() => markAll.mutate()}>
          Mark all read
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : !data?.length ? (
        <EmptyState title="You're all caught up" body="Booking, match, and message events will land here." />
      ) : (
        <div className="space-y-2">
          {data.map((note) => (
            <Card key={note.id} className={`space-y-1 ${note.is_read ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{note.title}</p>
                <span className="text-xs capitalize text-text-muted">{note.type}</span>
              </div>
              <p className="text-sm text-text-muted">{note.body}</p>
              <div className="flex gap-3">
                {note.link && (
                  <Link to={note.link} className="text-sm text-accent">
                    Open
                  </Link>
                )}
                {!note.is_read && (
                  <button
                    type="button"
                    className="text-sm text-text-muted hover:text-text"
                    onClick={() => markOne.mutate(note.id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Card className="space-y-2">
        <p className="text-sm text-text-muted">Account</p>
        <p className="font-medium">{user?.full_name}</p>
        <p className="text-sm text-text-muted">{user?.email}</p>
        <p className="text-sm capitalize text-accent">Role: {user?.role}</p>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            logout()
            navigate('/')
          }}
        >
          Sign out
        </Button>
      </Card>
      {user?.role === 'client' ? <ClientSettingsForm /> : <p className="text-sm text-text-muted">Creator profile lives in the Profile tab.</p>}
      <AssistantCard />
    </div>
  )
}

function ClientSettingsForm() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['client-profile'], queryFn: clientApi.profile })
  const [form, setForm] = useState({
    company_name: '',
    bio: '',
    industry: '',
    location: '',
  })

  useEffect(() => {
    if (data) {
      setForm({
        company_name: data.company_name || '',
        bio: data.bio || '',
        industry: data.industry || '',
        location: data.location || '',
      })
    }
  }, [data])

  const save = useMutation({
    mutationFn: () => clientApi.updateProfile(form),
    onSuccess: () => {
      toast.success('Client profile saved')
      void qc.invalidateQueries({ queryKey: ['client-profile'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    save.mutate()
  }

  if (isLoading) return <Skeleton className="h-48" />

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Company"
          value={form.company_name}
          onChange={(event) => setForm({ ...form, company_name: event.target.value })}
        />
        <Textarea
          label="Bio"
          value={form.bio}
          onChange={(event) => setForm({ ...form, bio: event.target.value })}
        />
        <Input
          label="Industry"
          value={form.industry}
          onChange={(event) => setForm({ ...form, industry: event.target.value })}
        />
        <Input
          label="Location"
          value={form.location}
          onChange={(event) => setForm({ ...form, location: event.target.value })}
        />
        <Button type="submit" loading={save.isPending}>
          Save client profile
        </Button>
      </form>
    </Card>
  )
}

export function NotFoundPage() {
  return (
    <div className="gradient-mesh flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm text-accent">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-text-muted">That route doesn’t exist in SkillSwap AI.</p>
      <Link to="/">
        <Button>Back home</Button>
      </Link>
    </div>
  )
}
