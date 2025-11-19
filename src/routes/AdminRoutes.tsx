// src/routes/AdminRoutes.tsx
import { lazy } from "react"
import { Route, Outlet } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
import DashboardLayout from "../components/layout/DashboardLayout"

// Lazy load admin pages for code splitting
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"))
const Hospitals = lazy(() => import("../pages/admin/Hospitals").then(module => ({ default: module.Hospitals })))
const UsersManagement = lazy(() => import("../pages/admin/Users"))
const InviteAdmin = lazy(() => import("../pages/admin/InviteAdmin").then(module => ({ default: module.InviteAdmin })))
const Services = lazy(() => import("../pages/admin/Services"))
const Team = lazy(() => import("../pages/admin/Team"))
const Insurance = lazy(() => import("../pages/admin/Insurance"))

const AdminRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["ADMIN"]}><Outlet /></ProtectedRoute>}>
    <Route element={<DashboardLayout />}>
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin/hospitals" element={<Hospitals />} />
      <Route path="/admin/users" element={<UsersManagement />} />
      <Route path="/admin/invite-admin" element={<InviteAdmin />} />
      <Route path="/admin/services" element={<Services />} />
      <Route path="/admin/team" element={<Team />} />
      <Route path="/admin/insurance" element={<Insurance />} />
    </Route>
  </Route>
)

export default AdminRoutes
