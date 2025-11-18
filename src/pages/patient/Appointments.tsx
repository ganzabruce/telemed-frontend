import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Phone, MessageSquare, Search, Plus, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateConversation } from '../../api/chatApi';
import toast from 'react-hot-toast';
import { InitiatePaymentModal } from './InitiatePaymentModal';
import { API_BASE_URL } from '../../utils/apiConfig';

const APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;

// --- Types ---
type AppointmentStatus = typeof APPOINTMENT_STATUSES[number];

interface UserRef {
  id?: string;
  fullName?: string;
  role?: string;
}

interface Doctor {
  id?: string;
  user?: UserRef | null;
  specialization?: string | null;
}

interface Hospital {
  id?: string;
  name?: string;
  address?: string;
}

interface Appointment {
  id?: string;
  appointmentDate?: string | null;
  status?: AppointmentStatus | string | null;
  type?: string | null;
  doctor?: Doctor | null;
  hospital?: Hospital | null;
  notes?: string | null;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentBooked: () => void;
}

interface BookingFormData {
  doctorId: string;
  hospitalId: string;
  appointmentDate: string;
  type: string;
}

const BookingModal = ({ isOpen, onClose, onAppointmentBooked }: BookingModalProps) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({
    doctorId: '',
    hospitalId: '',
    appointmentDate: '',
    type: 'VIDEO',
  });

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const raw = localStorage.getItem('user') || '{}';
          const user = JSON.parse(raw) as any;
          const token = user?.token as string | undefined;
          if (!token) throw new Error('Authentication token not found.');

          const [doctorsRes, hospitalsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/doctors`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/hospitals`, { headers: { 'Authorization': `Bearer ${token}` } })
          ]);

          if (!doctorsRes.ok || !hospitalsRes.ok) throw new Error('Failed to fetch doctors or hospitals.');

          const doctorsData = await doctorsRes.json().catch(() => ({}));
          const hospitalsData = await hospitalsRes.json().catch(() => ({}));
          
          setDoctors((doctorsData?.data as Doctor[]) || []);
          setHospitals((hospitalsData?.data as Hospital[]) || []);
        } catch (err) {
          const message = (err instanceof Error) ? err.message : String(err);
          setError(message || 'Could not load necessary data.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const raw = localStorage.getItem('user') || '{}';
      const user = JSON.parse(raw) as any;
      const token = user?.token as string | undefined;

      if (!token) {
        throw new Error('You must be logged in to book an appointment.');
      }

      if (user?.role !== 'PATIENT') {
        throw new Error('Only patients can book appointments.');
      }

      if (!formData.doctorId || !formData.hospitalId || !formData.appointmentDate || !formData.type) {
        throw new Error('Please fill in all fields.');
      }

      const payload = {
        doctorId: formData.doctorId,
        hospitalId: formData.hospitalId,
        appointmentDate: new Date(formData.appointmentDate).toISOString(),
        type: formData.type,
      };

      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.message ?? 'Failed to create appointment.';
        throw new Error(message);
      }

      alert('Appointment booked successfully!');
      onAppointmentBooked();
      onClose();
    } catch (err) {
      const message = (err instanceof Error) ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Book New Appointment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div>
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3 text-red-800 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="hospitalId" className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
              <select name="hospitalId" id="hospitalId" value={formData.hospitalId} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="" disabled>Select a hospital</option>
                {hospitals.map((h, idx) => <option key={h.id ?? idx} value={h.id ?? ''}>{h.name ?? ''}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
              <select name="doctorId" id="doctorId" value={formData.doctorId} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="" disabled>Select a doctor</option>
                {doctors.map((d, idx) => (
                  <option key={d.id ?? idx} value={d.id ?? ''}>
                    Dr. {d.user?.fullName ?? 'Unknown'} {d.specialization ? `(${d.specialization})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <input type="datetime-local" name="appointmentDate" id="appointmentDate" value={formData.appointmentDate} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Consultation Type</label>
              <select name="type" id="type" value={formData.type} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="VIDEO">Video Call</option>
                <option value="AUDIO">Audio Call</option>
                <option value="CHAT">Chat</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 p-6 bg-gray-50 rounded-b-xl">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium">
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-300">
              {isLoading ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentAppointment, setPaymentAppointment] = useState<any | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = user.token;
      
      if (!token) {
        setError('Please log in to view appointments.');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/appointments?orderBy=appointmentDate&order=desc`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) throw new Error('Failed to fetch appointments');

      const data = await response.json();
      setAppointments(data.data || []);
    } catch (err) {
      setError('Failed to load appointments. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusColor = (status?: string | null): string => {
    const colors: Record<string, string> = {
      PENDING: 'bg-gray-100 text-gray-800 border-gray-200',
      CONFIRMED: 'bg-gray-100 text-gray-800 border-gray-200',
      COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
      CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status ?? ''] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeIcon = (type?: string | null): React.ReactElement => {
    const icons: Record<string, React.ReactElement> = {
      VIDEO: <Video className="w-4 h-4" />,
      AUDIO: <Phone className="w-4 h-4" />,
      CHAT: <MessageSquare className="w-4 h-4" />
    };
    return icons[(type ?? 'VIDEO')] || icons.VIDEO;
  };

  const formatDate = (dateString?: string | null): string => {
    const date = new Date(dateString ?? '');
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString?: string | null): string => {
    const date = new Date(dateString ?? '');
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  
  const filteredAppointments = appointments.filter(apt => {
    const statusMatch = filterStatus === 'all' || apt.status === filterStatus;
    const searchMatch = !searchTerm || (
      (apt.doctor?.user?.fullName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.hospital?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    return statusMatch && searchMatch;
  });

  const formatStatusForDisplay = (status: string): string => {
    if (status === 'all') return 'All';
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600 mt-1">Manage and view your upcoming consultations</p>
        </div>
        <button 
          onClick={() => setIsBookingModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          Book Appointment
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Filter list by doctor or hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', ...APPOINTMENT_STATUSES].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize text-sm ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {formatStatusForDisplay(status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Appointments Found</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Your search returned no results. Try different keywords.' 
                : `There are no appointments with the status "${formatStatusForDisplay(filterStatus)}".`}
            </p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all hover:shadow-md p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
                    {((appointment.doctor?.user?.fullName ?? 'DR').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">Dr. {appointment.doctor?.user?.fullName || 'Unknown Doctor'}</h3>
                    <p className="text-sm text-gray-600">{appointment.doctor?.specialization || 'General Practice'} • {appointment.hospital?.name || 'Hospital'}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(appointment.appointmentDate)}</div>
                      <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatTime(appointment.appointmentDate)}</div>
                      <div className="flex items-center gap-1">{getTypeIcon(appointment.type)}{appointment.type ?? ''}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status ?? null)}`}>
                    {appointment.status ?? ''}
                  </span>
                  {appointment.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        setPaymentAppointment(appointment);
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-colors font-medium text-sm"
                    >
                      Pay
                    </button>
                  )}
                  {appointment.status === 'CONFIRMED' && appointment.type === 'CHAT' && (
                    <button 
                      onClick={async () => {
                        try {
                          const doctorId = appointment.doctor?.user?.id;
                          if (doctorId) {
                            await getOrCreateConversation(doctorId);
                            navigate('/patient/consultations');
                            toast.success('Opening chat with doctor...');
                          } else {
                            toast.error('Doctor information not available');
                          }
                        } catch (err) {
                          toast.error('Failed to open chat. Please try again.');
                          console.error('Error opening chat:', err);
                        }
                      }}
                      className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Open Chat
                    </button>
                  )}
                  <button onClick={() => setSelectedAppointment(appointment)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedAppointment && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
              <button onClick={() => setSelectedAppointment(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold shrink-0">
                  {selectedAppointment.doctor?.user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DR'}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Dr. {selectedAppointment.doctor?.user?.fullName}</h3>
                  <p className="text-gray-600">{selectedAppointment.doctor?.specialization}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg"><label className="text-sm font-medium text-gray-500">Date</label><p className="text-base font-semibold text-gray-900">{formatDate(selectedAppointment.appointmentDate)}</p></div>
                <div className="bg-gray-50 p-4 rounded-lg"><label className="text-sm font-medium text-gray-500">Time</label><p className="text-base font-semibold text-gray-900">{formatTime(selectedAppointment.appointmentDate)}</p></div>
                <div className="bg-gray-50 p-4 rounded-lg"><label className="text-sm font-medium text-gray-500">Type</label><p className="text-base font-semibold text-gray-900 flex items-center gap-2">{getTypeIcon(selectedAppointment.type)}{selectedAppointment.type ?? ''}</p></div>
                <div className="bg-gray-50 p-4 rounded-lg"><label className="text-sm font-medium text-gray-500">Status</label><span className={`px-3 py-1 text-sm rounded-full font-medium border ${getStatusColor(selectedAppointment.status ?? null)}`}>{selectedAppointment.status ?? ''}</span></div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Hospital Details</h4>
                <div className="bg-gray-50 p-4 rounded-lg"><p className="font-semibold">{selectedAppointment.hospital?.name}</p><p className="text-gray-600 text-sm">{selectedAppointment.hospital?.address}</p></div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Notes</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg min-h-[100px]">{selectedAppointment.notes || 'No additional notes were provided.'}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 bg-gray-50 rounded-b-xl">
              {selectedAppointment.status === 'PENDING' && (
                <button
                  onClick={() => {
                    setPaymentAppointment(selectedAppointment);
                    setIsPaymentModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
                >
                  Pay
                </button>
              )}
              {selectedAppointment.status === 'CONFIRMED' && selectedAppointment.type === 'CHAT' && selectedAppointment.doctor?.user?.id && (
                <button 
                  onClick={async () => {
                    try {
                      const doctorId = selectedAppointment?.doctor?.user?.id;
                      if (doctorId) {
                        await getOrCreateConversation(doctorId);
                        setSelectedAppointment(null);
                        navigate('/patient/consultations');
                        toast.success('Opening chat with doctor...');
                      }
                    } catch (err) {
                      toast.error('Failed to open chat. Please try again.');
                      console.error('Error opening chat:', err);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Open Chat
                </button>
              )}
              <button onClick={() => setSelectedAppointment(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)}
        onAppointmentBooked={() => {
          fetchAppointments();
        }}
      />
      <InitiatePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentAppointment(null);
          // After payment flow, refresh appointments to reflect updated status if webhook already processed
          fetchAppointments();
        }}
        appointment={paymentAppointment}
      />
    </div>
  );
};

export default AppointmentsPage;