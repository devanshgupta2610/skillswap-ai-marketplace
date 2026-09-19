import { useQuery } from '@tanstack/react-query'
import { clientApi, creatorApi } from '@/services/endpoints'
import type { UserRole } from '@/types'

export function useDashboard(role: UserRole | undefined) {
  return useQuery({
    queryKey: [role === 'client' ? 'client-dashboard' : 'creator-dashboard'],
    queryFn: role === 'client' ? clientApi.dashboard : creatorApi.dashboard,
    enabled: !!role,
  })
}
