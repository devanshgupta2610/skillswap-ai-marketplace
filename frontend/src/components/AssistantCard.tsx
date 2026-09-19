import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Sparkles } from 'lucide-react'
import { aiApi } from '@/services/endpoints'
import { getErrorMessage } from '@/services/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'

export function AssistantCard() {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [reply, setReply] = useState('')

  const ask = useMutation({
    mutationFn: () => aiApi.assistant(message, user?.role),
    onSuccess: (data) => setReply(data.reply),
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-accent" />
        <h2 className="font-medium">SkillSwap AI Assistant</h2>
      </div>
      <Textarea
        label="Ask for portfolio, matching, or booking advice"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <Button
        size="sm"
        loading={ask.isPending}
        disabled={!message.trim()}
        onClick={() => ask.mutate()}
      >
        Ask
      </Button>
      {reply && <p className="rounded-xl bg-white/5 p-3 text-sm text-text-muted">{reply}</p>}
    </Card>
  )
}
