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
  Building2,
  RefreshCw,
  User
} from 'lucide-react';
import {
  DashboardHeader,
  StatsGrid,
  StatCard,
  ChartCard,
  ListCard,
  PageContainer,
  LoadingState,
  StatusBadge,
  SearchBar
} from '../../components/shared';

// API Base URL
const API_BASE_URL = 'http://localhost:5003';

const HospitalAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalStaff: 0,
    totalDoctors: 0,
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
        appointmentsResponse,
        paymentsResponse
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/hospitals`, { headers }),
        fetch(`${API_BASE_URL}/doctors`, { headers }),
        fetch(`${API_BASE_URL}/appointments`, { headers }),
        fetch(`${API_BASE_URL}/payments`, { headers })
      ]);

      const hospitalsData = await hospitalsResponse.json();
      const doctorsData = await doctorsResponse.json();
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
      ];

      setDashboardData({
        totalStaff: staffList.length,
        totalDoctors: hospitalDoctors.length,
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

  const stats = [
    {
      icon: UserCog,
      value: formatNumber(dashboardData.totalStaff),
      label: 'Total Staff',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: Users,
      value: formatNumber(dashboardData.totalPatients),
      label: 'Total Patients',
      gradient: 'from-green-500 to-green-600'
    },
    {
      icon: Calendar,
      value: formatNumber(dashboardData.totalAppointments),
      label: 'Total Appointments',
      gradient: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: DollarSign,
      value: formatCurrency(dashboardData.totalRevenue),
      label: 'Total Revenue',
      gradient: 'from-purple-500 to-purple-600'
    }
  ];

  const statusStats = [
    {
      icon: Clock,
      value: dashboardData.pendingAppointments,
      label: 'Pending',
      gradient: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: CheckCircle,
      value: dashboardData.confirmedAppointments,
      label: 'Confirmed',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: CheckCircle,
      value: dashboardData.completedAppointments,
      label: 'Completed',
      gradient: 'from-green-500 to-green-600'
    }
  ];

  if (loading) {
    return <LoadingState message="Loading dashboard..." fullScreen />;
  }

  return (
    <PageContainer>
      <DashboardHeader
        icon={Building2}
        title={`${hospitalInfo?.name || 'Hospital'} Dashboard`}
        subtitle="Manage your hospital operations and staff"
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      <StatsGrid stats={stats} columns={4} />

      {/* Appointment Status Overview */}
      <div className="grid grid-cols-3 gap-4 md:gap-6 mb-6">
        {statusStats.map((stat, index) => (
          <StatCard
            key={index}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            gradient={stat.gradient}
          />
        ))}
      </div>

      {/* Charts and Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Activity Chart */}
        <ChartCard title="Monthly Appointments">
          <div className="h-48 flex items-end justify-between gap-3">
            {dashboardData.monthlyAppointments.map((data, index) => {
              const maxValue = Math.max(...dashboardData.monthlyAppointments.map(d => d.count), 1);
              const height = (data.count / maxValue) * 100;
              const isCurrentMonth = index === new Date().getMonth();
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className={`w-full rounded-t-lg transition-all cursor-pointer relative group ${
                      isCurrentMonth ? 'bg-blue-600' : 'bg-blue-400 hover:bg-blue-500'
                    }`}
                    style={{ height: `${height}%`, minHeight: data.count > 0 ? '12px' : '0' }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {data.count} appointments
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${isCurrentMonth ? 'text-blue-600' : 'text-gray-600'}`}>
                    {data.month}
                  </span>
                </div>
              );
            })}
          </div>
        </ChartCard>

        {/* Recent Appointments */}
        <ListCard
          title="Recent Appointments"
          emptyMessage="No recent appointments"
          emptyIcon={<Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
        >
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {dashboardData.recentAppointments.map((appointment, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {appointment.patient?.user?.fullName || 'Patient Name'}
                    </p>
                    <StatusBadge status={appointment.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ListCard>
      </div>

      {/* Staff List */}
      <ListCard
        title="Hospital Staff"
        headerAction={
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search staff..."
            className="w-full sm:w-auto"
          />
        }
        emptyMessage="No staff members found"
        emptyIcon={<Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {dashboardData.staffList
            .filter(staff => 
              staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              staff.role.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((staff, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 truncate">{staff.name}</p>
                    <StatusBadge status={staff.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>{staff.role}</span>
                    {staff.specialization && (
                      <>
                        <span>•</span>
                        <span>{staff.specialization}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </ListCard>
    </PageContainer>
  );
};

export default HospitalAdminDashboard;