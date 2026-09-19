import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import type { UserRole } from '@/types'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('creator')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await register({
        email,
        password,
        full_name: fullName,
        role,
      })
      navigate(user.role === 'creator' ? '/creator' : '/client')
    } catch {
      /* handled */
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
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-text-muted">Choose a role — dashboards are separated by design.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label="Full name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
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
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Select
            label="I am a"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="creator">Creator (student / freelancer)</option>
            <option value="client">Client (hire talent)</option>
          </Select>
          <Button type="submit" className="w-full" loading={loading}>
            Register
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  )
}
