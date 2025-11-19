// src/components/layout/Sidebar.tsx
import React, { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { NavLink } from "react-router-dom"
import {  motion } from "framer-motion"
import { navigationByRole } from "../../constants/navigationRoles"

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
          className="fixed inset-0 bg-transparent backdrop-blur-xs bg-opacity-50 z-40 md:hidden"
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
                <div className="flex items-center gap-2 justify-center text-center mx-auto">
                  <img src="/telemed.png" alt="TeleMed" className="w-8 h-8 rounded-full" />
                  <h1 className="text-2xl font-bold text-blue-600">TeleMedecine</h1>
                </div>
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
                <item.icon className="w-5 h-5 shrink-0" />
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
              <Bell className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="text-sm">Notifications</span>}
            </NavLink>
          </div>
        </motion.aside>
    </>
  )
}

export default Sidebar