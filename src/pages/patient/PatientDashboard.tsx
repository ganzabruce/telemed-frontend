import { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  Video,
  Phone,
  MessageSquare,
  Heart,
  Activity,
  CheckCircle,
  User,
  CreditCard,
} from 'lucide-react';
import StartConversationModal from '../../components/shared/StartConversationModal';
import DashboardHeader from '../../components/shared/DashboardHeader';
import StatsGrid from '../../components/shared/StatsGrid';
import StatCard from '../../components/shared/StatCard';
import ChartCard from '../../components/shared/ChartCard';
import ListCard from '../../components/shared/ListCard';
import PageContainer from '../../components/shared/PageContainer';
import LoadingState from '../../components/shared/LoadingState';

import StatusBadge from '../../components/shared/StatusBadge';
import { API_BASE_URL } from '../../utils/apiConfig';

// --- Types ---
interface UserRef {
  id?: string;
  fullName?: string;
}

interface Doctor {
  id?: string;
  user?: UserRef;
  specialization?: string;
}

interface Appointment {
  id?: string;
  appointmentDate?: string;
  status?: string;
  type?: string;
  doctor?: Doctor | null;
  doctorId?: string;
  patient?: any;
}

interface Payment {
  id?: string;
  amount?: string | number | null;
  status?: string;
}

interface MonthlyData {
  month: string;
  count: number;
}

interface RecentDoctor {
  id?: string;
  userId?: string | undefined;
  name: string;
  specialization?: string;
  lastVisit?: string;
  type?: string;
}

interface DashboardData {
  upcomingAppointments: Appointment[];
  pastAppointments: Appointment[];
  totalAppointments: number;
  completedAppointments: number;
  upcomingCount: number;
  cancelledCount: number;
  totalSpent: number;
  unpaidCount: number;
  consultationHistory: { video: number; audio: number; chat: number };
  recentDoctors: RecentDoctor[];
  nextAppointment: Appointment | null;
  monthlyAppointments: MonthlyData[];
  patientInfo: any;
  hospitalInfo: any;
}

