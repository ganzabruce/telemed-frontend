import React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"


interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { state } = useAuth()
  const location = useLocation()
  const user = state.user

  // If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If allowedRoles is specified, check if user has permission
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute