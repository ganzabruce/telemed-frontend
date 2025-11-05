import { useEffect, useState } from 'react';
import { Search, Users, UserPlus, Filter, Download, Mail, Phone, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
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
import { Badge } from '../../components/ui/badge';

const API_URL = 'http://localhost:5002';

export const PatientsManagement = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user') || '{}').token;
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const hospitalResponse = await fetch(`${API_URL}/hospitals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const hospitalData = await hospitalResponse.json();
      const adminHospital = hospitalData.data.find((h: any) => h.adminId === user.id);

      if (adminHospital) {
        setPatients(adminHospital.patients || []);
      }
    } catch (err) {
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Patient Management
          </h1>
          <p className="text-gray-600 mt-2 text-lg">View and manage registered patients</p>
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
              placeholder="Search patients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg border-2 focus:border-blue-500 transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
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
                  filteredPatients.map((patient, index) => (
                    <TableRow 
                      key={patient.id} 
                      className="hover:bg-blue-50 transition-colors duration-150"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
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
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-gray-400 hover:bg-gray-500'
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
    </div>
  );
};