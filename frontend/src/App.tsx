import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SharedShell } from '@/components/layout/SharedShell'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { CreatorDashboard } from '@/pages/creator/Dashboard'
import { CreatorProfilePage } from '@/pages/creator/Profile'
import { CreatorPortfolioPage } from '@/pages/creator/Portfolio'
import { AIPortfolioBuilderPage } from '@/pages/creator/AIBuilder'
import { CreatorGigsPage } from '@/pages/creator/Gigs'
import { CreatorEarningsPage, CreatorAnalyticsPage } from '@/pages/creator/EarningsAnalytics'
import {
  BrowseCreatorsPage,
  ClientAnalyticsPage,
  ClientDashboard,
  ClientReviewsPage,
  CreatorPublicProfilePage,
  PostJobPage,
} from '@/pages/client/ClientPages'
import { BrowseGigsPage } from '@/pages/client/BrowseGigs'
import { BookingsPage } from '@/pages/shared/Bookings'
import { MessagesPage } from '@/pages/shared/Messages'
import { NotificationsPage, SettingsPage, NotFoundPage } from '@/pages/shared/Misc'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

function CreatorProfileRoute() {
  const { userId } = useParams()
  return <CreatorPublicProfilePage userId={Number(userId)} />
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<ProtectedRoute roles={['creator']} />}>
                <Route element={<DashboardLayout role="creator" />}>
                  <Route path="/creator" element={<CreatorDashboard />} />
                  <Route path="/creator/profile" element={<CreatorProfilePage />} />
                  <Route path="/creator/portfolio" element={<CreatorPortfolioPage />} />
                  <Route path="/creator/ai-builder" element={<AIPortfolioBuilderPage />} />
                  <Route path="/creator/gigs" element={<CreatorGigsPage />} />
                  <Route path="/creator/bookings" element={<BookingsPage />} />
                  <Route path="/creator/messages" element={<MessagesPage />} />
                  <Route path="/creator/earnings" element={<CreatorEarningsPage />} />
                  <Route path="/creator/analytics" element={<CreatorAnalyticsPage />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute roles={['client']} />}>
                <Route element={<DashboardLayout role="client" />}>
                  <Route path="/client" element={<ClientDashboard />} />
                  <Route path="/client/post-job" element={<PostJobPage />} />
                  <Route path="/client/browse" element={<BrowseCreatorsPage />} />
                  <Route path="/client/gigs" element={<BrowseGigsPage />} />
                  <Route path="/client/creators/:userId" element={<CreatorProfileRoute />} />
                  <Route path="/client/bookings" element={<BookingsPage />} />
                  <Route path="/client/messages" element={<MessagesPage />} />
                  <Route path="/client/reviews" element={<ClientReviewsPage />} />
                  <Route path="/client/analytics" element={<ClientAnalyticsPage />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<SharedShell />}>
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#12121a',
                color: '#e8e8ed',
                border: '1px solid rgba(255,255,255,0.08)',
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
