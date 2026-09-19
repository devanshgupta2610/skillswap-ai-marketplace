import { api } from './api'
import type {
  AuthResponse,
  Booking,
  BookingStatus,
  ChatMessage,
  ClientProfile,
  CreatorProfile,
  DashboardStats,
  Gig,
  Job,
  MatchResult,
  NotificationItem,
  PortfolioProject,
  Review,
  User,
  UserRole,
} from '@/types'

export const authApi = {
  register: (data: {
    email: string
    password: string
    full_name: string
    role: UserRole
  }) => api.post<AuthResponse>('/auth/register', data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
}

export const creatorApi = {
  profile: () => api.get<CreatorProfile>('/creator/profile').then((r) => r.data),
  updateProfile: (data: Partial<CreatorProfile>) =>
    api.put<CreatorProfile>('/creator/profile', data).then((r) => r.data),
  publicProfile: (userId: number) =>
    api.get<CreatorProfile>(`/creator/public/${userId}`).then((r) => r.data),
  browse: (params?: { q?: string; skill?: string }) =>
    api.get<CreatorProfile[]>('/creator/browse', { params }).then((r) => r.data),
  portfolio: () => api.get<PortfolioProject[]>('/creator/portfolio').then((r) => r.data),
  publicPortfolio: (userId: number) =>
    api.get<PortfolioProject[]>(`/creator/portfolio/user/${userId}`).then((r) => r.data),
  createPortfolio: (form: FormData) =>
    api
      .post<PortfolioProject>('/creator/portfolio', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  dashboard: () => api.get<DashboardStats>('/creator/dashboard').then((r) => r.data),
  previewPortfolio: (form: FormData) =>
    api
      .post<{ title: string; description: string; skills_used: string; tools_used: string }>(
        '/creator/portfolio/preview',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      .then((r) => r.data),
  suggestPricing: (params: { category: string; skills?: string; delivery_days?: number }) =>
    api.post('/creator/pricing/suggest', null, { params }).then((r) => r.data),
}

export const clientApi = {
  profile: () => api.get<ClientProfile>('/client/profile').then((r) => r.data),
  updateProfile: (data: Partial<ClientProfile>) =>
    api.put<ClientProfile>('/client/profile', data).then((r) => r.data),
  createJob: (data: Partial<Job> & { title: string; description: string; category: string }) =>
    api.post<Job>('/client/jobs', data).then((r) => r.data),
  jobs: () => api.get<Job[]>('/client/jobs').then((r) => r.data),
  myJobs: () => api.get<Job[]>('/client/jobs/mine').then((r) => r.data),
  match: (jobId: number) =>
    api.get<MatchResult[]>(`/client/jobs/${jobId}/match`).then((r) => r.data),
  dashboard: () => api.get<DashboardStats>('/client/dashboard').then((r) => r.data),
  saveCreator: (creatorUserId: number) =>
    api.post(`/client/creators/${creatorUserId}/save`).then((r) => r.data),
  savedCreators: () => api.get<CreatorProfile[]>('/client/saved/creators').then((r) => r.data),
  getJob: (id: number) => api.get<Job>(`/client/jobs/${id}`).then((r) => r.data),
}

export const gigApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get<Gig[]>('/gigs', { params }).then((r) => r.data),
  mine: () => api.get<Gig[]>('/gigs/mine').then((r) => r.data),
  get: (id: number) => api.get<Gig>(`/gigs/${id}`).then((r) => r.data),
  create: (data: Partial<Gig>) => api.post<Gig>('/gigs', data).then((r) => r.data),
  update: (id: number, data: Partial<Gig>) =>
    api.put<Gig>(`/gigs/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/gigs/${id}`).then((r) => r.data),
  save: (id: number) => api.post(`/gigs/${id}/save`).then((r) => r.data),
  saved: () => api.get<Gig[]>('/gigs/saved/mine').then((r) => r.data),
}

export const bookingApi = {
  list: () => api.get<Booking[]>('/booking').then((r) => r.data),
  get: (id: number) => api.get<Booking>(`/booking/${id}`).then((r) => r.data),
  create: (data: {
    creator_user_id: number
    title: string
    amount: number
    description?: string
    gig_id?: number
    job_id?: number
    milestones?: { title: string; amount: number; description?: string }[]
  }) => api.post<Booking>('/booking', data).then((r) => r.data),
  update: (id: number, data: { status?: BookingStatus; delivery_notes?: string; delivery_url?: string }) =>
    api.put<Booking>(`/booking/${id}`, data).then((r) => r.data),
}

export const reviewApi = {
  create: (data: { booking_id: number; rating: number; feedback: string }) =>
    api.post<Review>('/review', data).then((r) => r.data),
  forUser: (userId: number) => api.get<Review[]>(`/review/user/${userId}`).then((r) => r.data),
  mine: () => api.get<Review[]>('/review/mine').then((r) => r.data),
}

export const chatApi = {
  inbox: () => api.get<ChatMessage[]>('/chat/inbox').then((r) => r.data),
  conversation: (withUser: number) =>
    api.get<ChatMessage[]>('/chat/conversations', { params: { with_user: withUser } }).then((r) => r.data),
  send: (data: { recipient_id: number; content: string; booking_id?: number }) =>
    api.post<ChatMessage>('/chat/messages', data).then((r) => r.data),
}

export const notificationApi = {
  list: () => api.get<NotificationItem[]>('/notifications').then((r) => r.data),
  markRead: (id: number) => api.post(`/notifications/${id}/read`).then((r) => r.data),
  markAll: () => api.post('/notifications/read-all').then((r) => r.data),
}

export const aiApi = {
  assistant: (message: string, context?: string) =>
    api.post<{ reply: string }>('/ai/assistant', { message, context }).then((r) => r.data),
}
