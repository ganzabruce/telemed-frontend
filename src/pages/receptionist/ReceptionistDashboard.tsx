// import PagePlaceholder from "../../components/common/PagePlaceholder"
// export default function ReceptionistDashboard() {
//   return <PagePlaceholder title="Receptionist Dashboard" description="Overview of appointments and daily activity." />
// }


import { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  Eye
} from 'lucide-react';

// API Base URL
const API_BASE_URL = 'http://localhost:5001';

const ReceptionistDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    todayAppointments: 0,
    totalPatients: 0,
    totalPayments: 0,
    pendingPayments: 0,
    recentAppointments: [],
    upcomingAppointments: [],
    recentPayments: [],
    appointmentStats: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch appointments
      const appointmentsResponse = await fetch(`${API_BASE_URL}/appointments`, { headers });
      const appointmentsData = await appointmentsResponse.json();
      const appointments = appointmentsData.data || [];

      // Fetch payments
      const paymentsResponse = await fetch(`${API_BASE_URL}/payments`, { headers });
      const paymentsData = await paymentsResponse.json();
      const payments = paymentsData.data || [];

      // Calculate statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const totalAppointments = appointments.length;
      const pendingAppointments = appointments.filter(a => a.status === 'PENDING').length;
      const confirmedAppointments = appointments.filter(a => a.status === 'CONFIRMED').length;
      const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;
      
      const todayAppointments = appointments.filter(a => {
        const aptDate = new Date(a.appointmentDate);
        return aptDate >= today && aptDate < tomorrow;
      }).length;

      // Get unique patients
      const uniquePatients = new Set(appointments.map(a => a.patientId));
      const totalPatients = uniquePatients.size;

      // Payment statistics
      const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const pendingPayments = payments.filter(p => p.status === 'PENDING').length;

      // Recent appointments (last 5)
      const recentAppointments = appointments
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      // Upcoming appointments (next 5)
      const upcomingAppointments = appointments
        .filter(a => new Date(a.appointmentDate) >= new Date() && a.status !== 'CANCELLED')
        .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
        .slice(0, 5);

      // Recent payments
      const recentPayments = payments
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      // Appointment stats by month
      const appointmentStats = processMonthlyStats(appointments);

      setDashboardData({
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        todayAppointments,
        totalPatients,
        totalPayments,
        pendingPayments,
        recentAppointments,
        upcomingAppointments,
        recentPayments,
        appointmentStats
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyStats = (appointments) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentYear = new Date().getFullYear();
    const monthCounts = new Array(6).fill(0);

    appointments.forEach(apt => {
      const date = new Date(apt.appointmentDate || apt.createdAt);
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth();
        if (monthIndex < 6) {
          monthCounts[monthIndex]++;
        }
      }
    });

    return months.map((month, index) => ({
      month,
      count: monthCounts[index]
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PAID':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'PAID':
        return <CheckCircle className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'CANCELLED':
      case 'FAILED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredAppointments = dashboardData.recentAppointments.filter(apt => {
    const matchesSearch = searchQuery === '' || 
      apt.patient?.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || apt.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Receptionist Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage appointments, patients, and payments</p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        {/* Today's Appointments */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">Today</span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{dashboardData.todayAppointments}</h3>
          <p className="text-blue-100 text-sm">Appointments Today</p>
        </div>

        {/* Pending Appointments */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{dashboardData.pendingAppointments}</h3>
              <div className="flex items-center mt-2">
                <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-sm text-yellow-600 font-medium">Awaiting Confirmation</span>
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Total Patients */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Patients</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{dashboardData.totalPatients}</h3>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500 font-medium">Active</span>
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Payments</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{formatCurrency(dashboardData.totalPayments)}</h3>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-500">{dashboardData.pendingPayments} pending</span>
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-xl font-bold text-gray-900">{dashboardData.confirmedAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-xl font-bold text-gray-900">{dashboardData.completedAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{dashboardData.totalAppointments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Appointment Trends */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Trends</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {dashboardData.appointmentStats.map((data, index) => {
              const maxValue = Math.max(...dashboardData.appointmentStats.map(d => d.count), 1);
              const height = (data.count / maxValue) * 100;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer relative group"
                       style={{ height: `${height}%`, minHeight: data.count > 0 ? '8px' : '0' }}>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {data.count} appointments
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">{data.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
            <span className="text-sm text-blue-600 font-medium cursor-pointer hover:underline">View All</span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {dashboardData.upcomingAppointments.length > 0 ? (
              dashboardData.upcomingAppointments.map((appointment, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="bg-blue-100 p-2 rounded-lg mt-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {appointment.patient?.user?.fullName || 'Unknown Patient'}
                    </p>
                    <p className="text-xs text-gray-600">
                      Dr. {appointment.doctor?.user?.fullName || 'Unknown Doctor'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(appointment.appointmentDate)}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(appointment.status)} flex items-center gap-1`}>
                    {getStatusIcon(appointment.status)}
                    {appointment.status}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming appointments</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Appointments Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white w-full sm:w-auto"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Patient</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden md:table-cell">Doctor</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden lg:table-cell">Date & Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden sm:table-cell">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                          {appointment.patient?.user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'P'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {appointment.patient?.user?.fullName || 'Unknown Patient'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 md:hidden">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500">View Details</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <p className="text-sm text-gray-900">
                        Dr. {appointment.doctor?.user?.fullName || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appointment.doctor?.specialization || 'General'}
                      </p>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <p className="text-sm text-gray-900">
                        {formatDate(appointment.appointmentDate)}
                      </p>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {appointment.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border inline-flex items-center gap-1 ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        {appointment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-700 p-1 hover:bg-gray-100 rounded transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    No appointments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Payments Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
          <span className="text-sm text-blue-600 font-medium cursor-pointer hover:underline">View All</span>
        </div>
        <div className="space-y-3">
          {dashboardData.recentPayments.length > 0 ? (
            dashboardData.recentPayments.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${payment.status === 'PAID' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    <DollarSign className={`w-5 h-5 ${payment.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {payment.patient?.user?.fullName || 'Unknown Patient'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.method} • {formatDate(payment.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                  <span className={`text-xs font-medium ${payment.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No recent payments</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;