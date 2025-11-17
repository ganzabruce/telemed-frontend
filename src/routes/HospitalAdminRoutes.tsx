import { lazy } from "react"
import { Route, Outlet } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
import DashboardLayout from "../components/layout/DashboardLayout"

// Lazy load hospital admin pages for code splitting
const HospitalAdminDashboard = lazy(() => import("../pages/hospital-admin/HospitalAdminDashboard"))
const StaffManagement = lazy(() => import("@/pages/hospital-admin/Staff").then(module => ({ default: module.StaffManagement })))
const PatientsManagement = lazy(() => import("@/pages/hospital-admin/Patients").then(module => ({ default: module.PatientsManagement })))
const PaymentsPage = lazy(() => import("@/pages/hospital-admin/Payments"))

const hospitalAdmin = (
  <Route element={<ProtectedRoute allowedRoles={["HOSPITAL_ADMIN"]}><Outlet /></ProtectedRoute>}>
    <Route element={<DashboardLayout />}>
      <Route path="/hospital-admin-dashboard" element={<HospitalAdminDashboard />} />
      <Route path="/hospital-admin/staff" element={<StaffManagement />} />
      <Route path="/hospital-admin/patients" element={<PatientsManagement />} />
      <Route path="/hospital-admin/payments" element={<PaymentsPage />} />
    </Route>
  </Route>
)

export default hospitalAdmin
