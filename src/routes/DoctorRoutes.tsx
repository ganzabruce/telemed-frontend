// src/routes/DoctorRoutes.tsx
import { lazy } from "react"
import { Route, Outlet } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
import DashboardLayout from "../components/layout/DashboardLayout"

// Lazy load doctor pages for code splitting
const DoctorDashboard = lazy(() => import("../pages/doctor/DoctorDashboard"))
const DoctorAppointments = lazy(() => import("../pages/doctor/Appointments"))
const DoctorPatientsPage = lazy(() => import("../pages/doctor/Patients"))
const DoctorConsultationsPage = lazy(() => import("../pages/doctor/DoctorConsultationsPage"))
const AvailabilityPage = lazy(() => import("../pages/doctor/Availability"))


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
