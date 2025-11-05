import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  FileText, 
  AlertCircle, 
  Loader2,
  Clock,
  Activity,
  X,
  Filter,
  SortAsc,
  ChevronRight,
  MapPin,
  Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const API_BASE_URL = 'http://localhost:5002';

interface Patient {
  id: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  bloodType?: string;
  medicalHistory?: any;
  insuranceProvider?: string;
  insuranceNumber?: string;
  status: 'PENDING' | 'ACTIVE';
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    avatarUrl?: string;
  };
}

interface Appointment {
  id: string;
  appointmentDate: string;
  type: 'VIDEO' | 'AUDIO' | 'CHAT';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

const DoctorPatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    let filtered = patients.filter(patient =>
      patient.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(patient => patient.status === statusFilter);
    }

    setFilteredPatients(filtered);
  }, [searchTerm, patients, statusFilter]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = JSON.parse(localStorage.getItem('user') || '{}').token;
      
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch patients');
      
      const data = await response.json();
      
      const uniquePatients = new Map<string, Patient>();
      data.data.forEach((appointment: any) => {
        if (appointment.patient && !uniquePatients.has(appointment.patient.id)) {
          uniquePatients.set(appointment.patient.id, appointment.patient);
        }
      });

      setPatients(Array.from(uniquePatients.values()));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch patients');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientAppointments = async (patientId: string) => {
    try {
      setLoadingAppointments(true);
      const token = JSON.parse(localStorage.getItem('user') || '{}').token;
      
      const response = await fetch(
        `${API_BASE_URL}/appointments?patientId=${patientId}`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch appointments');
      
      const data = await response.json();
      setPatientAppointments(data.data || []);
    } catch (err: any) {
      console.error('Error fetching patient appointments:', err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleViewPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    await fetchPatientAppointments(patient.id);
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-700 border-green-200',
      PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
      CONFIRMED: 'bg-blue-100 text-blue-700 border-blue-200',
      COMPLETED: 'bg-gray-100 text-gray-700 border-gray-200',
      CANCELLED: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return '📹';
      case 'AUDIO':
        return '📞';
      case 'CHAT':
        return '💬';
      default:
        return '📅';
    }
  };

  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'ACTIVE').length,
    pending: patients.filter(p => p.status === 'PENDING').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Patients</h1>
            <p className="text-gray-600">Manage and view your patient records</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2">
              <SortAsc className="w-4 h-4" />
              Sort
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Patients</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filter Section */}
      <Card className="border-none shadow-sm mb-6 bg-white">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 border-gray-200"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('ALL')}
                className={`flex-1 md:flex-none ${statusFilter === 'ALL' ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 border-blue-200'}`}
              >
                All ({patients.length})
              </Button>
              <Button
                variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('ACTIVE')}
                className={`flex-1 md:flex-none ${statusFilter === 'ACTIVE' ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 border-blue-200'}`}
              >
                Active ({stats.active})
              </Button>
              <Button
                variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('PENDING')}
                className={`flex-1 md:flex-none ${statusFilter === 'PENDING' ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 border-blue-200'}`}
              >
                Pending ({stats.pending})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients Grid/List */}
      {filteredPatients.length === 0 ? (
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-500 text-center max-w-md">
              {searchTerm 
                ? 'Try adjusting your search criteria or filters' 
                : 'You haven\'t seen any patients yet. Patients will appear here once you have appointments.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <Card 
              key={patient.id} 
              className="border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white cursor-pointer group overflow-hidden"
              onClick={() => handleViewPatient(patient)}
            >
              <CardContent className="p-6">
                {/* Patient Header */}
                <div className="flex items-start gap-4 mb-6">
                  {patient.user.avatarUrl ? (
                    <img
                      src={patient.user.avatarUrl}
                      alt={patient.user.fullName}
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-50 group-hover:ring-blue-100 transition-all"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center ring-4 ring-blue-50 group-hover:ring-blue-100 transition-all">
                      <span className="text-white font-bold text-xl">
                        {getInitials(patient.user.fullName)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 truncate mb-1 group-hover:text-blue-600 transition-colors">
                      {patient.user.fullName}
                    </h3>
                    <Badge className={`${getStatusColor(patient.status)} border text-xs font-medium`}>
                      {patient.status}
                    </Badge>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>

                {/* Patient Quick Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">{calculateAge(patient.dateOfBirth)} years • {patient.gender}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="truncate font-medium">{patient.user.email}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">{patient.user.phone}</span>
                  </div>

                  {patient.bloodType && (
                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-red-50 rounded-lg p-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                        <Heart className="w-4 h-4 text-red-600" />
                      </div>
                      <span className="font-medium">Blood Type: {patient.bloodType}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Patient Details Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)} >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-white">
          {selectedPatient && (
            <div>
              {/* Dialog Header with gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="absolute right-4 top-4 rounded-full p-1 hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-start gap-4">
                  {selectedPatient.user.avatarUrl ? (
                    <img
                      src={selectedPatient.user.avatarUrl}
                      alt={selectedPatient.user.fullName}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-white/30"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center ring-4 ring-white/30">
                      <span className="text-white font-bold text-2xl">
                        {getInitials(selectedPatient.user.fullName)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">
                      {selectedPatient.user.fullName}
                    </h2>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className="bg-white/20 text-white border-white/30">
                        {selectedPatient.status}
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30">
                        {calculateAge(selectedPatient.dateOfBirth)} years old
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30">
                        {selectedPatient.gender}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-white/90">
                      <span>📧 {selectedPatient.user.email}</span>
                      <span>📱 {selectedPatient.user.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dialog Body */}
              <div className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Date of Birth</p>
                      <p className="font-semibold text-gray-900">{formatDate(selectedPatient.dateOfBirth)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Age</p>
                      <p className="font-semibold text-gray-900">{calculateAge(selectedPatient.dateOfBirth)} years</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Gender</p>
                      <p className="font-semibold text-gray-900">{selectedPatient.gender}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                      <p className="text-sm text-red-600 mb-1">Blood Type</p>
                      <p className="font-bold text-red-700 text-lg">{selectedPatient.bloodType || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Insurance Information */}
                {(selectedPatient.insuranceProvider || selectedPatient.insuranceNumber) && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-green-600" />
                      </div>
                      Insurance Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {selectedPatient.insuranceProvider && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-500 mb-1">Provider</p>
                          <p className="font-semibold text-gray-900">{selectedPatient.insuranceProvider}</p>
                        </div>
                      )}
                      {selectedPatient.insuranceNumber && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-500 mb-1">Policy Number</p>
                          <p className="font-semibold text-gray-900">{selectedPatient.insuranceNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Appointment History */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-600" />
                    </div>
                    Appointment History
                    {patientAppointments.length > 0 && (
                      <Badge className="ml-2 bg-purple-100 text-purple-700 border-purple-200">
                        {patientAppointments.length} total
                      </Badge>
                    )}
                  </h3>
                  {loadingAppointments ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : patientAppointments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No appointments found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patientAppointments.map((appointment) => (
                        <div 
                          key={appointment.id} 
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:border-blue-200 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                              {getAppointmentTypeIcon(appointment.type)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{formatDateTime(appointment.appointmentDate)}</p>
                              <p className="text-sm text-gray-500">{appointment.type} Consultation</p>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(appointment.status)} border font-medium`}>
                            {appointment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorPatientsPage;