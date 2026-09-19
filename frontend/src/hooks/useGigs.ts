import { useQuery } from '@tanstack/react-query'
import { gigApi } from '@/services/endpoints'

export function useMarketplaceGigs(params?: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['gigs', params],
    queryFn: () => gigApi.list(params),
  })
}

export function useMyGigs() {
  return useQuery({
    queryKey: ['gigs-mine'],
    queryFn: gigApi.mine,
  })
}

export function useSavedGigs() {
  return useQuery({
    queryKey: ['gigs-saved'],
    queryFn: gigApi.saved,
  })
}