const PatientDashboard = () => {

  const [loading, setLoading] = useState<boolean>(true);
  const [showStartConversationModal, setShowStartConversationModal] = useState<boolean>(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    upcomingAppointments: [],
    pastAppointments: [],
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingCount: 0,
    cancelledCount: 0,
    totalSpent: 0,
    unpaidCount: 0,
    consultationHistory: { video: 0, audio: 0, chat: 0 },
    recentDoctors: [],
    nextAppointment: null,
    monthlyAppointments: [],
    patientInfo: null,
    hospitalInfo: null
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (): Promise<void> => {
    setLoading(true);
    try {
      let token: string | null = null;
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const parsed = JSON.parse(raw);
          token = parsed?.token ?? null;
        }
      } catch (err) {
        token = null;
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch appointments, payments and hospitals
      const [appointmentsResponse, paymentsResponse, hospitalsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/appointments?orderBy=appointmentDate&order=desc`, { headers }),
        fetch(`${API_BASE_URL}/payments`, { headers }),
        fetch(`${API_BASE_URL}/hospitals`, { headers })
      ]);

      const appointmentsData = await appointmentsResponse.json().catch(() => ({}));
      const paymentsData = await paymentsResponse.json().catch(() => ({}));
      const hospitalsData = await hospitalsResponse.json().catch(() => ({}));

      // Get patient's appointments
      const myAppointments: Appointment[] = (appointmentsData?.data || []);
      
      // Separate upcoming and past appointments
      const now = new Date();
      const upcoming = myAppointments
        .filter(a => {
          const apptDate = new Date(a.appointmentDate ?? '');
          return apptDate >= now && (a.status === 'PENDING' || a.status === 'CONFIRMED');
        })
        .sort((a, b) => new Date(a.appointmentDate ?? '').getTime() - new Date(b.appointmentDate ?? '').getTime());

      const past = myAppointments
        .filter(a => {
          const apptDate = new Date(a.appointmentDate ?? '');
          return apptDate < now || a.status === 'COMPLETED' || a.status === 'CANCELLED';
        })
        .sort((a, b) => new Date(b.appointmentDate ?? '').getTime() - new Date(a.appointmentDate ?? '').getTime());

      // Get next appointment
      const nextAppt = upcoming[0] || null;

      // Count appointment statuses
      const completed = myAppointments.filter(a => a.status === 'COMPLETED').length;
      const cancelled = myAppointments.filter(a => a.status === 'CANCELLED').length;

      // Calculate consultation type breakdown
      const videoCount = myAppointments.filter(a => (a.type ?? '').toUpperCase() === 'VIDEO').length;
      const audioCount = myAppointments.filter(a => (a.type ?? '').toUpperCase() === 'AUDIO').length;
      const chatCount = myAppointments.filter(a => (a.type ?? '').toUpperCase() === 'CHAT').length;

      // Calculate payments
      const myPayments: Payment[] = (paymentsData?.data || []);
      const totalSpent = myPayments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const unpaidCount = myPayments.filter(p => p.status === 'PENDING').length;

      // Get recent doctors
      const recentDoctors = getRecentDoctors(myAppointments);

      // Process monthly appointments
      const monthlyActivity = processMonthlyAppointments(myAppointments);

      // Get patient info (from first appointment if available)
      const patientInfo = myAppointments[0]?.patient || null;
      
      // Get hospital info
      const hospitalInfo = hospitalsData?.data?.[0] || null;

      setDashboardData({
        upcomingAppointments: upcoming.slice(0, 5),
        pastAppointments: past.slice(0, 5),
        totalAppointments: myAppointments.length,
        completedAppointments: completed,
        upcomingCount: upcoming.length,
        cancelledCount: cancelled,
        totalSpent,
        unpaidCount,
        consultationHistory: { video: videoCount, audio: audioCount, chat: chatCount },
        recentDoctors,
        nextAppointment: nextAppt,
        monthlyAppointments: monthlyActivity,
        patientInfo,
        hospitalInfo
      });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
  };

  const getRecentDoctors = (appointments: Appointment[]): RecentDoctor[] => {
     const doctorMap = new Map<string | undefined, RecentDoctor>();

    appointments
      .filter(a => a.doctor)
      .sort((a, b) => new Date(b.appointmentDate ?? '').getTime() - new Date(a.appointmentDate ?? '').getTime())
      .forEach(a => {
        const key = a.doctorId;
        if (!doctorMap.has(key)) {
          const name = a.doctor?.user?.fullName ?? 'Dr. Unknown';
          doctorMap.set(key, {
            id: a.doctorId,
            userId: a.doctor?.user?.id,
            name,
            specialization: a.doctor?.specialization,
            lastVisit: a.appointmentDate,
            type: a.type
          });
        }
      });

    return Array.from(doctorMap.values()).slice(0, 4);
  };

  const processMonthlyAppointments = (appointments: Appointment[]): MonthlyData[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthCounts = new Array(12).fill(0);

    appointments.forEach(apt => {
      const date = new Date(apt.appointmentDate ?? '');
      if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
        monthCounts[date.getMonth()]++;
      }
    });

    return months.map((month, index) => ({
      month,
      count: monthCounts[index]
    }));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (dateString?: string | null) => {
    const date = new Date(dateString ?? '');
    if (isNaN(date.getTime())) {
      return { date: '-', time: '-' };
    }

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };



  const getTypeIcon = (type?: string | null) => {
    switch ((type ?? '').toUpperCase()) {
      case 'VIDEO':
        return <Video className="w-4 h-4" />;
      case 'AUDIO':
        return <Phone className="w-4 h-4" />;
      case 'CHAT':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };


  const stats = [
    {
      icon: Activity,
      value: dashboardData.totalAppointments,
      label: 'Total Visits',

    },
    {
      icon: Calendar,
      value: dashboardData.upcomingCount,
      label: 'Upcoming',
      gradient: 'bg-green-500'
    },
    {
      icon: CreditCard,
      value: formatCurrency(dashboardData.totalSpent),
      label: 'Total Spent',
      gradient: 'bg-gray-500'
    },
    {
      icon: CheckCircle,
      value: dashboardData.completedAppointments,
      label: 'Completed',
      gradient: 'bg-orange-500'
    }
  ];

  const consultationStats = [
    {
      icon: Video,
      value: dashboardData.consultationHistory.video,
      label: 'Video Calls',
      gradient: 'bg-gray-500'
    },
    {
      icon: Phone,
      value: dashboardData.consultationHistory.audio,
      label: 'Audio Calls',
      gradient: 'bg-blue-500'
    },
    {
      icon: MessageSquare,
      value: dashboardData.consultationHistory.chat,
      label: 'Chat',
      gradient: 'bg-green-500'
    }
  ];

  if (loading) {
    return <LoadingState message="Loading dashboard..." fullScreen />;
  }

  return (
    <>
      <StartConversationModal
        isOpen={showStartConversationModal}
        onClose={() => {
          setShowStartConversationModal(false);
          setSelectedDoctorId(null);
        }}
        userRole="PATIENT"
        preselectedUserId={selectedDoctorId || undefined}
      />
      <PageContainer>
        <DashboardHeader
          icon={Heart}
          title="Patient Dashboard"
          subtitle="Your health dashboard"
          onRefresh={fetchDashboardData}
          loading={loading}
        />

        <StatsGrid stats={stats} columns={4} />

        {/* Consultation Stats - Mobile-Optimized Layout */}
        <div className="mb-6">
          {/* Mobile: Horizontal scrollable cards */}
          <div className="flex sm:hidden gap-3 overflow-x-auto pb-2 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {consultationStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="shrink-0 w-[calc(100vw-2rem)] max-w-[280px] bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${stat.gradient} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs font-medium text-gray-600 truncate">{stat.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden sm:grid sm:grid-cols-3 gap-4 md:gap-6">
            {consultationStats.map((stat, index) => (
              <StatCard
                key={index}
                icon={stat.icon}
                value={stat.value}
                label={stat.label}
                gradient={stat.gradient}
                className="w-full"
              />
            ))}
          </div>
        </div>

        {/* Main Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Appointments List - 2 columns */}
          <ListCard
            title="Upcoming Appointments"
            className="lg:col-span-2"
            emptyMessage="No appointments scheduled"
            emptyIcon={<Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          >
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {dashboardData.upcomingAppointments.map((appointment, index) => {
                const dateTime = formatDateTime(appointment.appointmentDate);
                return (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                    <div className="shrink-0">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 truncate">
                          Dr. {appointment.doctor?.user?.fullName || 'Unknown'}
                        </p>
                        <StatusBadge status={appointment.status ?? 'UNKNOWN'} size="sm" />
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{dateTime.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getTypeIcon(appointment.type)}
                          <span>{appointment.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      
                    </div>
                  </div>
                );
              })}
            </div>
          </ListCard>

          {/* Recent Doctors */}
          <ListCard
            title="Your Doctors"
            emptyMessage="No doctors yet"
          >
            <div className="space-y-3">
              {dashboardData.recentDoctors.map((doctor, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {doctor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{doctor.name}</p>
                    <p className="text-xs text-gray-500">{doctor.specialization}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDoctorId(doctor.userId ?? null);
                      setShowStartConversationModal(true);
                    }}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Start conversation"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </ListCard>
        </div>

        {/* Monthly Activity Chart */}
        <ChartCard title="This Month's Activity">
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
                      {data.count} visits
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
      </PageContainer>
    </>
  );
};

export default PatientDashboard;