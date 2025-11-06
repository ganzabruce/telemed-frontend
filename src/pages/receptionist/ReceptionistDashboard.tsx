import React, { useState, useEffect, useCallback } from 'react';
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
  Eye,
  RefreshCw,
  ClipboardList,
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

// Types moved to top so they can be used in useState generics and helper signatures
interface User {
  fullName?: string;
  [key: string]: unknown;
}

interface Patient {
  id?: string;
  user?: User;
  [key: string]: unknown;
}

interface Doctor {
  user?: User;
  specialization?: string;
  [key: string]: unknown;
}

interface Appointment {
  patient?: Patient;
  doctor?: Doctor;
  appointmentDate?: string;
  createdAt?: string;
  status?: string;
  type?: string;
  patientId?: string;
  [key: string]: unknown;
}

interface Payment {
  patient?: Patient;
  amount?: number | string;
  status?: string;
  method?: string;
  createdAt?: string;
  [key: string]: unknown;
}

interface AppointmentStat {
  month: string;
  count: number;
}

type StatusType = 'COMPLETED' | 'PAID' | 'PENDING' | 'CANCELLED' | 'FAILED' | string;

// API Base URL
const API_BASE_URL = 'http://localhost:5003';

const ReceptionistDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    totalAppointments: number;
    pendingAppointments: number;
    confirmedAppointments: number;
    completedAppointments: number;
    todayAppointments: number;
    totalPatients: number;
    totalPayments: number;
    pendingPayments: number;
    recentAppointments: Appointment[];
    upcomingAppointments: Appointment[];
    recentPayments: Payment[];
    appointmentStats: AppointmentStat[];
  }>({
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

  // intentionally only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = (() => {
        const raw = localStorage.getItem('user');
        if (!raw) return null;
        try {
          return JSON.parse(raw).token;
        } catch {
          return null;
        }
      })();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch appointments
      const appointmentsResponse = await fetch(`${API_BASE_URL}/appointments`, { headers });
      const appointmentsData = await appointmentsResponse.json();
      const appointments: Appointment[] = (appointmentsData.data as Appointment[]) || [];

      // Fetch payments
      const paymentsResponse = await fetch(`${API_BASE_URL}/payments`, { headers });
      const paymentsData = await paymentsResponse.json();
      const payments: Payment[] = (paymentsData.data as Payment[]) || [];

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
        if (!a.appointmentDate) return false;
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
        .sort((a, b) => (new Date(b.createdAt ?? 0)).getTime() - (new Date(a.createdAt ?? 0)).getTime())
        .slice(0, 5);

      // Upcoming appointments (next 5)
      const upcomingAppointments = appointments
        .filter(a => (a.appointmentDate ? new Date(a.appointmentDate) : new Date(0)) >= new Date() && a.status !== 'CANCELLED')
        .sort((a, b) => (new Date(a.appointmentDate ?? 0)).getTime() - (new Date(b.appointmentDate ?? 0)).getTime())
        .slice(0, 5);

      // Recent payments
      const recentPayments = payments
        .sort((a, b) => (new Date(b.createdAt ?? 0)).getTime() - (new Date(a.createdAt ?? 0)).getTime())
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

  const processMonthlyStats = (appointments: Appointment[]): AppointmentStat[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentYear = new Date().getFullYear();
    const monthCounts = new Array(6).fill(0);

    appointments.forEach((apt: Appointment) => {
      const date: Date = new Date(apt.appointmentDate ?? apt.createdAt ?? 0);
      if (date.getFullYear() === currentYear) {
      const monthIndex: number = date.getMonth();
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

  const formatCurrency = (amount: number | string = 0): string => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(Number(amount));
  };

  const formatDate = (dateString?: string | number): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status?: StatusType) => {
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

  

  const getStatusIcon = (status?: StatusType): React.ReactElement => {
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

  const stats = [
    {
      icon: Calendar,
      value: dashboardData.todayAppointments,
      label: "Today's Appointments",
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: Clock,
      value: dashboardData.pendingAppointments,
      label: 'Pending Review',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      icon: Users,
      value: dashboardData.totalPatients,
      label: 'Total Patients',
      gradient: 'from-green-500 to-green-600'
    },
    {
      icon: DollarSign,
      value: formatCurrency(dashboardData.totalPayments),
      label: 'Total Payments',
      gradient: 'from-purple-500 to-purple-600'
    }
  ];

  const statusStats = [
    {
      icon: CheckCircle,
      value: dashboardData.confirmedAppointments,
      label: 'Confirmed',
      gradient: 'from-green-500 to-green-600'
    },
    {
      icon: CheckCircle,
      value: dashboardData.completedAppointments,
      label: 'Completed',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: Calendar,
      value: dashboardData.totalAppointments,
      label: 'Total',
      gradient: 'from-gray-500 to-gray-600'
    }
  ];

  if (loading) {
    return <LoadingState message="Loading dashboard..." fullScreen />;
  }

  return (
    <PageContainer>
      <DashboardHeader
        icon={ClipboardList}
        title="Receptionist Dashboard"
        subtitle="Manage appointments, patients, and payments"
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

      {/* Charts and Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Appointment Trends */}
        <ChartCard title="Appointment Trends">
          <div className="h-48 flex items-end justify-between gap-3">
            {dashboardData.appointmentStats.map((data, index) => {
              const maxValue = Math.max(...dashboardData.appointmentStats.map(d => d.count), 1);
              const height = (data.count / maxValue) * 100;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full rounded-t-lg transition-all cursor-pointer relative group bg-blue-400 hover:bg-blue-500"
                    style={{ height: `${height}%`, minHeight: data.count > 0 ? '12px' : '0' }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {data.count} appointments
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-600">{data.month}</span>
                </div>
              );
            })}
          </div>
        </ChartCard>

        {/* Upcoming Appointments */}
        <ListCard
          title="Upcoming Appointments"
          emptyMessage="No upcoming appointments"
          emptyIcon={<Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
        >
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {dashboardData.upcomingAppointments.map((appointment, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {appointment.patient?.user?.fullName || 'Unknown Patient'}
                    </p>
                    <StatusBadge status={appointment.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(appointment.appointmentDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ListCard>
      </div>

      {/* Recent Appointments Section */}
      <ListCard
        title="Recent Appointments"
        className="mb-6"
        headerAction={
          <div className="flex flex-col sm:flex-row gap-2">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search patient..."
              className="w-full sm:w-auto"
            />
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
        }
        emptyMessage="No appointments found"
        emptyIcon={<Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredAppointments.map((appointment, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900 truncate">
                    {appointment.patient?.user?.fullName || 'Unknown Patient'}
                  </p>
                  <StatusBadge status={appointment.status} size="sm" />
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(appointment.appointmentDate)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Dr. {appointment.doctor?.user?.fullName || 'Unknown'}</span>
                  </div>
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

      {/* Recent Payments Section */}
      <ListCard
        title="Recent Payments"
        emptyMessage="No recent payments"
        emptyIcon={<DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
      >
        <div className="space-y-3">
          {dashboardData.recentPayments.map((payment, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  payment.status === 'PAID' ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  <DollarSign className={`w-6 h-6 ${payment.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`} />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900 truncate">
                    {payment.patient?.user?.fullName || 'Unknown Patient'}
                  </p>
                  <StatusBadge status={payment.status} size="sm" />
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{formatCurrency(payment.amount)}</span>
                  <span>•</span>
                  <span>{payment.method}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ListCard>
    </PageContainer>
  );
};

export default ReceptionistDashboard;