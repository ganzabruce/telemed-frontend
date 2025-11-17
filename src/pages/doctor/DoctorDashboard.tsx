import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar,
  Clock,
  CheckCircle,
  Video,
  Phone,
  MessageSquare,
  User,
  Stethoscope,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import DashboardHeader from '../../components/shared/DashboardHeader';
import StatsGrid from '../../components/shared/StatsGrid';
import StatCard from '../../components/shared/StatCard';
import ChartCard from '../../components/shared/ChartCard';
import ListCard from '../../components/shared/ListCard';

// API Base URL
const API_BASE_URL = 'https://telemedicine-backend-dtna.onrender.com';

// --- Types ---
interface UserRef {
  id?: string;
  fullName?: string;
}

interface PatientRef {
  user?: UserRef | null;
}

interface Appointment {
  id?: string;
  appointmentDate?: string | null;
  status?: string | null;
  type?: string | null;
  doctorId?: string;
  patientId?: string;
  patient?: PatientRef | null;
}

interface DoctorProfile {
  id?: string;
  userId?: string;
  status?: string;
  specialization?: string;
}

interface WeeklyData {
  day: string;
  count: number;
}

interface DashboardData {
  totalAppointments: number;
  todayAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  totalPatients: number;
  pendingCount: number;
  confirmedCount: number;
  todaySchedule: Appointment[];
  upcomingSchedule: Appointment[];
  recentPatients: Array<{ id?: string; name: string; lastVisit?: string; status?: string; type?: string }>;
  consultationBreakdown: { video: number; audio: number; chat: number };
  weeklyAppointments: WeeklyData[];
  status: string;
  specialization: string;
}

