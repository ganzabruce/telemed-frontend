// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { SocketProvider } from "./context/SocketContext"
import LoginPage from "./pages/auth/LoginPage"
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage"
import Loading from "./components/common/Loading"
import AdminRoutes from "./routes/AdminRoutes"
import HospitalAdminRoutes from "./routes/HospitalAdminRoutes"
import DoctorRoutes from "./routes/DoctorRoutes"
import PatientRoutes from "./routes/PatientRoutes"
import LandingPage from "./pages/landingPage"
import ProfilePage from "./pages/shared/ProfilePage"
import CompleteProfilePage from "./pages/auth/CompleteProfile"
import RegisterPage from "./pages/auth/RegisterPage"
import NotificationsPage from "./pages/user/NotificationsPage"
import SettingsPage from "./pages/user/SettingsPage"
import DashboardLayout from "./components/layout/DashboardLayout"
import ProtectedRoute from "./routes/ProtectedRoute"

// Separate component that uses useAuth
const AppRoutes = () => {
  const { state } = useAuth()

  // Show loading while checking authentication
  if (state.isLoading) {
    return <Loading />
  }

  return (
    <Routes>
      {/* Public Route - Login */}
      <Route path="/complete-profile" element={<CompleteProfilePage />} />
      <Route
        path="/"
        element={<LandingPage />}
      />
      <Route path="/register" element={
          state.user ? (
            <Navigate to={`/${state.user.role.toLowerCase().replace('_', '-')}-dashboard`} replace />
          ) : (
            <RegisterPage />
          )
        } 
      />
      <Route
        path="/profile"
        element={<ProfilePage />}
      />
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

      {/* Role-based Routes */}
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