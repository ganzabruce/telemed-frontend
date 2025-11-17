
import { lazy } from "react"
import { Route, Outlet } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
import DashboardLayout from "../components/layout/DashboardLayout"

// Lazy load patient pages for code splitting
const PatientDashboard = lazy(() => import("../pages/patient/PatientDashboard"))
const AppointmentsPage = lazy(() => import("../pages/patient/Appointments"))
const RecordsPage = lazy(() => import("../pages/patient/Records"))
const PatientConsultationPage = lazy(() => import("@/pages/patient/PatientConsultationPage"))
const BrowseHospitalsPage = lazy(() => import("../pages/patient/BrowseHospitals"))


const PatientRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["PATIENT"]}><Outlet /></ProtectedRoute>}>
    <Route element={<DashboardLayout />}>
      <Route path="/patient-dashboard" element={<PatientDashboard />} />
      <Route path="/patient/browse-hospitals" element={<BrowseHospitalsPage />} />
      <Route path="/patient/appointments" element={<AppointmentsPage />} />
      <Route path="/patient/consultations" element={<PatientConsultationPage />} />
      <Route path="/patient/records" element={<RecordsPage />} />
    </Route>
  </Route>
)

export default PatientRoutes
