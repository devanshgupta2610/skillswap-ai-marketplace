export type UserRole = 'creator' | 'client'

export interface User {
  id: number
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  avatar_url?: string | null
  created_at: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthResponse {
  user: User
  tokens: TokenPair
}

export interface CreatorProfile {
  id: number
  user_id: number
  headline?: string | null
  bio?: string | null
  skills?: string | null
  tags?: string | null
  experience_years: number
  hourly_rate?: number | null
  location?: string | null
  availability: string
  rating_avg: number
  rating_count: number
  completed_projects: number
  trust_score: number
  full_name?: string | null
  avatar_url?: string | null
  email?: string | null
}

export interface ClientProfile {
  id: number
  user_id: number
  company_name?: string | null
  bio?: string | null
  industry?: string | null
  location?: string | null
  total_spent: number
  jobs_posted: number
  full_name?: string | null
  avatar_url?: string | null
}

export interface PortfolioProject {
  id: number
  creator_id: number
  title: string
  description: string
  skills_used?: string | null
  tools_used?: string | null
  image_url?: string | null
  pdf_url?: string | null
  project_url?: string | null
  ai_generated: boolean
  created_at: string
}

export interface Gig {
  id: number
  creator_id: number
  title: string
  description: string
  category: string
  tags?: string | null
  price: number
  delivery_days: number
  status: string
  image_url?: string | null
  views: number
  orders_count: number
  created_at: string
  creator_name?: string | null
  creator_rating?: number | null
  creator_user_id?: number | null
}

export interface Job {
  id: number
  client_id: number
  title: string
  description: string
  required_skills?: string | null
  budget_min?: number | null
  budget_max?: number | null
  category: string
  status: string
  deadline?: string | null
  created_at: string
  client_name?: string | null
}

export interface MatchResult {
  creator_id: number
  user_id: number
  full_name: string
  headline?: string | null
  skills?: string | null
  trust_score: number
  rating_avg: number
  compatibility_score: number
  matching_reasons: string[]
}

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'submitted'
  | 'completed'
  | 'cancelled'
  | 'declined'

export interface Milestone {
  id: number
  booking_id: number
  title: string
  description?: string | null
  amount: number
  due_date?: string | null
  status: string
  order_index: number
}

export interface Booking {
  id: number
  client_user_id: number
  creator_user_id: number
  gig_id?: number | null
  job_id?: number | null
  title: string
  description?: string | null
  amount: number
  status: BookingStatus
  delivery_notes?: string | null
  delivery_url?: string | null
  created_at: string
  milestones: Milestone[]
  client_name?: string | null
  creator_name?: string | null
}

export interface Review {
  id: number
  booking_id: number
  reviewer_id: number
  reviewee_id: number
  rating: number
  feedback: string
  project_verified: boolean
  created_at: string
  reviewer_name?: string | null
  reviewee_name?: string | null
}

export interface ChatMessage {
  id: number
  conversation_id: string
  sender_id: number
  recipient_id: number
  content: string
  is_read: boolean
  booking_id?: number | null
  created_at: string
  sender_name?: string | null
  recipient_name?: string | null
}

export interface NotificationItem {
  id: number
  type: string
  title: string
  body: string
  link?: string | null
  is_read: boolean
  created_at: string
}

export interface DashboardStats {
  active_bookings: number
  completed_bookings: number
  total_earnings: number
  total_spent: number
  avg_rating: number
  portfolio_count: number
  gig_count: number
  unread_messages: number
  unread_notifications: number
  views: number
}
