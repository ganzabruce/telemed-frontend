// src/routes/DoctorRoutes.tsx
import { Route, Outlet } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
import DashboardLayout from "../components/layout/DashboardLayout"
import DoctorDashboard from "../pages/doctor/DoctorDashboard"
import DoctorAppointments from "../pages/doctor/Appointments"
import DoctorPatientsPage from "../pages/doctor/Patients"
import DoctorConsultationsPage from "../pages/doctor/DoctorConsultationsPage"
import AvailabilityPage from "../pages/doctor/Availability"


const DoctorRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["DOCTOR"]}><Outlet /></ProtectedRoute>}>
    <Route element={<DashboardLayout />}>
      <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
      <Route path="/doctor/appointments" element={<DoctorAppointments />} />
      <Route path="/doctor/consultations" element={<DoctorConsultationsPage />} />
      <Route path="/doctor/patients" element={<DoctorPatientsPage />} />
      <Route path="/doctor/availability" element={<AvailabilityPage />} />
    </Route>
  </Route>
)

export default DoctorRoutes
