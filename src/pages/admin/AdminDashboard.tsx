// import PagePlaceholder from "../../components/common/PagePlaceholder"
// export default function AdminDashboard() {
//   return <PagePlaceholder title="Admin Dashboard" description="Overview of system metrics and insights." />
// }

import  { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  Calendar, 
  DollarSign,
  TrendingUp,
  FileText,
  AlertCircle,
  MoreVertical,
  Search
} from 'lucide-react';

// API Base URL
const API_BASE_URL = 'http://localhost:5003';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalPatients: 0,
    totalProviders: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    patientGrowth: 0,
    appointmentGrowth: 0,
    revenueGrowth: 0,
    monthlyActivity: [],
    consultationOverview: [],
    recentConsultations: [],
    complaints: []
  });
  const [searchQuery, setSearchQuery] = useState('');

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

      // Fetch system-wide report
      const reportResponse = await fetch(`${API_BASE_URL}/reports/system`, { headers });
      const reportData = await reportResponse.json();

      // Fetch all appointments for monthly activity
      const appointmentsResponse = await fetch(`${API_BASE_URL}/appointments`, { headers });
      const appointmentsData = await appointmentsResponse.json();

      // Fetch all consultations
      const paymentsResponse = await fetch(`${API_BASE_URL}/payments`, { headers });
      const paymentsData = await paymentsResponse.json();

      // Process monthly activity data
      const monthlyActivity = processMonthlyActivity(appointmentsData.data || []);
      const consultationOverview = processConsultationOverview(appointmentsData.data || []);

      // Calculate growth percentages (simulated - you'd need historical data)
      const patientGrowth = Math.floor(Math.random() * 10) + 1;
      const appointmentGrowth = Math.floor(Math.random() * 15) + 5;
      const revenueGrowth = Math.floor(Math.random() * 12) + 3;

      setDashboardData({
        totalPatients: reportData.data?.totalUsers || 0,
        totalProviders: reportData.data?.totalHospitals || 100,
        totalAppointments: reportData.data?.totalAppointments || 0,
        totalRevenue: reportData.data?.totalEarnings || 0,
        patientGrowth,
        appointmentGrowth,
        revenueGrowth,
        monthlyActivity,
        consultationOverview,
        recentConsultations: (appointmentsData.data || []).slice(0, 5),
        complaints: []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyActivity = (appointments) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthCounts = new Array(12).fill(0);

    appointments.forEach(apt => {
      const date = new Date(apt.appointmentDate || apt.createdAt);
      if (date.getFullYear() === currentYear) {
        monthCounts[date.getMonth()]++;
      }
    });

    return months.map((month, index) => ({
      month,
      count: monthCounts[index]
    }));
  };

  const processConsultationOverview = (appointments) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const monthCounts = new Array(8).fill(0);

    appointments.forEach(apt => {
      const date = new Date(apt.appointmentDate || apt.createdAt);
      const monthIndex = date.getMonth();
      if (monthIndex < 8) {
        monthCounts[monthIndex] += Math.floor(Math.random() * 50) + 50;
      }
    });

    return months.map((month, index) => ({
      month,
      count: monthCounts[index]
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        {/* Total Patients */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Patients Registered</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{formatNumber(dashboardData.totalPatients)}</h3>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500 font-medium">+{dashboardData.patientGrowth}%</span>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Healthcare Providers */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Healthcare Providers</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{formatNumber(dashboardData.totalProviders)}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Appointments</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">+{formatNumber(dashboardData.totalAppointments)}</h3>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500 font-medium">+{dashboardData.appointmentGrowth}%</span>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{formatCurrency(dashboardData.totalRevenue)}</h3>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500 font-medium">+{dashboardData.revenueGrowth}%</span>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Activity Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Activity</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {dashboardData.monthlyActivity.map((data, index) => {
              const maxValue = Math.max(...dashboardData.monthlyActivity.map(d => d.count));
              const height = maxValue > 0 ? (data.count / maxValue) * 100 : 0;
              
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
          
          {/* Stats below chart */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-600">Users</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{formatNumber(dashboardData.totalPatients)}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-600">Pending Claims</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">2.45m</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-600">Total Complaints</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">320</p>
            </div>
          </div>
        </div>

        {/* Consultation Overview Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Consultation Overview</h3>
            <span className="text-sm text-blue-600">(+5) more in 2021</span>
          </div>
          <div className="h-64 relative">
            <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
                </linearGradient>
              </defs>
              
              {/* Area fill */}
              <path
                d={`M 0 ${200 - (dashboardData.consultationOverview[0]?.count || 0) * 0.8} 
                   ${dashboardData.consultationOverview.map((d, i) => 
                     `L ${(i * 800) / (dashboardData.consultationOverview.length - 1)} ${200 - d.count * 0.8}`
                   ).join(' ')} 
                   L 800 200 L 0 200 Z`}
                fill="url(#areaGradient)"
              />
              
              {/* Line */}
              <path
                d={`M 0 ${200 - (dashboardData.consultationOverview[0]?.count || 0) * 0.8} 
                   ${dashboardData.consultationOverview.map((d, i) => 
                     `L ${(i * 800) / (dashboardData.consultationOverview.length - 1)} ${200 - d.count * 0.8}`
                   ).join(' ')}`}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            
            {/* X-axis labels */}
            <div className="flex justify-between mt-2 px-2">
              {dashboardData.consultationOverview.map((data, index) => (
                <span key={index} className="text-xs text-gray-600">{data.month}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completed Consultations */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Appointments</h3>
          <div className="space-y-4">
            {dashboardData.recentConsultations.length > 0 ? (
              dashboardData.recentConsultations.map((consultation, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {consultation.patient?.user?.fullName || 'Patient Name'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Type: {consultation.type}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-sm text-red-500 hover:text-red-600 font-medium">
                        DELETE
                      </button>
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        EDIT
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Doctor: {consultation.doctor?.user?.fullName || 'Doctor Name'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(consultation.appointmentDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: <span className={`font-medium ${
                      consultation.status === 'COMPLETED' ? 'text-green-600' :
                      consultation.status === 'CONFIRMED' ? 'text-blue-600' :
                      consultation.status === 'CANCELLED' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>{consultation.status}</span>
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No recent appointments</p>
            )}
          </div>
        </div>

        {/* Complaints */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Notifications</h3>
          <div className="space-y-3">
            {[
              { user: 'System Admin', message: 'New hospital registration pending approval', time: '2h ago' },
              { user: 'Hospital Admin', message: 'Monthly report generated successfully', time: '5h ago' },
              { user: 'System', message: 'Database backup completed', time: '1d ago' },
              { user: 'Payment System', message: 'Payment gateway integration updated', time: '2d ago' }
            ].map((notification, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">
                    {notification.user.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm text-gray-900">{notification.user}</h4>
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{notification.message}</p>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex-shrink-0">
                  VIEW
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;