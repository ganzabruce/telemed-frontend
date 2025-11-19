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
  Heart
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { API_BASE_URL } from '../../utils/apiConfig';

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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

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

  // Pagination logic
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const fetchPatients = async () => {
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
        `${API_BASE_URL}/appointments?patientId=${patientId}&orderBy=appointmentDate&order=desc`,
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50/30 p-4 md:p-6">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500  flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Total Patients</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500  flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.active}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Active Patients</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500  flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.pending}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Pending</h3>
        </div>
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

      {/* Patients Table */}
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
        <>
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedPatients.map((patient) => (
                    <tr 
                      key={patient.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewPatient(patient)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {patient.user.avatarUrl ? (
                            <img
                              src={patient.user.avatarUrl}
                              alt={patient.user.fullName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                              {getInitials(patient.user.fullName)}
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900">{patient.user.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{calculateAge(patient.dateOfBirth)} years</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{patient.gender}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{patient.user.email}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{patient.user.phone}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {patient.bloodType ? (
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-500" />
                            {patient.bloodType}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge className={`${getStatusColor(patient.status)} border text-xs font-medium`}>
                          {patient.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPatient(patient);
                          }}
                          className="h-7 text-xs"
                        >
                          View Details
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredPatients.length)}</span> of{' '}
                <span className="font-medium">{filteredPatients.length}</span> patients
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-9 px-4 text-sm"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-9 w-9 text-sm"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9 px-4 text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Patient Details Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-white">
          {selectedPatient && (
            <>
              {/* Dialog Header with gradient */}
              <div className="bg-linear-to-r from-blue-600 to-blue-500 p-6 text-white relative">
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
                          className="flex items-center justify-between p-4 bg-linear-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:border-blue-200 transition-all"
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorPatientsPage;