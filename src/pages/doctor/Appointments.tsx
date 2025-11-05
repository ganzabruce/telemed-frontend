// import PagePlaceholder from "../../components/common/PagePlaceholder"
// export default function Appointments() {
//   return <PagePlaceholder title="Doctor Appointments" description="Manage and review your scheduled consultations." />
// }


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, User, Video, Phone, MessageSquare, CheckCircle, XCircle, AlertCircle, Filter, Search, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

const API_BASE_URL = 'http://localhost:5002';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
    COMPLETED: 'bg-green-100 text-green-800 border-green-300',
    CANCELLED: 'bg-red-100 text-red-800 border-red-300'
  };

  const typeIcons = {
    VIDEO: <Video className="w-4 h-4" />,
    AUDIO: <Phone className="w-4 h-4" />,
    CHAT: <MessageSquare className="w-4 h-4" />
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
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    if (!searchTerm.trim()) {
      setFilteredAppointments(appointments);
      return;
    }

    const filtered = appointments.filter(appointment => {
      const patientName = appointment.patient?.user?.fullName?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      return patientName.includes(search);
    });

    setFilteredAppointments(filtered);
  };

  const handleStatusUpdate = async () => {
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

      // Refresh appointments
      await fetchAppointments();
      setStatusDialogOpen(false);
      setSelectedAppointment(null);
      setNewStatus('');
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Failed to update appointment status');
    } finally {
      setUpdating(false);
    }
  };

  const openStatusDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setNewStatus(appointment.status);
    setStatusDialogOpen(true);
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

  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-600 mt-2">Manage your scheduled patient consultations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{appointments.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {appointments.filter(a => a.status === 'PENDING').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {appointments.filter(a => a.status === 'CONFIRMED').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {appointments.filter(a => a.status === 'COMPLETED').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="VIDEO">Video</SelectItem>
                <SelectItem value="AUDIO">Audio</SelectItem>
                <SelectItem value="CHAT">Chat</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Dates</SelectItem>
                <SelectItem value="TODAY">Today</SelectItem>
                <SelectItem value="UPCOMING">Upcoming</SelectItem>
                <SelectItem value="PAST">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No appointments found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {appointment.patient?.user?.fullName?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {appointment.patient?.user?.fullName || 'Unknown Patient'}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {formatDate(appointment.appointmentDate)}
                            <Clock className="w-4 h-4 ml-2" />
                            {formatTime(appointment.appointmentDate)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <Badge className={statusColors[appointment.status]}>
                          {appointment.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          {typeIcons[appointment.type]}
                          <span>{appointment.type}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {appointment.hospital?.name || 'Unknown Hospital'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
                        <Button
                          size="sm"
                          onClick={() => openStatusDialog(appointment)}
                          variant="outline"
                        >
                          Update Status
                        </Button>
                      )}
                      {appointment.status === 'CONFIRMED' && (
                        <Button size="sm">
                          {appointment.type === 'VIDEO' && 'Join Video'}
                          {appointment.type === 'AUDIO' && 'Join Call'}
                          {appointment.type === 'CHAT' && 'Open Chat'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Appointment Status</DialogTitle>
            <DialogDescription>
              Change the status of the appointment with {selectedAppointment?.patient?.user?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
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
            <Button onClick={handleStatusUpdate} disabled={updating}>
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorAppointments;