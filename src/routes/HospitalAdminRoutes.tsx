
import { Route } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
import DashboardLayout from "../components/layout/DashboardLayout"
import HospitalAdminDashboard from "../pages/hospital-admin/HospitalAdminDashboard"
import Staff from "../pages/hospital-admin/Staff"
import Patients from "../pages/hospital-admin/Patients"

const hospitalAdmin = (
  <Route
    element={
      <ProtectedRoute allowedRoles={["HOSPITAL_ADMIN"]}>
        <DashboardLayout />
      </ProtectedRoute>
    }
  >
    <Route path="/hospital-admin-dashboard" element={<HospitalAdminDashboard />} />
    <Route path="/hospital-admin/staff" element={<Staff />} />
    <Route path="/hospital-admin/patients" element={<Patients />} />
  </Route>
)

export default hospitalAdmin
