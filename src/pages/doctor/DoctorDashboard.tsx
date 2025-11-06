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

// API Base URL
const API_BASE_URL = 'http://localhost:5003';

const DoctorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [dashboardData, setDashboardData] = useState({
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
  const [activeTab, setActiveTab] = useState('today');

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

  const fetchDashboardData = async () => {
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
        axios.get(`${API_BASE_URL}/appointments`, { headers }),
        axios.get(`${API_BASE_URL}/doctors`, { headers })
      ]);

      const appointmentsData = appointmentsResponse.data;
      const doctorsData = doctorsResponse.data;

      // Find the doctor profile for the current user
      const myDoctorProfile = (doctorsData.data || []).find(d => d.userId === userId);
      setDoctorProfile(myDoctorProfile);

      if (!myDoctorProfile) {
        setError('No doctor profile found');
        setLoading(false);
        return;
      }

      // Filter appointments for this doctor
      const myAppointments = (appointmentsData.data || []).filter(a => a.doctorId === myDoctorProfile.id);
      setAppointments(myAppointments);

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Filter appointments by status and date
      const todayAppts = myAppointments.filter(a => {
        const apptDate = new Date(a.appointmentDate);
        return apptDate >= today && apptDate < tomorrow;
      });

      const upcomingAppts = myAppointments.filter(a => {
        const apptDate = new Date(a.appointmentDate);
        return apptDate >= tomorrow;
      }).sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

      const completedAppts = myAppointments.filter(a => a.status === 'COMPLETED');
      const pendingAppts = myAppointments.filter(a => a.status === 'PENDING');
      const confirmedAppts = myAppointments.filter(a => a.status === 'CONFIRMED');

      // Count unique patients
      const uniquePatientIds = new Set(myAppointments.map(a => a.patientId));

      // Calculate consultation type breakdown
      const videoCount = myAppointments.filter(a => a.type === 'VIDEO').length;
      const audioCount = myAppointments.filter(a => a.type === 'AUDIO').length;
      const chatCount = myAppointments.filter(a => a.type === 'CHAT').length;

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
        status: myDoctorProfile.status || 'OFFLINE',
        specialization: myDoctorProfile.specialization || '',
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyActivity = (appointments) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayCounts = new Array(7).fill(0);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

    appointments.forEach(apt => {
      const aptDate = new Date(apt.appointmentDate);
      const daysDiff = Math.floor((aptDate - startOfWeek) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff < 7) {
        dayCounts[daysDiff]++;
      }
    });

    return days.map((day, index) => ({
      day,
      count: dayCounts[index]
    }));
  };

  const getRecentPatients = (appointments) => {
    const patientMap = new Map();
    
    appointments
      .filter(a => a.patient?.user)
      .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
      .forEach(a => {
        if (!patientMap.has(a.patientId)) {
          patientMap.set(a.patientId, {
            id: a.patientId,
            name: a.patient.user.fullName,
            lastVisit: a.appointmentDate,
            status: a.status,
            type: a.type
          });
        }
      });

    return Array.from(patientMap.values()).slice(0, 5);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
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

  const getTypeIcon = (type) => {
    switch (type?.toUpperCase()) {
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
              <p className="text-gray-600 mt-1">{dashboardData.specialization || 'Specialization'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              dashboardData.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
              dashboardData.status === 'BUSY' ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {dashboardData.status}
            </span>
            <button 
              onClick={fetchDashboardData}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{dashboardData.totalAppointments}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Total Appointments</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-orange-600">{dashboardData.pendingCount}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Pending Review</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-blue-600">{dashboardData.confirmedCount}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Confirmed</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-green-600">{dashboardData.completedAppointments}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Completed</h3>
        </div>
      </div>

      {/* Consultation Type Breakdown */}
      <div className="grid grid-cols-3 gap-4 md:gap-6 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 p-2 rounded-lg">
              <Video className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Video Calls</p>
              <p className="text-xl font-bold text-gray-900">{dashboardData.consultationBreakdown.video}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Audio Calls</p>
              <p className="text-xl font-bold text-gray-900">{dashboardData.consultationBreakdown.audio}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2 rounded-lg">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Chat</p>
              <p className="text-xl font-bold text-gray-900">{dashboardData.consultationBreakdown.chat}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Schedule - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>
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
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {currentSchedule.length > 0 ? (
                currentSchedule.map((appointment) => (
                  <div key={appointment.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
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
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No appointments scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Patients */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Patients</h3>
          <div className="space-y-3">
            {dashboardData.recentPatients.length > 0 ? (
              dashboardData.recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{patient.name}</p>
                    <p className="text-xs text-gray-500">{formatDate(patient.lastVisit)}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {getTypeIcon(patient.type)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8 text-sm">No recent patients</p>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Activity</h3>
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
      </div>
    </div>
  );
};

export default DoctorDashboard;