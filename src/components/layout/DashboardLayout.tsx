
import React from "react"
import Sidebar from "./Sidebar"
import { Outlet, useNavigate } from "react-router-dom"
import { Bell, Search, User, Settings, LogOut, Menu } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

const DashboardLayout: React.FC = () => {
  const { state, dispatch } = useAuth()
  const navigate = useNavigate()
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false)

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" })
    navigate("/login")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      "ADMIN": "Admin",
      "HOSPITAL_ADMIN": "Hospital Admin",
      "DOCTOR": "Doctor",
      "RECEPTIONIST": "Receptionist",
      "PATIENT": "Patient"
    }
    return roleMap[role] || role
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.profile-dropdown')) {
        setIsProfileOpen(false)
      }
    }

    if (isProfileOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isProfileOpen])

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      
      {/* Main Content Area - with left margin to account for fixed sidebar on desktop */}
      <div className="flex-1 flex flex-col w-full md:ml-64 transition-all duration-300 min-w-0">
        {/* Modern Navbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Mobile Menu Button & Logo */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
                >
                  <Menu className="w-6 h-6" />
                </button>
                
                {/* Mobile Logo - visible only on mobile */}
                <div className="md:hidden">
                  <h1 className="text-xl font-bold text-blue-600">TeleMedecine</h1>
                </div>
              </div>

              {/* Search Bar - hidden on mobile */}
              <div className="hidden md:flex flex-1 max-w-2xl">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-2 md:gap-4 md:ml-6">
                {/* Search button for mobile */}
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors md:hidden">
                  <Search className="w-5 h-5" />
                </button>

                {/* Notifications */}
                <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Profile Dropdown */}
                {state.user && (
                  <div className="relative profile-dropdown">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-2 md:gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">
                          {getInitials(state.user.fullName)}
                        </span>
                      </div>
                      <div className="text-left hidden lg:block">
                        <p className="text-sm font-medium text-gray-700">
                          {state.user.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getRoleDisplay(state.user.role)}
                        </p>
                      </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                        {/* User Info Section */}
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900">
                            {state.user.fullName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 break-all">
                            {state.user.email}
                          </p>
                          {state.user.phone && (
                            <p className="text-xs text-gray-500">
                              {state.user.phone}
                            </p>
                          )}
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <button 
                            onClick={() => {
                              setIsProfileOpen(false)
                              navigate("/profile")
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <User className="w-4 h-4" />
                            Profile
                          </button>
                          <button 
                            onClick={() => {
                              setIsProfileOpen(false)
                              navigate("/settings")
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            Settings
                          </button>
                        </div>

                        <hr className="my-1 border-gray-200" />
                        
                        <button 
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 w-full overflow-x-hidden">
          <Outlet />
        </main>

        {/* Modern Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="px-4 md:px-6 py-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                © 2025 TeleMed. All rights reserved.
              </div>
              
              <div className="flex items-center gap-4 md:gap-6">
                <a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Support
                </a>
              </div>

              <div className="text-xs md:text-sm text-gray-500">
                Version 1.0.0
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default DashboardLayout