import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell,
  Briefcase,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  Wallet,
  BarChart3,
  FolderKanban,
  UserRound,
  Search,
  Store,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'

const creatorLinks = [
  { to: '/creator', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/creator/profile', label: 'Profile', icon: UserRound },
  { to: '/creator/portfolio', label: 'Portfolio', icon: FolderKanban },
  { to: '/creator/ai-builder', label: 'AI Builder', icon: Sparkles },
  { to: '/creator/gigs', label: 'Gigs', icon: Briefcase },
  { to: '/creator/bookings', label: 'Bookings', icon: Briefcase },
  { to: '/creator/messages', label: 'Messages', icon: MessageSquare },
  { to: '/creator/earnings', label: 'Earnings', icon: Wallet },
  { to: '/creator/analytics', label: 'Analytics', icon: BarChart3 },
]

const clientLinks = [
  { to: '/client', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/client/post-job', label: 'Post Job', icon: Briefcase },
  { to: '/client/browse', label: 'Browse Creators', icon: Search },
  { to: '/client/gigs', label: 'Gigs', icon: Store },
  { to: '/client/bookings', label: 'Bookings', icon: Briefcase },
  { to: '/client/messages', label: 'Messages', icon: MessageSquare },
  { to: '/client/reviews', label: 'Reviews', icon: BarChart3 },
  { to: '/client/analytics', label: 'Analytics', icon: BarChart3 },
]

export function DashboardLayout({ role }: { role: 'creator' | 'client' }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = role === 'creator' ? creatorLinks : clientLinks

  return (
    <div className="gradient-mesh min-h-screen lg:flex">
      <aside className="border-b border-border lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r lg:border-border">
        <div className="flex items-center justify-between px-5 py-5">
          <Link to="/" className="text-lg font-semibold tracking-tight text-text">
            SkillSwap <span className="text-accent">AI</span>
          </Link>
          <Link to="/notifications" className="rounded-lg p-2 text-text-muted hover:bg-white/5 lg:hidden">
            <Bell size={18} />
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-y-auto">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
                  isActive
                    ? 'bg-accent-soft text-accent'
                    : 'text-text-muted hover:bg-white/5 hover:text-text',
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-border p-4 lg:block">
          <p className="truncate text-sm font-medium text-text">{user?.full_name}</p>
          <p className="truncate text-xs text-text-muted">{user?.email}</p>
          <div className="mt-3 flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
              <Settings size={14} /> Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout()
                navigate('/')
              }}
            >
              <LogOut size={14} />
            </Button>
          </div>
        </div>
      </aside>
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <div>
            <p className="text-sm text-text-muted">Signed in as</p>
            <p className="font-medium">{user?.full_name}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/settings')}>
            Settings
          </Button>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
