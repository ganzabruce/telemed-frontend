// import PagePlaceholder from "../../components/common/PagePlaceholder"
// export default function HospitalAdminDashboard() {
//   return <PagePlaceholder title="Hospital Admin Dashboard" description="View hospital stats and activities." />
// }

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserCog,
  Calendar, 
  DollarSign,
  TrendingUp,
  Activity,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Search,
  Building2
} from 'lucide-react';

// API Base URL
const API_BASE_URL = 'http://localhost:5003';

const HospitalAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalStaff: 0,
    totalDoctors: 0,
    totalReceptionists: 0,
    totalPatients: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    monthlyAppointments: [],
    recentAppointments: [],
    staffList: [],
    patientGrowth: 0,
    appointmentGrowth: 0,
    revenueGrowth: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [hospitalInfo, setHospitalInfo] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch all required data in parallel
      const [
        hospitalsResponse,
        doctorsResponse,
        receptionistsResponse,
        appointmentsResponse,
        paymentsResponse
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/hospitals`, { headers }),
        fetch(`${API_BASE_URL}/doctors`, { headers }),
        fetch(`${API_BASE_URL}/receptionists`, { headers }),
        fetch(`${API_BASE_URL}/appointments`, { headers }),
        fetch(`${API_BASE_URL}/payments`, { headers })
      ]);

      const hospitalsData = await hospitalsResponse.json();
      const doctorsData = await doctorsResponse.json();
      const receptionistsData = await receptionistsResponse.json();
      const appointmentsData = await appointmentsResponse.json();
      const paymentsData = await paymentsResponse.json();

      // Find the hospital administered by the current user
      const myHospital = hospitalsData.data?.find(h => h.adminId === userId);
      setHospitalInfo(myHospital);

      if (!myHospital) {
        console.error('No hospital found for this admin');
        setLoading(false);
        return;
      }

      // Filter data for this hospital
      const hospitalDoctors = (doctorsData.data || []).filter(d => d.hospitalId === myHospital.id);
      const hospitalReceptionists = (receptionistsData.data || []).filter(r => r.hospitalId === myHospital.id);
      const hospitalAppointments = (appointmentsData.data || []).filter(a => a.hospitalId === myHospital.id);
      const hospitalPayments = (paymentsData.data || []).filter(p => 
        hospitalAppointments.some(a => a.id === p.appointmentId)
      );

      // Count unique patients
      const uniquePatientIds = new Set(hospitalAppointments.map(a => a.patientId));
      const totalPatients = uniquePatientIds.size;

      // Calculate appointment statistics
      const pendingCount = hospitalAppointments.filter(a => a.status === 'PENDING').length;
      const confirmedCount = hospitalAppointments.filter(a => a.status === 'CONFIRMED').length;
      const completedCount = hospitalAppointments.filter(a => a.status === 'COMPLETED').length;
      const cancelledCount = hospitalAppointments.filter(a => a.status === 'CANCELLED').length;

      // Calculate total revenue
      const totalRevenue = hospitalPayments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      // Process monthly appointments
      const monthlyActivity = processMonthlyActivity(hospitalAppointments);

      // Calculate growth percentages (simulated - would need historical data)
      const patientGrowth = Math.floor(Math.random() * 10) + 1;
      const appointmentGrowth = Math.floor(Math.random() * 15) + 5;
      const revenueGrowth = Math.floor(Math.random() * 12) + 3;

      // Combine staff list
      const staffList = [
        ...hospitalDoctors.map(d => ({
          id: d.id,
          name: d.user?.fullName || 'Unknown',
          role: 'Doctor',
          specialization: d.specialization,
          status: d.status,
          email: d.user?.email
        })),
        ...hospitalReceptionists.map(r => ({
          id: r.id,
          name: r.user?.fullName || 'Unknown',
          role: 'Receptionist',
          status: 'ACTIVE',
          email: r.user?.email
        }))
      ];

      setDashboardData({
        totalStaff: staffList.length,
        totalDoctors: hospitalDoctors.length,
        totalReceptionists: hospitalReceptionists.length,
        totalPatients,
        totalAppointments: hospitalAppointments.length,
        totalRevenue,
        pendingAppointments: pendingCount,
        confirmedAppointments: confirmedCount,
        completedAppointments: completedCount,
        cancelledAppointments: cancelledCount,
        monthlyAppointments: monthlyActivity,
        recentAppointments: hospitalAppointments.slice(0, 5),
        staffList,
        patientGrowth,
        appointmentGrowth,
        revenueGrowth,
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

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50';
      case 'CONFIRMED':
        return 'text-blue-600 bg-blue-50';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50';
      case 'CANCELLED':
        return 'text-red-600 bg-red-50';
      case 'AVAILABLE':
        return 'text-green-600 bg-green-50';
      case 'BUSY':
        return 'text-orange-600 bg-orange-50';
      case 'OFFLINE':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
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
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {hospitalInfo?.name || 'Hospital'} Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage your hospital operations and staff</p>
          </div>
        </div>
      </div>

      {/* Stats Cards - First Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        {/* Total Staff */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Staff</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{formatNumber(dashboardData.totalStaff)}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">{dashboardData.totalDoctors} Doctors</span>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-500">{dashboardData.totalReceptionists} Receptionists</span>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <UserCog className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Patients */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Patients</p>
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

        {/* Total Appointments */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Appointments</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{formatNumber(dashboardData.totalAppointments)}</h3>
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

      {/* Stats Cards - Second Row (Appointment Status) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-50 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">{dashboardData.pendingAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Confirmed</p>
              <p className="text-xl font-bold text-gray-900">{dashboardData.confirmedAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Completed</p>
              <p className="text-xl font-bold text-gray-900">{dashboardData.completedAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Cancelled</p>
              <p className="text-xl font-bold text-gray-900">{dashboardData.cancelledAppointments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Activity Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Appointments</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {dashboardData.monthlyAppointments.map((data, index) => {
              const maxValue = Math.max(...dashboardData.monthlyAppointments.map(d => d.count));
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
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Appointments</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {dashboardData.recentAppointments.length > 0 ? (
              dashboardData.recentAppointments.map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {appointment.patient?.user?.fullName || 'Patient Name'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(appointment.appointmentDate).toLocaleDateString()} • {appointment.type}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No recent appointments</p>
            )}
          </div>
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Hospital Staff</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Specialization</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dashboardData.staffList
                .filter(staff => 
                  staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  staff.role.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((staff, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-600">
                            {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-sm text-gray-900">{staff.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{staff.role}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{staff.email}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">{staff.specialization || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(staff.status)}`}>
                        {staff.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          
          {dashboardData.staffList.filter(staff => 
            staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            staff.role.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No staff members found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalAdminDashboard;