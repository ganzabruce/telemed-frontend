// src/routes/DoctorRoutes.tsx
import { Route } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
import DashboardLayout from "../components/layout/DashboardLayout"
import DoctorDashboard from "../pages/doctor/DoctorDashboard"
import Appointments from "../pages/doctor/Appointments"
import Patients from "../pages/doctor/Patients"

const DoctorRoutes = (
  <Route
    element={
      <ProtectedRoute allowedRoles={["DOCTOR"]}>
        <DashboardLayout />
      </ProtectedRoute>
    }
  >
    <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
    <Route path="/doctor/appointments" element={<Appointments />} />
    <Route path="/doctor/patients" element={<Patients />} />
  </Route>
)

export default DoctorRoutes
