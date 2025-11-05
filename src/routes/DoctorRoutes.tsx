// src/routes/DoctorRoutes.tsx
import { Route } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
import DashboardLayout from "../components/layout/DashboardLayout"
import DoctorDashboard from "../pages/doctor/DoctorDashboard"
import DoctorAppointments from "../pages/doctor/Appointments"
import DoctorPatientsPage from "../pages/doctor/Patients"


const DoctorRoutes = (
  <Route
    element={
      <ProtectedRoute allowedRoles={["DOCTOR"]}>
        <DashboardLayout />
      </ProtectedRoute>
    }
  >
    <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
    <Route path="/doctor/appointments" element={<DoctorAppointments />} />
    <Route path="/doctor/patients" element={<DoctorPatientsPage />} />
  </Route>
)

export default DoctorRoutes
