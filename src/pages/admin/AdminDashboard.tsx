import  { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  Calendar, 
  DollarSign,
  Shield,
  User,
  Clock
} from 'lucide-react';
import {
  DashboardHeader,
  StatsGrid,
  ChartCard,
  ListCard,
  PageContainer,
  LoadingState,
  StatusBadge
} from '../../components/shared';
const API_BASE_URL = 'http://localhost:5003';

// --- Types ---
interface ActivityPoint {
  month: string;
  count: number;
}

interface DashboardData {
  totalPatients: number;
  totalProviders: number;
  totalAppointments: number;
  totalRevenue: number;
  patientGrowth: number;
  appointmentGrowth: number;
  revenueGrowth: number;
  monthlyActivity: ActivityPoint[];
  consultationOverview: ActivityPoint[];
  recentConsultations: Array<any>;
  complaints: Array<any>;
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const rawUser = localStorage.getItem('user');
      let token: string | null = null;
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          token = parsed?.token ?? null;
        } catch {
          token = null;
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Fetch system-wide report
      const reportResponse = await fetch(`${API_BASE_URL}/reports/system`, { headers });
      const reportData = await reportResponse.json().catch(() => ({}));

      // Fetch all appointments for monthly activity
      const appointmentsResponse = await fetch(`${API_BASE_URL}/appointments?orderBy=appointmentDate&order=desc`, { headers });
      const appointmentsData = await appointmentsResponse.json().catch(() => ({}));
      // Process monthly activity data
      const monthlyActivity = processMonthlyActivity(appointmentsData.data || []);
      const consultationOverview = processConsultationOverview(appointmentsData.data || []);

      // Calculate growth percentages (simulated - you'd need historical data)
      const patientGrowth = Math.floor(Math.random() * 10) + 1;
      const appointmentGrowth = Math.floor(Math.random() * 15) + 5;
      const revenueGrowth = Math.floor(Math.random() * 12) + 3;

      setDashboardData({
        totalPatients: reportData.data?.totalPatients || 0,
        totalProviders: reportData.data?.totalHospitals || 0,
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

  const processMonthlyActivity = (appointments: Array<any>): ActivityPoint[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthCounts = new Array(12).fill(0);

    appointments.forEach(apt => {
      const dateStr = apt?.appointmentDate ?? apt?.createdAt ?? null;
      if (!dateStr) return;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;
      if (date.getFullYear() === currentYear) {
        monthCounts[date.getMonth()]++;
      }
    });

    return months.map((month, index) => ({
      month,
      count: monthCounts[index]
    }));
  };

  const processConsultationOverview = (appointments: Array<any>): ActivityPoint[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const monthCounts = new Array(8).fill(0);

    appointments.forEach(apt => {
      const dateStr = apt?.appointmentDate ?? apt?.createdAt ?? null;
      if (!dateStr) return;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const stats = [
    {
      icon: Users,
      value: formatNumber(dashboardData.totalPatients),
      label: 'Total Patients',
      gradient: 'bg-blue-500'
    },
    {
      icon: Building2,
      value: formatNumber(dashboardData.totalProviders),
      label: 'Healthcare Providers',
      gradient: 'bg-indigo-500'
    },
    {
      icon: Calendar,
      value: formatNumber(dashboardData.totalAppointments),
      label: 'Total Appointments',
      gradient: 'bg-green-500'
    },
    {
      icon: DollarSign,
      value: formatCurrency(dashboardData.totalRevenue),
      label: 'Total Revenue',
      gradient: 'bg-gray-500'
    }
  ];

  if (loading) {
    return <LoadingState message="Loading dashboard..." fullScreen />;
  }

  return (
    <PageContainer>
      <DashboardHeader
        icon={Shield}
        title="Admin Dashboard"
        subtitle="System overview and management"
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      <StatsGrid stats={stats} columns={4} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Activity Chart */}
        <ChartCard title="Monthly Activity">
          <div className="h-48 flex items-end justify-between gap-3">
            {dashboardData.monthlyActivity.map((data, index) => {
              const maxValue = Math.max(...dashboardData.monthlyActivity.map(d => d.count), 1);
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

        {/* Recent Consultations */}
        <ListCard
          title="Recent Appointments"
          emptyMessage="No recent appointments"
          emptyIcon={<Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
        >
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {dashboardData.recentConsultations.map((consultation: any, index: number) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {consultation.patient?.user?.fullName || 'Patient Name'}
                    </p>
                    <StatusBadge status={consultation.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {
                        (() => {
                          const d = consultation?.appointmentDate ? new Date(consultation.appointmentDate) : null;
                          return <span>{d && !isNaN(d.getTime()) ? d.toLocaleDateString() : '-'}</span>;
                        })()
                      }
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{consultation?.type ?? '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ListCard>
      </div>

      {/* System Notifications */}
      <ListCard title="System Notifications">
        <div className="space-y-3">
          {[
            { user: 'System Admin', message: 'New hospital registration pending approval', time: '2h ago' },
            { user: 'Hospital Admin', message: 'Monthly report generated successfully', time: '5h ago' },
            { user: 'System', message: 'Database backup completed', time: '1d ago' },
            { user: 'Payment System', message: 'Payment gateway integration updated', time: '2d ago' }
          ].map((notification, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                <span className="text-white font-semibold text-sm">
                  {notification.user.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm text-gray-900">{notification.user}</h4>
                  <span className="text-xs text-gray-500">{notification.time}</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{notification.message}</p>
              </div>
            </div>
          ))}
        </div>
      </ListCard>
    </PageContainer>
  );
};

export default AdminDashboard;