const DoctorDashboard = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalAppointments: 0,
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalPatients: 0,
    pendingCount: 0,
    confirmedCount: 0,
    todaySchedule: [],
    upcomingSchedule: [],
    recentPatients: [],
    consultationBreakdown: { video: 0, audio: 0, chat: 0 },
    weeklyAppointments: [],
    status: 'OFFLINE',
    specialization: '',
  });
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getAuthToken = () => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.token;
    }
    return null;
  };

  const fetchDashboardData = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id;
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch appointments and doctors data
      const [appointmentsResponse, doctorsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/appointments?orderBy=appointmentDate&order=desc`, { headers }),
        axios.get(`${API_BASE_URL}/doctors`, { headers })
      ]);

      const appointmentsData = appointmentsResponse.data as any;
      const doctorsData = doctorsResponse.data as any;

      // Find the doctor profile for the current user
      const doctorsList = (doctorsData?.data as DoctorProfile[]) || [];
      const myDoctorProfile = doctorsList.find((d: DoctorProfile) => d.userId === userId) || null;
      setDoctorProfile(myDoctorProfile);

      if (!myDoctorProfile) {
        setError('No doctor profile found');
        setLoading(false);
        return;
      }

      // Filter appointments for this doctor
      const apptsList = (appointmentsData?.data as Appointment[]) || [];
      const myAppointments = apptsList.filter((a: Appointment) => a.doctorId === myDoctorProfile.id);
      setAppointments(myAppointments);

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Filter appointments by status and date
      const todayAppts = myAppointments.filter((a: Appointment) => {
        const apptDate = new Date(a.appointmentDate ?? '');
        return !isNaN(apptDate.getTime()) && apptDate >= today && apptDate < tomorrow;
      });

      const upcomingAppts = myAppointments
        .filter((a: Appointment) => {
          const apptDate = new Date(a.appointmentDate ?? '');
          return !isNaN(apptDate.getTime()) && apptDate >= tomorrow;
        })
        .sort((a: Appointment, b: Appointment) => (new Date(a.appointmentDate ?? '').getTime() - new Date(b.appointmentDate ?? '').getTime()));

      const completedAppts = myAppointments.filter((a: Appointment) => a.status === 'COMPLETED');
      const pendingAppts = myAppointments.filter((a: Appointment) => a.status === 'PENDING');
      const confirmedAppts = myAppointments.filter((a: Appointment) => a.status === 'CONFIRMED');

      // Count unique patients
      const uniquePatientIds = new Set(myAppointments.map((a: Appointment) => a.patientId));

      // Calculate consultation type breakdown
      const videoCount = myAppointments.filter((a: Appointment) => (a.type ?? '').toUpperCase() === 'VIDEO').length;
      const audioCount = myAppointments.filter((a: Appointment) => (a.type ?? '').toUpperCase() === 'AUDIO').length;
      const chatCount = myAppointments.filter((a: Appointment) => (a.type ?? '').toUpperCase() === 'CHAT').length;

      // Process weekly appointments
      const weeklyActivity = processWeeklyActivity(myAppointments);

      // Get recent unique patients
      const recentPatients = getRecentPatients(myAppointments);

      setDashboardData({
        totalAppointments: myAppointments.length,
        todayAppointments: todayAppts.length,
        upcomingAppointments: upcomingAppts.length,
        completedAppointments: completedAppts.length,
        totalPatients: uniquePatientIds.size,
        pendingCount: pendingAppts.length,
        confirmedCount: confirmedAppts.length,
        todaySchedule: todayAppts.slice(0, 10),
        upcomingSchedule: upcomingAppts.slice(0, 10),
        recentPatients,
        consultationBreakdown: { video: videoCount, audio: audioCount, chat: chatCount },
        weeklyAppointments: weeklyActivity,
        status: myDoctorProfile?.status || 'OFFLINE',
        specialization: myDoctorProfile?.specialization || '',
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      const msg = (err as any)?.response?.data?.message || (err instanceof Error ? err.message : String(err));
      setError(msg || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyActivity = (appointments: Appointment[]): WeeklyData[] => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayCounts = new Array(7).fill(0);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

    appointments.forEach((apt: Appointment) => {
      const aptDate = new Date(apt.appointmentDate ?? '');
      if (isNaN(aptDate.getTime())) return;
      const daysDiff = Math.floor((aptDate.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff < 7) {
        dayCounts[daysDiff]++;
      }
    });

    return days.map((day, index) => ({
      day,
      count: dayCounts[index]
    }));
  };

  const getRecentPatients = (appointments: Appointment[]) => {
    const patientMap = new Map<string | undefined, { id?: string; name: string; lastVisit?: string; status?: string; type?: string }>();

    appointments
      .filter((a: Appointment) => !!a.patient?.user?.fullName)
      .sort((a: Appointment, b: Appointment) => (new Date(b.appointmentDate ?? '').getTime() - new Date(a.appointmentDate ?? '').getTime()))
      .forEach((a: Appointment) => {
        if (!patientMap.has(a.patientId)) {
          patientMap.set(a.patientId, {
            id: a.patientId,
            name: a.patient?.user?.fullName ?? 'Unknown',
            lastVisit: a.appointmentDate ?? undefined,
            status: a.status ?? undefined,
            type: a.type ?? undefined
          });
        }
      });

    return Array.from(patientMap.values()).slice(0, 5);
  };

  const formatDate = (dateString?: string | null) => {
    const date = new Date(dateString ?? '');
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString?: string | null) => {
    const date = new Date(dateString ?? '');
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status?: string | null) => {
    switch ((status ?? '').toUpperCase()) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'CONFIRMED':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'CANCELLED':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
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

  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 font-medium text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="text-red-600 font-medium mb-2">Error loading dashboard</p>
            <p className="text-red-500 text-sm">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentSchedule = activeTab === 'today' ? dashboardData.todaySchedule : dashboardData.upcomingSchedule;

  const stats = [
    {
      icon: Calendar,
      value: dashboardData.totalAppointments,
      label: 'Total Appointments',

    },
    {
      icon: Clock,
      value: dashboardData.pendingCount,
      label: 'Pending Review',
      gradient: 'bg-orange-500'
    },
    {
      icon: CheckCircle,
      value: dashboardData.confirmedCount,
      label: 'Confirmed',

    },
    {
      icon: CheckCircle,
      value: dashboardData.completedAppointments,
      label: 'Completed',
      gradient: 'bg-green-500 '
    }
  ];

  const consultationStats = [
    {
      icon: Video,
      value: dashboardData.consultationBreakdown.video,
      label: 'Video Calls',
      gradient: 'bg-gray-500 '
    },
    {
      icon: Phone,
      value: dashboardData.consultationBreakdown.audio,
      label: 'Audio Calls',

    },
    {
      icon: MessageSquare,
      value: dashboardData.consultationBreakdown.chat,
      label: 'Chat',
      gradient: 'bg-green-500 '
    }
  ];

  const statusBadge = (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
      dashboardData.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
      dashboardData.status === 'BUSY' ? 'bg-orange-100 text-orange-700' :
      'bg-gray-100 text-gray-700'
    }`}>
      {dashboardData.status}
    </span>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <DashboardHeader
        icon={Stethoscope}
        title="Doctor Dashboard"
        subtitle={dashboardData.specialization || 'Specialization'}
        onRefresh={fetchDashboardData}
        loading={loading}
        actionButton={statusBadge}
      />

      <StatsGrid stats={stats} columns={4} />

      <div className="grid grid-cols-3 gap-4 md:gap-6 mb-6">
        {consultationStats.map((stat, index) => (
          <StatCard
            key={index}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            gradient={stat.gradient}
          />
        ))}
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Schedule - Takes 2 columns */}
        <ListCard
          title="Schedule"
          className="lg:col-span-2"
          headerAction={
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('today')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'today'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Today ({dashboardData.todayAppointments})
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'upcoming'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Upcoming ({dashboardData.upcomingAppointments})
              </button>
            </div>
          }
          emptyMessage="No appointments scheduled"
          emptyIcon={<Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
        >
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {currentSchedule.length > 0 && currentSchedule.map((appointment) => (
                  <div key={appointment.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                    <div className="shrink-0">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {appointment.patient?.user?.fullName || 'Patient Name'}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTime(appointment.appointmentDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getTypeIcon(appointment.type)}
                          <span>{appointment.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {appointment.status === 'CONFIRMED' && (
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                          Start
                        </button>
                      )}
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
          </div>
        </ListCard>

        {/* Recent Patients */}
        <ListCard
          title="Recent Patients"
          emptyMessage="No recent patients"
        >
          <div className="space-y-3">
            {dashboardData.recentPatients.length > 0 && dashboardData.recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{patient.name}</p>
                    <p className="text-xs text-gray-500">{formatDate(patient.lastVisit)}</p>
                  </div>
                  <div className="shrink-0">
                    {getTypeIcon(patient.type)}
                  </div>
                </div>
              ))}
          </div>
        </ListCard>
      </div>

      {/* Weekly Activity Chart */}
      <ChartCard title="This Week's Activity">
        <div className="h-48 flex items-end justify-between gap-3">
          {dashboardData.weeklyAppointments.map((data, index) => {
            const maxValue = Math.max(...dashboardData.weeklyAppointments.map(d => d.count), 1);
            const height = (data.count / maxValue) * 100;
            const isToday = index === new Date().getDay() - 1 || (new Date().getDay() === 0 && index === 6);
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className={`w-full rounded-t-lg transition-all cursor-pointer relative group ${
                    isToday ? 'bg-blue-600' : 'bg-blue-400 hover:bg-blue-500'
                  }`}
                  style={{ height: `${height}%`, minHeight: data.count > 0 ? '12px' : '0' }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {data.count} appointments
                  </div>
                </div>
                <span className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                  {data.day}
                </span>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
};

export default DoctorDashboard;