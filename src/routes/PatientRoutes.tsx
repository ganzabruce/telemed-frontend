

import { Route, Outlet } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
import DashboardLayout from "../components/layout/DashboardLayout"
import PatientDashboard from "../pages/patient/PatientDashboard"
import AppointmentsPage from "../pages/patient/Appointments"
import RecordsPage from "../pages/patient/Records"
import PatientConsultationPage from "@/pages/patient/PatientConsultationPage"


const PatientRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["PATIENT"]}><Outlet /></ProtectedRoute>}>
    <Route element={<DashboardLayout />}>
      <Route path="/patient-dashboard" element={<PatientDashboard />} />
      <Route path="/patient/appointments" element={<AppointmentsPage />} />
      <Route path="/patient/consultations" element={<PatientConsultationPage />} />
      <Route path="/patient/records" element={<RecordsPage />} />
    </Route>
  </Route>
)

export default PatientRoutes
