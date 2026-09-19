import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'

export function SharedShell() {
  const { user, logout } = useAuth()
  const home = user?.role === 'creator' ? '/creator' : '/client'

  return (
    <div className="gradient-mesh min-h-screen">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
        <Link to={home} className="text-lg font-semibold">
          SkillSwap <span className="text-accent">AI</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to={home}>
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout()
              window.location.href = '/'
            }}
          >
            Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 pb-10">
        <Outlet />
      </main>
    </div>
  )
}
