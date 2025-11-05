import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, Phone, Mail, FileText, AlertCircle, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const filtered = patients.filter(patient =>
      patient.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

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

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
          <h1 className="text-3xl font-bold text-gray-900">My Patients</h1>
          <p className="text-gray-500 mt-1">View and manage your patient records</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2 w-fit">
          {patients.length} Patient{patients.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search patients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-500 text-center">
              {searchTerm ? 'Try adjusting your search criteria' : 'You haven\'t seen any patients yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  {patient.user.avatarUrl ? (
                    <img
                      src={patient.user.avatarUrl}
                      alt={patient.user.fullName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {getInitials(patient.user.fullName)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">
                      {patient.user.fullName}
                    </h3>
                    <Badge className={getStatusColor(patient.status)}>
                      {patient.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{calculateAge(patient.dateOfBirth)} years • {patient.gender}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{patient.user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{patient.user.phone}</span>
                  </div>
                  {patient.bloodType && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>Blood Type: {patient.bloodType}</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleViewPatient(patient)}
                  className="w-full mt-4"
                  variant="outline"
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Patient Details</DialogTitle>
            <DialogDescription>
              Comprehensive patient information and history
            </DialogDescription>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 pb-4 border-b">
                {selectedPatient.user.avatarUrl ? (
                  <img
                    src={selectedPatient.user.avatarUrl}
                    alt={selectedPatient.user.fullName}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-xl">
                      {getInitials(selectedPatient.user.fullName)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedPatient.user.fullName}
                  </h3>
                  <p className="text-gray-500">{selectedPatient.user.email}</p>
                  <p className="text-gray-500">{selectedPatient.user.phone}</p>
                  <Badge className={`${getStatusColor(selectedPatient.status)} mt-2`}>
                    {selectedPatient.status}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-3">Personal Information</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium">{formatDate(selectedPatient.dateOfBirth)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="font-medium">{calculateAge(selectedPatient.dateOfBirth)} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium">{selectedPatient.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Blood Type</p>
                    <p className="font-medium">{selectedPatient.bloodType || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {(selectedPatient.insuranceProvider || selectedPatient.insuranceNumber) && (
                <div>
                  <h4 className="font-semibold text-lg mb-3">Insurance Information</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedPatient.insuranceProvider && (
                      <div>
                        <p className="text-sm text-gray-500">Provider</p>
                        <p className="font-medium">{selectedPatient.insuranceProvider}</p>
                      </div>
                    )}
                    {selectedPatient.insuranceNumber && (
                      <div>
                        <p className="text-sm text-gray-500">Policy Number</p>
                        <p className="font-medium">{selectedPatient.insuranceNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-lg mb-3">Appointment History</h4>
                {loadingAppointments ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : patientAppointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No appointments found</p>
                ) : (
                  <div className="space-y-3">
                    {patientAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{formatDate(appointment.appointmentDate)}</p>
                            <p className="text-sm text-gray-500">{appointment.type}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorPatientsPage;