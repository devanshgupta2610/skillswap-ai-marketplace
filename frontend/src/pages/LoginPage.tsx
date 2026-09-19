import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(email, password)
      navigate(user.role === 'creator' ? '/creator' : '/client')
    } catch {
      /* toast handled in context */
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gradient-mesh flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <Link to="/" className="text-lg font-semibold">
          SkillSwap <span className="text-accent">AI</span>
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-text-muted">Sign in to your creator or client workspace.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" loading={loading}>
            Log in
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-text-muted">
          New here?{' '}
          <Link to="/register" className="text-accent hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-4 rounded-xl bg-white/5 px-3 py-2 text-center text-xs text-text-muted">
          Demo after seed: creator@skillswap.ai or client@skillswap.ai · password123
        </p>
      </Card>
    </div>
  )
}
