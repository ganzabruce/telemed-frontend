
import React from "react"
import Sidebar from "./Sidebar"
import { Outlet, useNavigate } from "react-router-dom"
import { Bell, Search, User, Settings, LogOut, Menu, Info, AlertTriangle, XCircle, CheckCircle, ArrowRight, Clock } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useSocket } from "../../context/SocketContext"
import { getNotifications, markNotificationAsRead, type Notification } from "../../api/notificationsApi"

const DashboardLayout: React.FC = () => {
  const { state, dispatch } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false)
  const [unreadNotifications, setUnreadNotifications] = React.useState(0)
  const [recentNotifications, setRecentNotifications] = React.useState<Notification[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = React.useState(false)

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
      "PATIENT": "Patient"
    }
    return roleMap[role] || role
  }

  // Fetch notifications
  const fetchNotifications = React.useCallback(async () => {
    if (!state.user) return;
    
    try {
      const notifications = await getNotifications(20) // Get last 20 notifications
      setRecentNotifications(notifications)
      const unread = notifications.filter(n => n.status === 'SENT').length
      setUnreadNotifications(unread)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [state.user])

  // Fetch unread notifications count and recent notifications
  React.useEffect(() => {
    if (state.user) {
      fetchNotifications()
      
      // Subscribe to user notifications via socket
      if (socket && state.user.id) {
        socket.emit('subscribeToUserNotifications', state.user.id)
        
        // Listen for new notifications
        const handleNewNotification = () => {
          fetchNotifications()
        }
        
        socket.on('newNotification', handleNewNotification)
        
        return () => {
          socket.off('newNotification', handleNewNotification)
          if (state.user?.id) {
            socket.emit('unsubscribeFromUserNotifications', state.user.id)
          }
        }
      }
    }
  }, [socket, state.user, fetchNotifications])

  // Fetch notifications when dropdown is opened
  React.useEffect(() => {
    if (isNotificationsOpen) {
      setIsLoadingNotifications(true)
      fetchNotifications().finally(() => setIsLoadingNotifications(false))
    }
  }, [isNotificationsOpen, fetchNotifications])

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.profile-dropdown')) {
        setIsProfileOpen(false)
      }
      if (!target.closest('.notifications-dropdown')) {
        setIsNotificationsOpen(false)
      }
    }

    if (isProfileOpen || isNotificationsOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isProfileOpen, isNotificationsOpen])

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'SENT') {
      try {
        await markNotificationAsRead(notification.id)
        setRecentNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, status: 'READ' as const } : n)
        )
        setUnreadNotifications(prev => Math.max(0, prev - 1))
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'INFO':
        return <Info className="w-4 h-4 text-blue-500" />
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

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

                {/* Notifications Dropdown */}
                <div className="relative notifications-dropdown">
                  <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown Menu */}
                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[32rem] flex flex-col">
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        {unreadNotifications > 0 && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            {unreadNotifications} new
                          </span>
                        )}
                      </div>

                      {/* Notifications List */}
                      <div className="flex-1 overflow-y-auto">
                        {isLoadingNotifications ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        ) : recentNotifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 px-4">
                            <Bell className="w-12 h-12 text-gray-300 mb-2" />
                            <p className="text-gray-500 text-sm font-medium">No notifications</p>
                            <p className="text-gray-400 text-xs mt-1">You're all caught up!</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {recentNotifications.map((notification) => (
                              <button
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                                  notification.status === 'SENT' ? 'bg-blue-50/50' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 mt-0.5">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 font-medium line-clamp-2">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-gray-500">
                                        {formatNotificationTime(notification.createdAt)}
                                      </span>
                                      {notification.status === 'SENT' && (
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer with View All button */}
                      <div className="px-4 py-3 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setIsNotificationsOpen(false)
                            navigate('/notifications')
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View All Notifications
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                {state.user && (
                  <div className="relative profile-dropdown">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-2 md:gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
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