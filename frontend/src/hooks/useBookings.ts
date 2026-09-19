import { useQuery } from '@tanstack/react-query'
import { bookingApi } from '@/services/endpoints'

export function useBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: bookingApi.list,
  })
}
