// src/routes/ReceptionistRoutes.tsx

import { Route } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
import DashboardLayout from "../components/layout/DashboardLayout"
import ReceptionistDashboard from "../pages/receptionist/ReceptionistDashboard"
import Appointments from "../pages/receptionist/Appointments"
import Patients from "../pages/receptionist/Patients"
import Payments from "../pages/receptionist/Payments"

const ReceptionistRoutes = (
  <Route
    element={
      <ProtectedRoute allowedRoles={["RECEPTIONIST"]}>
        <DashboardLayout />
      </ProtectedRoute>
    }
  >
    <Route path="/receptionist-dashboard" element={<ReceptionistDashboard />} />
    <Route path="/receptionist/appointments" element={<Appointments />} />
    <Route path="/receptionist/patients" element={<Patients />} />
    <Route path="/receptionist/payments" element={<Payments />} />
  </Route>
)

export default ReceptionistRoutes