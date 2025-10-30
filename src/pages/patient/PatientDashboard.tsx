// import PagePlaceholder from "../../components/common/PagePlaceholder"
// export default function PatientDashboard() {
//   return <PagePlaceholder title="Patient Dashboard" description="Overview of your upcoming and past appointments." />
// }

import { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  Video,
  Phone,
  MessageSquare,
  FileText,
  Heart,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  MapPin,
  Mail,
  CreditCard,
  Download,
  Plus,
  ArrowRight,
  Stethoscope,
  Building2
} from 'lucide-react';

// API Base URL
const API_BASE_URL = 'http://localhost:5001';

const PatientDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
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

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch appointments and payments
      const [appointmentsResponse, paymentsResponse, doctorsResponse, hospitalsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/appointments`, { headers }),
        fetch(`${API_BASE_URL}/payments`, { headers }),
        fetch(`${API_BASE_URL}/doctors`, { headers }),
        fetch(`${API_BASE_URL}/hospitals`, { headers })
      ]);

      const appointmentsData = await appointmentsResponse.json();
      const paymentsData = await paymentsResponse.json();
      const doctorsData = await doctorsResponse.json();
      const hospitalsData = await hospitalsResponse.json();

      // Get patient's appointments
      const myAppointments = (appointmentsData.data || []);
      
      // Separate upcoming and past appointments
      const now = new Date();
      const upcoming = myAppointments.filter(a => {
        const apptDate = new Date(a.appointmentDate);
        return apptDate >= now && (a.status === 'PENDING' || a.status === 'CONFIRMED');
      }).sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

      const past = myAppointments.filter(a => {
        const apptDate = new Date(a.appointmentDate);
        return apptDate < now || a.status === 'COMPLETED' || a.status === 'CANCELLED';
      }).sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

      // Get next appointment
      const nextAppt = upcoming[0] || null;

      // Count appointment statuses
      const completed = myAppointments.filter(a => a.status === 'COMPLETED').length;
      const cancelled = myAppointments.filter(a => a.status === 'CANCELLED').length;

      // Calculate consultation type breakdown
      const videoCount = myAppointments.filter(a => a.type === 'VIDEO').length;
      const audioCount = myAppointments.filter(a => a.type === 'AUDIO').length;
      const chatCount = myAppointments.filter(a => a.type === 'CHAT').length;

      // Calculate payments
      const myPayments = (paymentsData.data || []);
      const totalSpent = myPayments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const unpaidCount = myPayments.filter(p => p.status === 'PENDING').length;

      // Get recent doctors
      const recentDoctors = getRecentDoctors(myAppointments, doctorsData.data || []);

      // Process monthly appointments
      const monthlyActivity = processMonthlyAppointments(myAppointments);

      // Get patient info (from first appointment if available)
      const patientInfo = myAppointments[0]?.patient || null;
      
      // Get hospital info
      const hospitalInfo = hospitalsData.data?.[0] || null;

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

  const getRecentDoctors = (appointments, doctors) => {
    const doctorMap = new Map();
    
    appointments
      .filter(a => a.doctor)
      .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
      .forEach(a => {
        if (!doctorMap.has(a.doctorId)) {
          doctorMap.set(a.doctorId, {
            id: a.doctorId,
            name: a.doctor.user?.fullName || 'Dr. Unknown',
            specialization: a.doctor.specialization,
            lastVisit: a.appointmentDate,
            type: a.type
          });
        }
      });

    return Array.from(doctorMap.values()).slice(0, 4);
  };

  const processMonthlyAppointments = (appointments) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthCounts = new Array(12).fill(0);

    appointments.forEach(apt => {
      const date = new Date(apt.appointmentDate);
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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
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

  const getTimeUntilAppointment = (dateString) => {
    const now = new Date();
    const apptDate = new Date(dateString);
    const diffMs = apptDate - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    return 'soon';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome Back!</h1>
            <p className="text-gray-600 mt-1">Your health dashboard</p>
          </div>
        </div>
      </div>

      {/* Next Appointment Alert */}
      {dashboardData.nextAppointment && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 mb-6 shadow-lg text-white">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">Next Appointment</span>
              </div>
              <h3 className="text-xl font-bold mb-2">
                Dr. {dashboardData.nextAppointment.doctor?.user?.fullName || 'Unknown'}
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDateTime(dashboardData.nextAppointment.appointmentDate).date}</span>
                  <span className="opacity-75">at</span>
                  <span>{formatDateTime(dashboardData.nextAppointment.appointmentDate).time}</span>
                </div>
                <div className="flex items-center gap-1">
                  {getTypeIcon(dashboardData.nextAppointment.type)}
                  <span>{dashboardData.nextAppointment.type}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-bold">{getTimeUntilAppointment(dashboardData.nextAppointment.appointmentDate)}</p>
                <p className="text-sm opacity-75">to go</p>
              </div>
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2">
                Join Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        {/* Total Appointments */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Visits</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{dashboardData.totalAppointments}</h3>
              <p className="text-xs text-gray-500 mt-2">
                {dashboardData.completedAppointments} completed
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Upcoming</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{dashboardData.upcomingCount}</h3>
              <p className="text-xs text-gray-500 mt-2">
                {dashboardData.cancelledCount} cancelled
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Spent</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{formatCurrency(dashboardData.totalSpent)}</h3>
              <p className="text-xs text-gray-500 mt-2">
                {dashboardData.unpaidCount} unpaid
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-full">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Book Appointment CTA */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex flex-col h-full justify-between">
            <div className="bg-white/20 p-3 rounded-full w-fit mb-3">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Book New</h3>
              <p className="text-sm text-blue-100">Schedule a consultation</p>
            </div>
            <ArrowRight className="w-5 h-5 text-white mt-2 group-hover:translate-x-1 transition-transform" />
          </div>
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
              <p className="text-xl font-bold text-gray-900">{dashboardData.consultationHistory.video}</p>
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
              <p className="text-xl font-bold text-gray-900">{dashboardData.consultationHistory.audio}</p>
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
              <p className="text-xl font-bold text-gray-900">{dashboardData.consultationHistory.chat}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Appointments List - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {dashboardData.upcomingAppointments.length > 0 ? (
                  dashboardData.upcomingAppointments.map((appointment, index) => {
                    const dateTime = formatDateTime(appointment.appointmentDate);
                    return (
                      <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <Stethoscope className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">
                              Dr. {appointment.doctor?.user?.fullName || 'Unknown'}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {appointment.doctor?.specialization || 'Specialist'}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {dateTime.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {dateTime.time}
                            </span>
                            <span className="flex items-center gap-1">
                              {getTypeIcon(appointment.type)}
                              {appointment.type}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {appointment.status === 'CONFIRMED' && (
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                              Join
                            </button>
                          )}
                          <button className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium">
                            Details
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No upcoming appointments</p>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                      Book Appointment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Past Appointments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Consultations</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {dashboardData.pastAppointments.length > 0 ? (
                  dashboardData.pastAppointments.map((appointment, index) => {
                    const dateTime = formatDateTime(appointment.appointmentDate);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              Dr. {appointment.doctor?.user?.fullName || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">{dateTime.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-8 text-sm">No consultation history</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Doctors */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Doctors</h3>
            <div className="space-y-3">
              {dashboardData.recentDoctors.length > 0 ? (
                dashboardData.recentDoctors.map((doctor, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {doctor.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{doctor.name}</p>
                      <p className="text-xs text-gray-500">{doctor.specialization}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">No doctors yet</p>
              )}
            </div>
          </div>

          {/* Health Records */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-sm text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold mb-1">Medical Records</h3>
                <p className="text-sm text-purple-100">View your health history</p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <button className="w-full bg-white text-purple-600 py-2 px-4 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              View Records
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Activity Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Appointment History</h3>
        <div className="h-48 flex items-end justify-between gap-2">
          {dashboardData.monthlyAppointments.map((data, index) => {
            const maxValue = Math.max(...dashboardData.monthlyAppointments.map(d => d.count), 1);
            const height = (data.count / maxValue) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer relative group"
                  style={{ height: `${height}%`, minHeight: data.count > 0 ? '8px' : '0' }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {data.count} visits
                  </div>
                </div>
                <span className="text-xs text-gray-600">{data.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;