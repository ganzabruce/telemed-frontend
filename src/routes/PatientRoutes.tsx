

import { Route, Outlet } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
import DashboardLayout from "../components/layout/DashboardLayout"
import PatientDashboard from "../pages/patient/PatientDashboard"
import Appointments from "../pages/patient/Appointments"
import Records from "../pages/patient/Records"

const PatientRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["PATIENT"]}><Outlet /></ProtectedRoute>}>
    <Route element={<DashboardLayout />}>
      <Route path="/patient-dashboard" element={<PatientDashboard />} />
      <Route path="/patient/appointments" element={<Appointments />} />
      <Route path="/patient/records" element={<Records />} />
    </Route>
  </Route>
)

export default PatientRoutes
