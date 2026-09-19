import { useQuery } from '@tanstack/react-query'
import { notificationApi } from '@/services/endpoints'

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.list,
  })
}
