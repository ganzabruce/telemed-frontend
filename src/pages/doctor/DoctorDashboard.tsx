import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Video, Phone, MessageSquare, CheckCircle, XCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const API_BASE_URL = 'http://localhost:5002';

interface Appointment {
  id: string;
  appointmentDate: string;
  type: 'VIDEO' | 'AUDIO' | 'CHAT';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  patient: {
    id: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      phone: string;
      avatarUrl?: string;
    };
    dateOfBirth: string;
    gender: string;
    bloodType?: string;
  };
  doctor: {
    user: {
      fullName: string;
    };
  };
  hospital: {
    name: string;
  };
}

const DoctorAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [consultationData, setConsultationData] = useState({
    doctorNotes: '',
    prescription: '',
    consultationType: '' as 'VIDEO' | 'AUDIO' | 'CHAT' | '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = JSON.parse(localStorage.getItem('user') || '{}').token;
      
      const response = await fetch(`${API_BASE_URL}/appointments?orderBy=appointmentDate&order=desc`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch appointments');
      
      const data = await response.json();
      setAppointments(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch appointments');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const token = JSON.parse(localStorage.getItem('user') || '{}').token;
      
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update appointment status');
      
      await fetchAppointments();
    } catch (err: any) {
      setError(err.message || 'Failed to update appointment');
      console.error('Error updating appointment:', err);
    }
  };

  const submitConsultation = async () => {
    if (!selectedAppointment) return;

    try {
      setSubmitting(true);
      const token = JSON.parse(localStorage.getItem('user') || '{}').token;
      
      const response = await fetch(`${API_BASE_URL}/consultations`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          doctorNotes: consultationData.doctorNotes,
          prescription: consultationData.prescription,
          consultationType: consultationData.consultationType || selectedAppointment.type
        })
      });

      if (!response.ok) throw new Error('Failed to save consultation');
      
      setShowConsultationModal(false);
      setConsultationData({ doctorNotes: '', prescription: '', consultationType: '' });
      await fetchAppointments();
    } catch (err: any) {
      setError(err.message || 'Failed to save consultation');
      console.error('Error saving consultation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const openConsultationModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setConsultationData({
      doctorNotes: '',
      prescription: '',
      consultationType: appointment.type
    });
    setShowConsultationModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video className="w-5 h-5" />;
      case 'AUDIO': return <Phone className="w-5 h-5" />;
      case 'CHAT': return <MessageSquare className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const filterAppointments = (status?: string) => {
    if (!status) return appointments;
    return appointments.filter(apt => apt.status === status);
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4 mb-4">
          {appointment.patient.user.avatarUrl ? (
            <img
              src={appointment.patient.user.avatarUrl}
              alt={appointment.patient.user.fullName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-semibold">
                {getInitials(appointment.patient.user.fullName)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate">
              {appointment.patient.user.fullName}
            </h3>
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{formatDate(appointment.appointmentDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{formatTime(appointment.appointmentDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            {getTypeIcon(appointment.type)}
            <span className="text-sm">{appointment.type}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4" />
            <span className="text-sm">{appointment.patient.gender} • {appointment.patient.bloodType || 'N/A'}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t space-y-2">
          {appointment.status === 'PENDING' && (
            <div className="flex gap-2">
              <Button
                onClick={() => updateAppointmentStatus(appointment.id, 'CONFIRMED')}
                className="flex-1"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Confirm
              </Button>
              <Button
                onClick={() => updateAppointmentStatus(appointment.id, 'CANCELLED')}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          )}

          {appointment.status === 'CONFIRMED' && (
            <Button
              onClick={() => openConsultationModal(appointment)}
              className="w-full"
              size="sm"
            >
              <FileText className="w-4 h-4 mr-1" />
              Record Consultation
            </Button>
          )}

          {appointment.status === 'COMPLETED' && (
            <div className="flex items-center justify-center gap-2 text-green-600 py-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Completed</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-500 mt-1">Manage your patient consultations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {appointments.length} Total
          </Badge>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All ({appointments.length})
          </TabsTrigger>
          <TabsTrigger value="PENDING">
            Pending ({filterAppointments('PENDING').length})
          </TabsTrigger>
          <TabsTrigger value="CONFIRMED">
            Confirmed ({filterAppointments('CONFIRMED').length})
          </TabsTrigger>
          <TabsTrigger value="COMPLETED">
            Completed ({filterAppointments('COMPLETED').length})
          </TabsTrigger>
          <TabsTrigger value="CANCELLED">
            Cancelled ({filterAppointments('CANCELLED').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {appointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments found</h3>
                <p className="text-gray-500">You don't have any appointments scheduled yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appointments.map(appointment => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          )}
        </TabsContent>

        {['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(status => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filterAppointments(status).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No {status.toLowerCase()} appointments
                  </h3>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterAppointments(status).map(appointment => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={showConsultationModal} onOpenChange={setShowConsultationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Consultation</DialogTitle>
            <DialogDescription>
              Document the consultation details and prescriptions for {selectedAppointment?.patient.user.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="consultationType">Consultation Type</Label>
              <Select
                value={consultationData.consultationType}
                onValueChange={(value) => setConsultationData({
                  ...consultationData,
                  consultationType: value as 'VIDEO' | 'AUDIO' | 'CHAT'
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">Video Call</SelectItem>
                  <SelectItem value="AUDIO">Audio Call</SelectItem>
                  <SelectItem value="CHAT">Chat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctorNotes">Doctor's Notes *</Label>
              <Textarea
                id="doctorNotes"
                placeholder="Enter your clinical notes and observations..."
                value={consultationData.doctorNotes}
                onChange={(e) => setConsultationData({
                  ...consultationData,
                  doctorNotes: e.target.value
                })}
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prescription">Prescription</Label>
              <Textarea
                id="prescription"
                placeholder="Enter prescribed medications and instructions..."
                value={consultationData.prescription}
                onChange={(e) => setConsultationData({
                  ...consultationData,
                  prescription: e.target.value
                })}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConsultationModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={submitConsultation}
              disabled={submitting || !consultationData.doctorNotes}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Consultation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorAppointmentsPage;