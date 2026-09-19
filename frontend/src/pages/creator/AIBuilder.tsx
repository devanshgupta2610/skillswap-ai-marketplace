import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { creatorApi } from '@/services/endpoints'
import { getErrorMessage } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card, Badge } from '@/components/ui/Card'
import { SkillChips } from '@/components/ui/SkillChips'

interface Preview {
  title: string
  description: string
  skills_used: string
  tools_used: string
}

export function AIPortfolioBuilderPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [details, setDetails] = useState('')
  const [title, setTitle] = useState('')
  const [projectUrl, setProjectUrl] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [pdf, setPdf] = useState<File | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)

  const generate = useMutation({
    mutationFn: async () => {
      const form = new FormData()
      form.append('project_details', details)
      if (title) form.append('title', title)
      return creatorApi.previewPortfolio(form)
    },
    onSuccess: (data) => {
      setPreview(data)
      toast.success('AI card generated — review before saving')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const save = useMutation({
    mutationFn: async () => {
      const form = new FormData()
      form.append('project_details', details)
      form.append('use_ai', 'true')
      if (preview?.title || title) form.append('title', preview?.title || title)
      if (preview?.description) form.append('description', preview.description)
      if (preview?.skills_used) form.append('skills_used', preview.skills_used)
      if (preview?.tools_used) form.append('tools_used', preview.tools_used)
      if (projectUrl) form.append('project_url', projectUrl)
      if (image) form.append('image', image)
      if (pdf) form.append('pdf', pdf)
      return creatorApi.createPortfolio(form)
    },
    onSuccess: () => {
      toast.success('Portfolio card saved')
      void qc.invalidateQueries({ queryKey: ['creator-portfolio'] })
      void qc.invalidateQueries({ queryKey: ['creator-dashboard'] })
      navigate('/creator/portfolio')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!details.trim()) {
      toast.error('Add project details for the AI to work with')
      return
    }
    generate.mutate()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Portfolio Builder</h1>
        <p className="mt-1 text-sm text-text-muted">
          Upload work and notes. AI generates title, description, skills, and tools — then you save the card.
        </p>
      </div>
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <Textarea
            label="Project details"
            required
            placeholder="What did you build? Stack, outcomes, constraints..."
            value={details}
            onChange={(event) => setDetails(event.target.value)}
          />
          <Input
            label="Optional title hint"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Input
            label="Project URL"
            value={projectUrl}
            onChange={(event) => setProjectUrl(event.target.value)}
          />
          <Input
            label="Cover image"
            type="file"
            accept="image/*"
            onChange={(event) => setImage(event.target.files?.[0] || null)}
          />
          <Input
            label="PDF case study"
            type="file"
            accept="application/pdf"
            onChange={(event) => setPdf(event.target.files?.[0] || null)}
          />
          <Button type="submit" loading={generate.isPending} className="w-full">
            Generate preview
          </Button>
        </form>
      </Card>

      {preview && (
        <Card className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-medium">{preview.title}</h2>
            <Badge tone="accent">AI card</Badge>
          </div>
          <p className="text-sm text-text-muted">{preview.description}</p>
          <div>
            <p className="mb-1 text-xs text-text-muted">Skills</p>
            <SkillChips value={preview.skills_used} />
          </div>
          <div>
            <p className="mb-1 text-xs text-text-muted">Tools</p>
            <SkillChips value={preview.tools_used} />
          </div>
          <Button loading={save.isPending} onClick={() => save.mutate()}>
            Save to portfolio
          </Button>
        </Card>
      )}
    </div>
  )
}
