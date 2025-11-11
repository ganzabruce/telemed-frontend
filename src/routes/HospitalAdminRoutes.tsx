
import { Route, Outlet } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
import DashboardLayout from "../components/layout/DashboardLayout"
import HospitalAdminDashboard from "../pages/hospital-admin/HospitalAdminDashboard"
import { StaffManagement } from "@/pages/hospital-admin/Staff"
import { PatientsManagement } from "@/pages/hospital-admin/Patients"
import PaymentsPage from "@/pages/hospital-admin/Payments"

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
