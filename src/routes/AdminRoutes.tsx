// src/routes/AdminRoutes.tsx
import React from "react"
import { Route, Outlet } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
import DashboardLayout from "../components/layout/DashboardLayout"
import AdminDashboard from "../pages/admin/AdminDashboard"
import Hospitals from "../pages/admin/Hospitals"
import Users from "../pages/admin/Users"
import InviteAdmin from "../pages/admin/InviteAdmin"

const AdminRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["ADMIN"]}><Outlet /></ProtectedRoute>}>
    <Route element={<DashboardLayout />}>
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin/hospitals" element={<Hospitals />} />
      <Route path="/admin/users" element={<Users />} />
      <Route path="/admin/invite-admin" element={<InviteAdmin />} />
    </Route>
  </Route>
)

export default AdminRoutes
