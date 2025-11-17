// src/App.tsx
import { lazy, Suspense } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { SocketProvider } from "./context/SocketContext"
import Loading from "./components/common/Loading"
import DashboardLayout from "./components/layout/DashboardLayout"
import ProtectedRoute from "./routes/ProtectedRoute"

// Lazy load all pages for code splitting
const LoginPage = lazy(() => import("./pages/auth/LoginPage"))
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"))
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"))
const CompleteProfilePage = lazy(() => import("./pages/auth/CompleteProfile"))
const LandingPage = lazy(() => import("./pages/landingPage"))
const ProfilePage = lazy(() => import("./pages/shared/ProfilePage"))
const NotificationsPage = lazy(() => import("./pages/user/NotificationsPage"))
const SettingsPage = lazy(() => import("./pages/user/SettingsPage"))

// Import route components (pages within are already lazy loaded)
import AdminRoutes from "./routes/AdminRoutes"
import HospitalAdminRoutes from "./routes/HospitalAdminRoutes"
import DoctorRoutes from "./routes/DoctorRoutes"
import PatientRoutes from "./routes/PatientRoutes"

// Separate component that uses useAuth
const AppRoutes = () => {
  const { state } = useAuth()

  // Show loading while checking authentication
  if (state.isLoading) {
    return <Loading />
  }

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public Route - Login */}
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/register" 
          element={
            state.user ? (
              <Navigate to={`/${state.user.role.toLowerCase().replace('_', '-')}-dashboard`} replace />
            ) : (
              <RegisterPage />
            )
          } 
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/login"
          element={
            state.user ? (
              <Navigate to={`/${state.user.role.toLowerCase().replace('_', '-')}-dashboard`} replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/forgot-password"
          element={
            state.user ? (
              <Navigate to={`/${state.user.role.toLowerCase().replace('_', '-')}-dashboard`} replace />
            ) : (
              <ForgotPasswordPage />
            )
          }
        />

        {/* Shared Routes - Accessible to all authenticated users */}
        <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
          <Route element={<DashboardLayout />}>
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Role-based Routes - Pages within are lazy loaded */}
        {AdminRoutes}
        {HospitalAdminRoutes}
        {DoctorRoutes}
        {PatientRoutes}

      {/* Root Route - Redirect based on auth state */}
      <Route
        path="/"
        element={
          state.user ? (
            <Navigate to={`/${state.user.role.toLowerCase().replace('_', '-')}-dashboard`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Unauthorized Route */}
      <Route
        path="/unauthorized"
        element={
          <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
              <p className="text-xl text-gray-700">Unauthorized Access</p>
              <button
                onClick={() => window.history.back()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go Back
              </button>
            </div>
          </div>
        }
      />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <div className="flex items-center justify-center h-screen bg-gray-100">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-xl text-gray-700">Page Not Found</p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go Home
                </button>
              </div>
            </div>
          }
        />
      </Routes>
    </Suspense>
  )
}

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </Router>
  )
}

export default App