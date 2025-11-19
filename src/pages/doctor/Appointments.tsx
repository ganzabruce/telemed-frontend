import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, Phone, MessageSquare, CheckCircle, XCircle, AlertCircle, Filter, Search, MapPin, RefreshCw, FileText, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PrescriptionForm from '@/components/shared/PrescriptionForm';
import { getOrCreateConversation } from '@/api/chatApi';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/apiConfig';

// --- Types ---
interface UserRef {
  id?: string;
  fullName?: string;
}

interface PatientRef {
  user?: UserRef | null;
}

interface HospitalRef {
  id?: string;
  name?: string;
}

interface Consultation {
  doctorNotes?: string;
  prescription?: string;
  createdAt?: string;
}

interface Appointment {
  id?: string;
  appointmentDate?: string | null;
  status?: string | null;
  type?: string | null;
  patient?: PatientRef | null;
  hospital?: HospitalRef | null;
  consultation?: Consultation | null;
}

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState<boolean>(false);
  const [prescriptionFormOpen, setPrescriptionFormOpen] = useState<boolean>(false);
  const [appointmentForPrescription, setAppointmentForPrescription] = useState<Appointment | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [clientPage, setClientPage] = useState<number>(1);
  const itemsPerPage = 15;

  const statusConfig = {
    PENDING: {
      bg: 'bg-orange-500',
      lightBg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      icon: Clock
    },
    CONFIRMED: {
      bg: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: CheckCircle
    },
    COMPLETED: {
      bg: 'bg-green-500',
      lightBg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: CheckCircle
    },
    CANCELLED: {
      bg: 'bg-gray-500',
      lightBg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: XCircle
    }
  };

  const typeConfig = {
    VIDEO: {
      icon: Video,
      color: 'text-black',
      bg: 'bg-gray-100'
    },
    AUDIO: {
      icon: Phone,
      color: 'text-black',
      bg: 'bg-gray-100'
    },
    CHAT: {
      icon: MessageSquare,
      color: 'text-black',
      bg: 'bg-gray-100'
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [currentPage, statusFilter, typeFilter, dateFilter]);

  useEffect(() => {
    filterAppointments();
  }, [searchTerm, appointments]);

  const getAuthToken = () => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.token;
    }
    return null;
  };

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      let queryParams = new URLSearchParams({
        limit: '10',
        offset: ((currentPage - 1) * 10).toString(),
        orderBy: 'appointmentDate',
        order: 'desc'
      });

      if (statusFilter !== 'ALL') {
        queryParams.append('status', statusFilter);
      }

      if (dateFilter !== 'ALL') {
        const today = new Date();
        if (dateFilter === 'TODAY') {
          queryParams.append('startDate', today.toISOString().split('T')[0]);
          queryParams.append('endDate', today.toISOString().split('T')[0]);
        } else if (dateFilter === 'UPCOMING') {
          queryParams.append('startDate', today.toISOString().split('T')[0]);
        } else if (dateFilter === 'PAST') {
          queryParams.append('endDate', today.toISOString().split('T')[0]);
        }
      }

      const response = await axios.get(
        `${API_BASE_URL}/appointments?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setAppointments(response.data.data || []);
      setFilteredAppointments(response.data.data || []);
      setTotalPages(response.data.pages || 1);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      const msg = err?.response?.data?.message || err?.message || String(err);
      setError(msg || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((appointment: Appointment) => {
        const patientName = (appointment.patient?.user?.fullName ?? '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return patientName.includes(search);
      });
    }

    // Apply type filter
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((appointment: Appointment) => appointment.type === typeFilter);
    }

    setFilteredAppointments(filtered);
  };

  // Client-side pagination for filtered results
  const totalClientPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (clientPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

  // Reset client page when filters change
  useEffect(() => {
    setClientPage(1);
  }, [searchTerm, typeFilter]);

  const handleStatusUpdate = async (): Promise<void> => {
    if (!selectedAppointment || !newStatus) return;

    setUpdating(true);
    try {
      const token = getAuthToken();
      await axios.patch(
        `${API_BASE_URL}/appointments/${selectedAppointment.id}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await fetchAppointments();
      setStatusDialogOpen(false);
      setSelectedAppointment(null);
      setNewStatus('');
    } catch (err) {
      const e: any = err;
      console.error('Error updating status:', e);
      alert(e?.response?.data?.message || e?.message || 'Failed to update appointment status');
    } finally {
      setUpdating(false);
    }
  };

  const openStatusDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNewStatus(appointment.status ?? '');
    setStatusDialogOpen(true);
  };

  const openDetailsDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(true);
  };

  const formatDate = (dateString?: string | null): string => {
    const date = dateString ? new Date(dateString) : null;
    if (!date || isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString?: string | null): string => {
    const date = dateString ? new Date(dateString) : null;
    if (!date || isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // (formatDateShort removed — not used)

  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Appointments</h1>
              <p className="text-gray-600">Manage and track your patient consultations</p>
            </div>
            <Button 
              onClick={fetchAppointments}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {/* Stats Overview */}
 

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter} >
              <SelectTrigger className="h-11 bg-white">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="VIDEO">Video Call</SelectItem>
                <SelectItem value="AUDIO">Audio Call</SelectItem>
                <SelectItem value="CHAT">Chat</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="ALL">All Dates</SelectItem>
                <SelectItem value="TODAY">Today</SelectItem>
                <SelectItem value="UPCOMING">Upcoming</SelectItem>
                <SelectItem value="PAST">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Appointments Table */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedAppointments.map((appointment: Appointment) => {
                      const statusKey = (appointment.status ?? 'PENDING') as keyof typeof statusConfig;
                      const typeKey = (appointment.type ?? 'VIDEO') as keyof typeof typeConfig;
                      const StatusIcon = statusConfig[statusKey].icon;
                      const TypeIcon = typeConfig[typeKey].icon;

                      return (
                        <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {appointment.patient?.user?.fullName?.charAt(0) || 'P'}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{appointment.patient?.user?.fullName || 'Unknown Patient'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(appointment.appointmentDate)}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{formatTime(appointment.appointmentDate)}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{appointment.hospital?.name || 'Unknown'}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${typeConfig[typeKey].bg}`}>
                              <TypeIcon className={`w-4 h-4 ${typeConfig[typeKey].color}`} />
                              <span className={`text-xs font-medium ${typeConfig[typeKey].color}`}>{appointment.type}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${statusConfig[statusKey].lightBg} ${statusConfig[statusKey].border} border`}>
                              <StatusIcon className={`w-4 h-4 ${statusConfig[statusKey].text}`} />
                              <span className={`text-xs font-medium ${statusConfig[statusKey].text}`}>{appointment.status}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDetailsDialog(appointment)}
                                className="h-7 text-xs"
                              >
                                Details
                              </Button>
                              {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
                                <Button
                                  size="sm"
                                  onClick={() => openStatusDialog(appointment)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs"
                                >
                                  Update
                                </Button>
                              )}
                              {appointment.status === 'CONFIRMED' && appointment.type === 'CHAT' && (
                                <Button 
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      if (appointment.patient?.user?.id) {
                                        await getOrCreateConversation(appointment.patient.user.id);
                                        navigate('/doctor/consultations');
                                        toast.success('Opening chat with patient...');
                                      } else {
                                        toast.error('Patient information not available');
                                      }
                                    } catch (err) {
                                      toast.error('Failed to open chat. Please try again.');
                                      console.error('Error opening chat:', err);
                                    }
                                  }}
                                  className="bg-gray-50 text-black border border-gray-200 hover:bg-gray-100 h-7 text-xs flex items-center gap-1"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  Chat
                                </Button>
                              )}
                              {(appointment.status === 'CONFIRMED' || appointment.status === 'COMPLETED') && !appointment.consultation && (
                                <Button 
                                  size="sm"
                                  onClick={() => {
                                    setAppointmentForPrescription(appointment);
                                    setPrescriptionFormOpen(true);
                                  }}
                                  className="bg-gray-50 text-black border border-gray-200 hover:bg-gray-100 h-7 text-xs flex items-center gap-1"
                                >
                                  <FileText className="w-3 h-3" />
                                  Record
                                </Button>
                              )}
                              {appointment.consultation && (
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openDetailsDialog(appointment)}
                                  className="bg-gray-50 text-black border border-gray-200 hover:bg-gray-100 h-7 text-xs"
                                >
                                  View
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Client-side Pagination */}
            {totalClientPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredAppointments.length)}</span> of{' '}
                  <span className="font-medium">{filteredAppointments.length}</span> appointments
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setClientPage(prev => Math.max(1, prev - 1))}
                    disabled={clientPage === 1}
                    className="h-9 px-4 text-sm"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalClientPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalClientPages <= 5) {
                        pageNum = i + 1;
                      } else if (clientPage <= 3) {
                        pageNum = i + 1;
                      } else if (clientPage >= totalClientPages - 2) {
                        pageNum = totalClientPages - 4 + i;
                      } else {
                        pageNum = clientPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={clientPage === pageNum ? "default" : "outline"}
                          onClick={() => setClientPage(pageNum)}
                          className="h-9 w-9 text-sm"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setClientPage(prev => Math.min(totalClientPages, prev + 1))}
                    disabled={clientPage === totalClientPages}
                    className="h-9 px-4 text-sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Backend Pagination (if needed) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-11 px-6"
                >
                  Previous Page
                </Button>
                <div className="text-sm text-gray-600">
                  Backend Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-11 px-6"
                >
                  Next Page
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white"> 
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (() => {
            const selStatusKey = (selectedAppointment.status ?? 'PENDING') as keyof typeof statusConfig;
            const selTypeKey = (selectedAppointment.type ?? 'VIDEO') as keyof typeof typeConfig;
            const ConsultationDate = selectedAppointment.consultation?.createdAt ? new Date(selectedAppointment.consultation.createdAt) : null;

            return (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 p-5 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {selectedAppointment.patient?.user?.fullName?.charAt(0) || 'P'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedAppointment.patient?.user?.fullName || 'Unknown Patient'}
                  </h3>
                  <p className="text-gray-600">Patient Information</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Date</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {formatDate(selectedAppointment.appointmentDate)}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Time</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {formatTime(selectedAppointment.appointmentDate)}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                    {React.createElement(typeConfig[selTypeKey].icon, { className: 'w-4 h-4' })}
                    <span className="text-sm font-medium">Type</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedAppointment.type}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                    {React.createElement(statusConfig[selStatusKey].icon, { className: 'w-4 h-4' })}
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <Badge className={`${statusConfig[selStatusKey].lightBg} ${statusConfig[selStatusKey].text} ${statusConfig[selStatusKey].border} border font-semibold`}>
                    {selectedAppointment.status}
                  </Badge>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Hospital</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {selectedAppointment.hospital?.name || 'Unknown Hospital'}
                </p>
              </div>

              {/* Consultation Details */}
              {selectedAppointment.consultation && (
                <>
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Consultation Details</h3>
                    
                    {selectedAppointment.consultation.doctorNotes && (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-4">
                        <div className="flex items-center gap-2 text-blue-700 mb-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm font-medium">Doctor's Notes</span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedAppointment.consultation.doctorNotes}
                        </p>
                      </div>
                    )}

                    {selectedAppointment.consultation.prescription && (
                      <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 text-green-700 mb-2">
                          <Pill className="w-4 h-4" />
                          <span className="text-sm font-medium">Prescription</span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedAppointment.consultation.prescription}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 text-sm text-gray-500">
                      Consultation recorded on: {ConsultationDate ? ConsultationDate.toLocaleString() : '-'}
                    </div>
                  </div>
                </>
              )}
            </div>
            );
          })()}
          <DialogFooter className="flex items-center justify-between gap-2">
            <div className="flex-1">
              {(() => {
                const chatPatientId = selectedAppointment?.patient?.user?.id;
                if (selectedAppointment?.status === 'CONFIRMED' && selectedAppointment?.type === 'CHAT' && chatPatientId) {
                  return (
                    <Button
                      onClick={async () => {
                        try {
                          await getOrCreateConversation(chatPatientId);
                          setDetailsDialogOpen(false);
                          navigate('/doctor/consultations');
                          toast.success('Opening chat with patient...');
                        } catch (err) {
                          toast.error('Failed to open chat. Please try again.');
                          console.error('Error opening chat:', err);
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Open Chat
                    </Button>
                  );
                }
                return null;
              })()}
            </div>
            <Button
              onClick={() => setDetailsDialogOpen(false)}
              className="bg-blue-500 text-white hover:from-blue-700 hover:to-indigo-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className='bg-white'>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Update Appointment Status</DialogTitle>
            <DialogDescription>
              Change the status for {selectedAppointment?.patient?.user?.fullName}'s appointment
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className='bg-white'>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStatusUpdate} 
              disabled={updating}
              className="bg-blue-500 text-white  hover:from-blue-700 hover:to-indigo-700"
            >
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prescription Form */}
      {appointmentForPrescription && (
        <PrescriptionForm
          isOpen={prescriptionFormOpen}
          onClose={() => {
            setPrescriptionFormOpen(false);
            setAppointmentForPrescription(null);
          }}
          appointmentId={appointmentForPrescription?.id ?? ''}
          appointmentType={(appointmentForPrescription?.type as 'VIDEO' | 'AUDIO' | 'CHAT') ?? 'CHAT'}
          patientName={appointmentForPrescription.patient?.user?.fullName || 'Patient'}
          onSuccess={() => {
            fetchAppointments();
          }}
        />
      )}
    </div>
  );
};

export default DoctorAppointments;