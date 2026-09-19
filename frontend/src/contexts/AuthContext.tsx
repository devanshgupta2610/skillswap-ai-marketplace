import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '@/services/endpoints'
import { getErrorMessage } from '@/services/api'
import type { AuthResponse, User, UserRole } from '@/types'
import toast from 'react-hot-toast'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: {
    email: string
    password: string
    full_name: string
    role: UserRole
  }) => Promise<User>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function persistAuth(res: AuthResponse) {
  localStorage.setItem('access_token', res.tokens.access_token)
  localStorage.setItem('refresh_token', res.tokens.refresh_token)
  localStorage.setItem('user', JSON.stringify(res.user))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as User) : null
  })
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await authApi.me()
      setUser(me)
      localStorage.setItem('user', JSON.stringify(me))
    } catch {
      setUser(null)
      localStorage.removeItem('user')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await authApi.login({ email, password })
      persistAuth(res)
      setUser(res.user)
      toast.success('Welcome back')
      return res.user
    } catch (err) {
      toast.error(getErrorMessage(err))
      throw err
    }
  }, [])

  const register = useCallback(
    async (data: { email: string; password: string; full_name: string; role: UserRole }) => {
      try {
        const res = await authApi.register(data)
        persistAuth(res)
        setUser(res.user)
        toast.success('Account created')
        return res.user
      } catch (err) {
        toast.error(getErrorMessage(err))
        throw err
      }
    },
    [],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
    toast.success('Signed out')
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
