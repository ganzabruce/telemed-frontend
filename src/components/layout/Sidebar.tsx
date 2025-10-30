// src/components/layout/Sidebar.tsx
import React, { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import {
  LayoutDashboard,
  Users,
  Building2,
  UserPlus,
  UserCog,
  Calendar,
  DollarSign,
  ClipboardList,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { NavLink } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
}

const navigationByRole: Record<string, NavItem[]> = {
  ADMIN: [
    { name: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
    { name: "Hospitals", href: "/admin/hospitals", icon: Building2 },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Invite Admin", href: "/admin/invite-admin", icon: UserPlus },
  ],
  HOSPITAL_ADMIN: [
    { name: "Dashboard", href: "/hospital-admin-dashboard", icon: LayoutDashboard },
    { name: "Staff", href: "/hospital-admin/staff", icon: UserCog },
    { name: "Patients", href: "/hospital-admin/patients", icon: Users },
  ],
  DOCTOR: [
    { name: "Dashboard", href: "/doctor-dashboard", icon: LayoutDashboard },
    { name: "Appointments", href: "/doctor/appointments", icon: Calendar },
    { name: "Patients", href: "/doctor/patients", icon: Users },
  ],
  RECEPTIONIST: [
    { name: "Dashboard", href: "/receptionist-dashboard", icon: LayoutDashboard },
    { name: "Appointments", href: "/receptionist/appointments", icon: Calendar },
    { name: "Patients", href: "/receptionist/patients", icon: Users },
    { name: "Payments", href: "/receptionist/payments", icon: DollarSign },
  ],
  PATIENT: [
    { name: "Dashboard", href: "/patient-dashboard", icon: LayoutDashboard },
    { name: "My Appointments", href: "/patient/appointments", icon: Calendar },
    { name: "Medical Records", href: "/patient/records", icon: ClipboardList },
  ],
}

const Sidebar: React.FC = () => {
  const { state } = useAuth()
  const user = state.user
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!user) return null

  const navigation = navigationByRole[user.role] || []

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ width: 256 }}
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3 }}
        className="bg-white border-r border-gray-200 h-screen p-4 flex flex-col relative"
      >
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-white border-2 border-gray-300 rounded-full p-1 z-10"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        <div className="mb-6 flex items-center gap-2">
          {!isCollapsed && (
            <div>
              <h1 className="text-2xl font-bold text-blue-600">Telemedicine</h1>
              <p className="text-sm text-gray-500 mt-1">{user.role}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 p-2 rounded-lg transition ${
                  isActive
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                } ${isCollapsed ? "justify-center" : ""}`
              }
            >
              <item.icon className="w-5 h-5" />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t mt-4 pt-4">
          <NavLink
            to="/notifications"
            className={`flex items-center gap-3 p-2 text-gray-700 hover:bg-gray-100 rounded-lg ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <Bell className="w-5 h-5" />
            {!isCollapsed && <span>Notifications</span>}
          </NavLink>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}

export default Sidebar