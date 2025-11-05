
import React, { useEffect, useState } from 'react';
import { Plus, Mail, UserCog, Users, Edit, Search, Stethoscope, Phone, DollarSign, FileText, Filter, Download } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';

const API_URL = 'http://localhost:5002';

export const StaffManagement = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [receptionists, setReceptionists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteType, setInviteType] = useState<'DOCTOR' | 'RECEPTIONIST'>('DOCTOR');
  const [inviteForm, setInviteForm] = useState({ email: '', fullName: '', phone: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user') || '{}').token;
      
      const [doctorsRes, receptionistsRes] = await Promise.all([
        fetch(`${API_URL}/doctors`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/receptionists`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const doctorsData = await doctorsRes.json();
      const receptionistsData = await receptionistsRes.json();
      
      setStaff(doctorsData.data || []);
      setReceptionists(receptionistsData.data || []);
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
        body: JSON.stringify({ ...inviteForm, role: inviteType })
      });

      if (response.ok) {
        toast.success('Invitation sent successfully');
        setShowInviteDialog(false);
        setInviteForm({ email: '', fullName: '', phone: '' });
        fetchStaff();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to send invitation');
      }
    } catch (err) {
      toast.error('Failed to send invitation');
    }
  };

  const filteredStaff = staff.filter(s => 
    s.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReceptionists = receptionists.filter(r =>
    r.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    {
      label: 'Total Doctors',
      value: staff.length,
      icon: Stethoscope,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Available',
      value: staff.filter(d => d.status === 'AVAILABLE').length,
      icon: UserCog,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Receptionists',
      value: receptionists.length,
      icon: Users,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Staff Management
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage doctors and receptionists</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2 shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="w-4 h-4" />
                Invite Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg overflow-hidden p-0">
              {/* Decorative header background */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-5"></div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full opacity-10"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full opacity-10"></div>
                <DialogHeader className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <DialogTitle className="text-3xl font-bold text-white">
                      Invite Staff Member
                    </DialogTitle>
                  </div>
                  <p className="text-blue-100 text-sm">Send an invitation to join your hospital team</p>
                </DialogHeader>
              </div>

              {/* Form content */}
              <div className="p-6 space-y-5 bg-white">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-purple-600" />
                    Staff Type
                  </Label>
                  <Select value={inviteType} onValueChange={(value: any) => setInviteType(value)}>
                    <SelectTrigger className="mt-2 h-12 border-2 focus:border-purple-500 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCTOR">
                        <div className="flex items-center gap-2 py-1 bg-white">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Stethoscope className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Doctor</p>
                            <p className="text-xs text-gray-500">Medical practitioner</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="RECEPTIONIST" >
                        <div className="flex items-center gap-2 py-1 bg-white">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">Receptionist</p>
                            <p className="text-xs text-gray-500">Front desk staff</p>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Full Name</Label>
                    <Input
                      className="mt-2 h-11 border-2 focus:border-purple-500 bg-white transition-colors"
                      placeholder="e.g., Dr. John Doe"
                      value={inviteForm.fullName}
                      onChange={(e) => setInviteForm({...inviteForm, fullName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Email Address</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="email"
                        className="pl-10 h-11 border-2 focus:border-purple-500 bg-white transition-colors"
                        placeholder="john.doe@example.com"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Phone Number</Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        className="pl-10 h-11 border-2 focus:border-purple-500 bg-white transition-colors"
                        placeholder="+250 XXX XXX XXX"
                        value={inviteForm.phone}
                        onChange={(e) => setInviteForm({...inviteForm, phone: e.target.value})}
                      />
                    </div>
                  </div>
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
                    className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Mail className="w-5 h-5" />
                    Send Invitation
                  </Button>
                </div>

                {/* Info note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
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
        {stats.map((stat, index) => (
          <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-4 rounded-full`}>
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
              className="pl-12 h-12 text-lg border-2 focus:border-purple-500 transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* Doctors Table */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Stethoscope className="w-6 h-6" />
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
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
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
                          <DollarSign className="w-4 h-4" />
                          {doctor.consultationFee} RWF
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={doctor.status === 'AVAILABLE' ? 'default' : 'secondary'}
                          className={doctor.status === 'AVAILABLE' 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-gray-400 hover:bg-gray-500'
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

      {/* Receptionists Table */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Users className="w-6 h-6" />
            Receptionists ({filteredReceptionists.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Receptionist</TableHead>
                  <TableHead className="font-semibold text-gray-700">Email</TableHead>
                  <TableHead className="font-semibold text-gray-700">Phone</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceptionists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No receptionists found</p>
                      <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReceptionists.map((receptionist) => (
                    <TableRow key={receptionist.id} className="hover:bg-purple-50 transition-colors duration-150">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold">
                            {receptionist.user?.fullName?.charAt(0) || 'R'}
                          </div>
                          <span className="font-medium text-gray-900">{receptionist.user?.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {receptionist.user?.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {receptionist.user?.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="gap-2 hover:bg-purple-100 hover:text-purple-600 transition-colors"
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
    </div>
  );
};