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
  Stethoscope,
  X,
} from "lucide-react"
import { NavLink } from "react-router-dom"
import {  motion } from "framer-motion"

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
    { name: "Consultations", href: "/doctor/consultations", icon: Stethoscope },
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
    { name: "My Consultations", href: "/patient/consultations", icon: Stethoscope },
    { name: "Medical Records", href: "/patient/records", icon: ClipboardList },
  ],
}

interface SidebarProps {
  isMobileOpen: boolean
  onMobileClose: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
  const { state } = useAuth()
  const user = state.user
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    handleResize() // Check on mount
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!user) return null

  const navigation = navigationByRole[user.role] || []

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const handleNavClick = () => {
    // Close mobile menu when a nav item is clicked
    if (window.innerWidth < 768) {
      onMobileClose()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? 256 : (isCollapsed ? 80 : 256),
        }}
        transition={{ duration: 0.3 }}
        className={`
          bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-50 p-4 flex flex-col
          transition-transform duration-300
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        
          {/* Close button for mobile */}
          <button
            onClick={onMobileClose}
            className="absolute right-4 top-4 p-2 rounded-lg hover:bg-gray-100 md:hidden"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Collapse button for desktop */}
          <button
            onClick={toggleSidebar}
            className="hidden md:block absolute -right-3 top-6 bg-white border-2 border-gray-300 rounded-full p-1 z-10 hover:bg-gray-50 transition-colors"
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
                <p className="text-sm text-gray-500 mt-1">{user.role.replace('_', ' ')}</p>
              </div>
            )}
            {isCollapsed && (
              <div className="w-full flex justify-center">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 rounded-lg transition ${
                    isActive
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  } ${isCollapsed ? "justify-center" : ""}`
                }
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm">{item.name}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="border-t mt-4 pt-4">
            <NavLink
              to="/notifications"
              onClick={handleNavClick}
              className={`flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-100 rounded-lg ${
                isCollapsed ? "justify-center" : ""
              }`}
              title={isCollapsed ? "Notifications" : undefined}
            >
              <Bell className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm">Notifications</span>}
            </NavLink>
          </div>
        </motion.aside>
    </>
  )
}

export default Sidebar