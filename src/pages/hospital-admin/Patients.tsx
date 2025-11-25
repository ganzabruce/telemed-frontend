import { useEffect, useState } from 'react';
import { Search, Users, UserPlus, Filter, Download, Mail, Phone, Eye, X, User, MapPin, CreditCard, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { Button } from '../../components/ui/button';
import {
  Card, CardContent, CardHeader, CardTitle
} from '../../components/ui/card';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow
} from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogTrigger
} from '../../components/ui/dialog';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue,
} from '../../components/ui/select';
import { API_BASE_URL } from '../../utils/apiConfig';

const API_URL = API_BASE_URL;

export const PatientsManagement = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    gender: 'all',
    bloodType: 'all'
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user') || '{}').token;
      
      const response = await fetch(`${API_URL}/patients/hospital`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch patients: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        setPatients(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch patients');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch patients';
      toast.error(errorMessage);
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filter dropdowns
  const genders = Array.from(new Set(patients.map(p => p.gender).filter(Boolean)));
  const bloodTypes = Array.from(new Set(patients.map(p => p.bloodType).filter(Boolean)));

  const filteredPatients = patients.filter(p => {
    // Search filter
    const matchesSearch = 
      p.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = filters.status === 'all' || p.status === filters.status;

    // Gender filter
    const matchesGender = filters.gender === 'all' || p.gender === filters.gender;

    // Blood type filter
    const matchesBloodType = filters.bloodType === 'all' || p.bloodType === filters.bloodType;

    return matchesSearch && matchesStatus && matchesGender && matchesBloodType;
  });

  const handleExportExcel = () => {
    if (filteredPatients.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Prepare data for Excel
    const excelData = filteredPatients.map(patient => ({
      'Name': patient.user?.fullName || '',
      'Email': patient.user?.email || '',
      'Phone': patient.user?.phone || '',
      'Gender': patient.gender || '',
      'Blood Type': patient.bloodType || 'N/A',
      'Status': patient.status || ''
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');

    // Set column widths
    const columnWidths = [
      { wch: 25 }, // Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 12 }, // Gender
      { wch: 12 }, // Blood Type
      { wch: 12 }  // Status
    ];
    worksheet['!cols'] = columnWidths;

    // Generate Excel file and download
    const fileName = `patients-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast.success(`Exported ${filteredPatients.length} patients to Excel`);
  };

  const handleResetFilters = () => {
    setFilters({ status: 'all', gender: 'all', bloodType: 'all' });
    toast.success('Filters reset');
  };

  const activeFiltersCount = 
    (filters.status !== 'all' ? 1 : 0) + 
    (filters.gender !== 'all' ? 1 : 0) + 
    (filters.bloodType !== 'all' ? 1 : 0);

  const handleViewDetails = (patient: any) => {
    setSelectedPatient(patient);
    setShowDetailsDialog(true);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const calculateAge = (dateOfBirth: string | undefined) => {
    if (!dateOfBirth) return 'N/A';
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return 'N/A';
    }
  };

  const stats = [
    {
      label: 'Total Patients',
      value: patients.length,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Active',
      value: patients.filter(p => p.status === 'ACTIVE').length,
      icon: UserPlus,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Inactive',
      value: patients.filter(p => p.status !== 'ACTIVE').length,
      icon: Users,
      color: 'bg-gray-500',
      textColor: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

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
    <div className="space-y-6 p-6 bg-linear-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-blue-500 bg-clip-text text-transparent">
            Patient Management
          </h1>
          <p className="text-gray-600 mt-2 text-lg">View and manage registered patients</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 relative">
                <Filter className="w-4 h-4" />
                Filter
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filter Patients
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">Gender</Label>
                  <Select
                    value={filters.gender}
                    onValueChange={(value) => setFilters({ ...filters, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">All Genders</SelectItem>
                      {genders.map((gender) => (
                        <SelectItem key={gender} value={gender}>
                          {gender}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">Blood Type</Label>
                  <Select
                    value={filters.bloodType}
                    onValueChange={(value) => setFilters({ ...filters, bloodType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">All Blood Types</SelectItem>
                      {bloodTypes.map((bloodType) => (
                        <SelectItem key={bloodType} value={bloodType}>
                          {bloodType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    className="flex-1"
                    disabled={activeFiltersCount === 0}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    onClick={() => setShowFilterDialog(false)}
                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          // Map colors to gradient backgrounds
          const gradientMap: Record<string, string> = {
            'bg-blue-50': 'bg-blue-500 ',
            'bg-green-50': 'bg-green-500 ',
            'bg-gray-50': 'from-gray-500 to-gray-600',
            'bg-purple-50': 'bg-purple-500 ',
            'bg-orange-50': 'bg-orange-500 ',
            'bg-indigo-50': 'bg-indigo-500 ',
          };
          const gradient = gradientMap[stat.bgColor] || 'from-blue-500 to-blue-600';
          
          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">{stat.label}</h3>
            </div>
          );
        })}
      </div>

      {/* Search Bar */}
      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search patients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg outline-none focus:outline-none focus:border-none transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-linear-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="text-2xl">All Patients ({filteredPatients.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                  <TableHead className="font-semibold text-gray-700">Gender</TableHead>
                  <TableHead className="font-semibold text-gray-700">Blood Type</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No patients found</p>
                      <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient, _index) => (
                    <TableRow 
                      key={patient.id} 
                      className="hover:bg-blue-50 transition-colors duration-150"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500  flex items-center justify-center text-white font-semibold">
                            {patient.user?.fullName?.charAt(0) || 'P'}
                          </div>
                          <span className="font-medium text-gray-900">{patient.user?.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            {patient.user?.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {patient.user?.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-700">{patient.gender}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-semibold">
                          {patient.bloodType || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={patient.status === 'ACTIVE' ? 'default' : 'secondary'}
                          className={patient.status === 'ACTIVE' 
                            ? 'bg-green-400 hover:bg-green-600 text-white' 
                            : 'bg-gray-400 hover:bg-gray-500 text-white'
                          }
                        >
                          {patient.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="gap-2 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          onClick={() => handleViewDetails(patient)}
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Patient Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <User className="w-6 h-6" />
              Patient Details
            </DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6 py-4">
              {/* Patient Header */}
              <div className="flex items-center gap-4 p-5 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {selectedPatient.user?.fullName?.charAt(0) || 'P'}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedPatient.user?.fullName || 'Unknown Patient'}
                  </h3>
                  <p className="text-gray-600">Patient Information</p>
                  <Badge 
                    variant={selectedPatient.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className={selectedPatient.status === 'ACTIVE' 
                      ? 'bg-green-400 hover:bg-green-600 mt-2 text-white' 
                      : 'bg-gray-400 hover:bg-gray-500 mt-2 text-white'
                    }
                  >
                    {selectedPatient.status}
                  </Badge>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  Contact Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="font-semibold text-gray-900">{selectedPatient.user?.email || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="font-semibold text-gray-900">{selectedPatient.user?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  Personal Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {selectedPatient.dateOfBirth && (
                    <>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">Date of Birth</p>
                        <p className="font-semibold text-gray-900">{formatDate(selectedPatient.dateOfBirth)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">Age</p>
                        <p className="font-semibold text-gray-900">{calculateAge(selectedPatient.dateOfBirth)} years</p>
                      </div>
                    </>
                  )}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Gender</p>
                    <p className="font-semibold text-gray-900">{selectedPatient.gender || 'N/A'}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <p className="text-sm text-red-600 mb-1">Blood Type</p>
                    <p className="font-bold text-red-700 text-lg">{selectedPatient.bloodType || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              {selectedPatient.address && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    Address
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">{selectedPatient.address}</p>
                  </div>
                </div>
              )}

              {/* Insurance Information */}
              {(selectedPatient.insuranceProvider || selectedPatient.insuranceNumber) && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    </div>
                    Insurance Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedPatient.insuranceProvider && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">Insurance Provider</p>
                        <p className="font-semibold text-gray-900">{selectedPatient.insuranceProvider}</p>
                      </div>
                    )}
                    {selectedPatient.insuranceNumber && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">Insurance Number</p>
                        <p className="font-semibold text-gray-900">{selectedPatient.insuranceNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Medical History / Allergies */}
              {selectedPatient.allergies && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    </div>
                    Allergies
                  </h3>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <p className="font-semibold text-red-700">{selectedPatient.allergies}</p>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => setShowDetailsDialog(false)}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};