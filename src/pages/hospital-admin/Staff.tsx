
import { useEffect, useState } from 'react';
import { Plus, Mail, UserCog, Edit, Search, Stethoscope, Phone,  FileText, Filter, Download, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import {
  Card, CardContent, CardHeader, CardTitle
} from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { API_BASE_URL } from '../../utils/apiConfig';

const API_URL = API_BASE_URL;

export const StaffManagement = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: ''});
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditFeeDialog, setShowEditFeeDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [newFee, setNewFee] = useState<string>('');
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    specialization: 'all'
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user') || '{}').token;
      
      const doctorsRes = await fetch(`${API_URL}/doctors`, { headers: { Authorization: `Bearer ${token}` } });
      const doctorsData = await doctorsRes.json();

      setStaff(doctorsData.data || []);
    } catch (err) {
      toast.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteStaff = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user') || '{}').token;
      
      const response = await fetch(`${API_URL}/users/invite-staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...inviteForm, role: 'DOCTOR' })
      });

      if (response.ok) {
        toast.success('Invitation sent successfully');
        setShowInviteDialog(false);
        setInviteForm({ email: ''});
        fetchStaff();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to send invitation');
      }
    } catch (err) {
      toast.error('Failed to send invitation');
    }
  };

  // Get unique specializations for filter dropdown
  const specializations = Array.from(new Set(staff.map(s => s.specialization).filter(Boolean)));

  const filteredStaff = staff.filter(s => {
    // Search filter
    const matchesSearch = 
      s.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.specialization?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = filters.status === 'all' || s.status === filters.status;

    // Specialization filter
    const matchesSpecialization = filters.specialization === 'all' || s.specialization === filters.specialization;

    return matchesSearch && matchesStatus && matchesSpecialization;
  });

  const handleExportExcel = () => {
    if (filteredStaff.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Prepare data for Excel
    const excelData = filteredStaff.map(doctor => ({
      'Name': doctor.user?.fullName || '',
      'Email': doctor.user?.email || '',
      'Phone': doctor.user?.phone || '',
      'Specialization': doctor.specialization || '',
      'License Number': doctor.licenseNumber || '',
      'Consultation Fee (RWF)': doctor.consultationFee || 0,
      'Status': doctor.status || ''
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff');

    // Set column widths
    const columnWidths = [
      { wch: 25 }, // Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 20 }, // Specialization
      { wch: 18 }, // License Number
      { wch: 20 }, // Consultation Fee
      { wch: 12 }  // Status
    ];
    worksheet['!cols'] = columnWidths;

    // Generate Excel file and download
    const fileName = `staff-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast.success(`Exported ${filteredStaff.length} staff members to Excel`);
  };

  const handleResetFilters = () => {
    setFilters({ status: 'all', specialization: 'all' });
    toast.success('Filters reset');
  };

  const activeFiltersCount = (filters.status !== 'all' ? 1 : 0) + (filters.specialization !== 'all' ? 1 : 0);

  const openEditFee = (doctor: any) => {
    setSelectedDoctor(doctor);
    setNewFee(String(doctor.consultationFee || ''));
    setShowEditFeeDialog(true);
  };

  const saveConsultationFee = async () => {
    if (!selectedDoctor) return;
    const parsed = Number(newFee);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error('Please enter a valid positive fee.');
      return;
    }
    try {
      const token = JSON.parse(localStorage.getItem('user') || '{}').token;
      const res = await fetch(`${API_URL}/doctors/${selectedDoctor.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ consultationFee: parsed })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update fee');
      }
      toast.success('Consultation fee updated');
      setStaff(prev => prev.map(d => d.id === selectedDoctor.id ? { ...d, consultationFee: parsed } : d));
      setShowEditFeeDialog(false);
      setSelectedDoctor(null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update fee');
    }
  };

  
  const stats = [
    {
      label: 'Total Doctors',
      value: filteredStaff.length,
      icon: Stethoscope,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Available Doctors',
      value: filteredStaff.filter(d => d.status === 'AVAILABLE').length,
      icon: UserCog,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50  min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-blue-600 bg-clip-text text-transparent">
            Staff Management
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage doctors</p>
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
                  Filter Staff
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
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="UNAVAILABLE">Unavailable</SelectItem>
                      <SelectItem value="BUSY">Busy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">Specialization</Label>
                  <Select
                    value={filters.specialization}
                    onValueChange={(value) => setFilters({ ...filters, specialization: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">All Specializations</SelectItem>
                      {specializations.map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
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
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 text-white hover:bg-blue-700 hover:to-purple-700 gap-2 shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="w-4 h-4" />
                Invite Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg overflow-hidden p-0 bg-white">
                {/* Form content */}
              <div className="p-6 space-y-5 bg-white">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-blue-600" />
                    Staff Type
                  </Label>
                  <div className="mt-2 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Doctor</p>
                        <p className="text-sm text-gray-600">Medical practitioner</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-gray-50 rounded-xl p-4">
                  {/* <div>
                    <Label className="text-sm font-semibold text-gray-700">Full Name</Label>
                    <Input
                      className="mt-2 h-11 outline-none bg-white transition-colors"
                      placeholder="e.g., Dr. John Doe"
                      value={inviteForm.fullName}
                      onChange={(e) => setInviteForm({...inviteForm, fullName: e.target.value})}
                    />
                  </div> */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Email Address</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="email"
                        className="pl-10 h-11 outline-no bg-white transition-colors"
                        placeholder="john.doe@example.com"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                      />
                    </div>
                  </div>
                  {/* <div>
                    <Label className="text-sm font-semibold text-gray-700">Phone Number</Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        className="pl-10 h-11 outline-no bg-white transition-colors"
                        placeholder="+250 XXX XXX XXX"
                        value={inviteForm.phone}
                        onChange={(e) => setInviteForm({...inviteForm, phone: e.target.value})}
                      />
                    </div> */}
                  {/* </div> */}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline"
                    onClick={() => setShowInviteDialog(false)}
                    className="flex-1 h-12 border-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleInviteStaff}
                    className="flex-1 text-white h-12 bg-blue-500 hover:from-blue-700 hover:to-purple-700 gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Mail className="w-5 h-5" />
                    Send Invitation
                  </Button>
                </div>

                {/* Info note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">i</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    An invitation email will be sent with instructions to complete registration and join your hospital.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          // Map colors to gradient backgrounds
          const gradientMap: Record<string, string> = {
            'bg-blue-50': 'bg-blue-500',
            'bg-green-50': 'bg-green-500',
            'bg-gray-50': 'bg-gray-500',
            'bg-purple-50': 'bg-purple-500',
            'bg-orange-50': 'bg-orange-500',
            'bg-indigo-50': 'bg-indigo-500',
          };
          const gradient = gradientMap[stat.bgColor] || 'bg-blue-500';
          
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
              placeholder="Search staff by name, email, or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg  outline-none focus:outline-none focus:border-none transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* Doctors Table */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-blue-600 to-blue-700 text-white">
          <CardTitle className="flex items-center gap-2 text-2xl text-blue-600">
            <Stethoscope className="w-6 h-6 " />
            
            Doctors ({filteredStaff.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Doctor</TableHead>
                  <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                  <TableHead className="font-semibold text-gray-700">Specialization</TableHead>
                  <TableHead className="font-semibold text-gray-700">License</TableHead>
                  <TableHead className="font-semibold text-gray-700">Fee</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No doctors found</p>
                      <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((doctor) => (
                    <TableRow key={doctor.id} className="hover:bg-blue-50 transition-colors duration-150">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500  flex items-center justify-center text-white font-semibold">
                            {doctor.user?.fullName?.charAt(0) || 'D'}
                          </div>
                          <span className="font-medium text-gray-900">{doctor.user?.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            {doctor.user?.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {doctor.user?.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium border-blue-200 text-blue-700">
                          {doctor.specialization}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText className="w-4 h-4" />
                          {doctor.licenseNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-semibold text-gray-700">
                          {doctor.consultationFee} RWF
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={doctor.status === 'AVAILABLE' ? 'default' : 'secondary'}
                          className={doctor.status === 'AVAILABLE' 
                            ? 'bg-green-500 text-white hover:bg-green-600' 
                            : 'bg-gray-400 text-white hover:bg-gray-500'
                          }
                        >
                          {doctor.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="gap-2 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          onClick={() => openEditFee(doctor)}
                        >
                          <Edit className="w-4 h-4" />
                          Edit
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

      {/* Edit Consultation Fee Dialog */}
      <Dialog open={showEditFeeDialog} onOpenChange={setShowEditFeeDialog}>
        <DialogContent className="sm:max-w-l overflow-hidden  bg-white">
          <DialogHeader>
            <DialogTitle>Update Consultation Fee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {selectedDoctor ? <>Doctor: <strong>{selectedDoctor.user?.fullName}</strong></> : null}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Consultation Fee (RWF)</Label>
              <Input
                value={newFee}
                onChange={(e) => setNewFee(e.target.value)}
                placeholder="e.g., 20000"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditFeeDialog(false)}>Cancel</Button>
              <Button onClick={saveConsultationFee} className="bg-blue-600 text-white hover:bg-blue-700 hover:to-purple-700 gap-2 shadow-lg hover:shadow-xl transition-all duration-300">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};