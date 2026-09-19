import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { chatApi } from '@/services/endpoints'
import { getErrorMessage } from '@/services/api'
import { Card, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/contexts/AuthContext'

export function MessagesPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const { data: inbox, isLoading } = useQuery({ queryKey: ['inbox'], queryFn: chatApi.inbox })
  const [peerId, setPeerId] = useState<number | null>(null)
  const [peerInput, setPeerInput] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    const peer = Number(params.get('peer') || 0)
    if (peer) setPeerId(peer)
  }, [params])

  const { data: thread } = useQuery({
    queryKey: ['thread', peerId],
    queryFn: () => chatApi.conversation(peerId!),
    enabled: !!peerId,
  })

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL
    const token = localStorage.getItem('access_token')
    if (!wsUrl || !token || !peerId) return
    const ws = new WebSocket(`${wsUrl}?token=${token}`)
    ws.onmessage = () => {
      void qc.invalidateQueries({ queryKey: ['thread', peerId] })
      void qc.invalidateQueries({ queryKey: ['inbox'] })
    }
    return () => ws.close()
  }, [peerId, qc])

  const peers = useMemo(() => {
    if (!inbox || !user) return []
    return inbox.map((message) => {
      const isSender = message.sender_id === user.id
      return {
        id: isSender ? message.recipient_id : message.sender_id,
        name: isSender ? message.recipient_name : message.sender_name,
        preview: message.content,
        at: message.created_at,
      }
    })
  }, [inbox, user])

  const send = useMutation({
    mutationFn: () => chatApi.send({ recipient_id: peerId!, content }),
    onSuccess: () => {
      setContent('')
      void qc.invalidateQueries({ queryKey: ['thread', peerId] })
      void qc.invalidateQueries({ queryKey: ['inbox'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  function startChat(event: FormEvent) {
    event.preventDefault()
    const id = Number(peerInput)
    if (!id) {
      toast.error('Enter a valid user id')
      return
    }
    setPeerId(id)
  }

  const peerName =
    peers.find((peer) => peer.id === peerId)?.name ||
    thread?.find((message) => message.sender_id === peerId)?.sender_name ||
    (peerId ? `User #${peerId}` : '')

  return (
    <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="space-y-3">
        <h1 className="text-lg font-semibold">Messages</h1>
        <form onSubmit={startChat} className="flex gap-2">
          <Input
            placeholder="User ID"
            value={peerInput}
            onChange={(event) => setPeerInput(event.target.value)}
          />
          <Button type="submit" size="sm">
            Open
          </Button>
        </form>
        {isLoading ? (
          <Skeleton className="h-24" />
        ) : !peers.length ? (
          <p className="text-sm text-text-muted">No conversations yet. Open a profile and tap Message.</p>
        ) : (
          <ul className="space-y-1">
            {peers.map((peer) => (
              <li key={peer.id}>
                <button
                  type="button"
                  onClick={() => setPeerId(peer.id)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                    peerId === peer.id ? 'bg-accent-soft text-accent' : 'hover:bg-white/5'
                  }`}
                >
                  <p className="font-medium">{peer.name || `User #${peer.id}`}</p>
                  <p className="truncate text-xs text-text-muted">{peer.preview}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex min-h-[420px] flex-col">
        {!peerId ? (
          <div className="m-auto">
            <EmptyState title="Select a conversation" body="Realtime chat uses WebSockets when the backend is reachable, with REST as fallback." />
          </div>
        ) : (
          <>
            <p className="mb-3 border-b border-border pb-3 text-sm text-text-muted">Chat with {peerName}</p>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {(thread || []).map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    message.sender_id === user?.id
                      ? 'ml-auto bg-accent text-white'
                      : 'bg-white/5 text-text'
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </div>
            <form
              className="mt-3 flex gap-2 border-t border-border pt-3"
              onSubmit={(event) => {
                event.preventDefault()
                if (content.trim()) send.mutate()
              }}
            >
              <Input
                placeholder="Write a message..."
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
              <Button type="submit" loading={send.isPending}>
                Send
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}
