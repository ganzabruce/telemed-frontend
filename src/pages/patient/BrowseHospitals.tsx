import  { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  MapPin,
  Phone,
  Mail,
  Stethoscope,
  Clock,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getHospitals } from '@/api/patientsApi';
import { BookAppointmentModal } from './BookAppointmentModal';
import { toast } from 'react-hot-toast';
import type { ApiHospital, ApiDoctor, ApiAvailabilitySlot } from '@/types/api';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
const DAY_NAMES: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

const BrowseHospitalsPage = () => {
  const [hospitals, setHospitals] = useState<ApiHospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<ApiHospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedHospitals, setExpandedHospitals] = useState<Set<string>>(new Set());
  const [specializationFilter, setSpecializationFilter] = useState<string>('ALL');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<ApiDoctor | null>(null);

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    filterHospitals();
  }, [searchTerm, specializationFilter, hospitals]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch hospitals with doctors and their availability
      const hospitalsData = await getHospitals(true);
      setHospitals(hospitalsData);
      setFilteredHospitals(hospitalsData);
    } catch (err: any) {
      console.error('Error fetching hospitals:', err);
      setError(err.response?.data?.message || 'Failed to load hospitals');
      toast.error('Failed to load hospitals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterHospitals = () => {
    let filtered = [...hospitals];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((hospital) => {
        const matchesHospital = hospital.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          hospital.address?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDoctor = hospital.doctors?.some((doctor) =>
          doctor.user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return matchesHospital || matchesDoctor;
      });
    }

    // Filter by specialization
    if (specializationFilter !== 'ALL') {
      filtered = filtered.map((hospital) => ({
        ...hospital,
        doctors: hospital.doctors?.filter((doctor) =>
          doctor.specialization.toLowerCase().includes(specializationFilter.toLowerCase())
        ),
      })).filter((hospital) => (hospital.doctors?.length || 0) > 0);
    }

    setFilteredHospitals(filtered);
  };

  const toggleHospital = (hospitalId: string) => {
    setExpandedHospitals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(hospitalId)) {
        newSet.delete(hospitalId);
      } else {
        newSet.add(hospitalId);
      }
      return newSet;
    });
  };

  const getSpecializations = (): string[] => {
    const specializations = new Set<string>();
    hospitals.forEach((hospital) => {
      hospital.doctors?.forEach((doctor) => {
        specializations.add(doctor.specialization);
      });
    });
    return Array.from(specializations).sort();
  };

  const formatAvailability = (availabilitySlots: ApiAvailabilitySlot[] | undefined): string => {
    if (!availabilitySlots || availabilitySlots.length === 0) {
      return 'Not set';
    }

    // Group by day
    const byDay: Record<string, ApiAvailabilitySlot[]> = {};
    availabilitySlots.forEach((slot) => {
      if (!byDay[slot.dayOfWeek]) {
        byDay[slot.dayOfWeek] = [];
      }
      byDay[slot.dayOfWeek].push(slot);
    });

    const days = Object.keys(byDay).sort((a, b) => {
      return DAYS_OF_WEEK.indexOf(a as any) - DAYS_OF_WEEK.indexOf(b as any);
    });

    if (days.length === 0) return 'Not set';

    // Format: "Mon: 9:00-17:00, Tue: 9:00-17:00"
    return days
      .map((day) => {
        const slots = byDay[day];
        const times = slots.map((slot) => `${slot.startTime}-${slot.endTime}`).join(', ');
        return `${DAY_NAMES[day]?.substring(0, 3)}: ${times}`;
      })
      .join(', ');
  };

  const handleBookAppointment = (doctor: ApiDoctor, _hospital: ApiHospital) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setSelectedDoctor(null);
    toast.success('Appointment booked successfully!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hospitals and doctors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <Button onClick={fetchHospitals} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const specializations = getSpecializations();

  return (
    <div className="space-y-6 p-6 bg-linear-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold  bg-clip-text text-black mb-2">
          Browse Hospitals & Doctors
        </h1>
        <p className="text-gray-600 text-lg">
          Find hospitals and doctors, view their availability, and book appointments
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="border-none shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search hospitals, doctors, or specializations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 border-gray-200"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={specializationFilter}
                onChange={(e) => setSpecializationFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Specializations</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
              {(searchTerm || specializationFilter !== 'ALL') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSpecializationFilter('ALL');
                  }}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hospitals List */}
      {filteredHospitals.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No hospitals found</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm || specializationFilter !== 'ALL'
                ? 'Try adjusting your search or filters'
                : 'No hospitals available at the moment'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredHospitals.map((hospital) => {
            const isExpanded = expandedHospitals.has(hospital.id);
            const doctorsCount = hospital.doctors?.length || 0;

            return (
              <Card key={hospital.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleHospital(hospital.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                        <Building2 className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">{hospital.name}</CardTitle>
                        <div className="space-y-1 text-sm text-gray-600">
                          {hospital.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{hospital.address}</span>
                            </div>
                          )}
                          {hospital.contactPhone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{hospital.contactPhone}</span>
                            </div>
                          )}
                          {hospital.contactEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{hospital.contactEmail}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {doctorsCount} {doctorsCount === 1 ? 'Doctor' : 'Doctors'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleHospital(hospital.id)}
                      className="ml-4"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    {doctorsCount === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p>No doctors available at this hospital</p>
                      </div>
                    ) : (
                      <div className="mt-6 space-y-3">
                        {hospital.doctors?.map((doctor) => (
                          <div
                            key={doctor.id}
                            className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200"
                          >
                            {/* Doctor Avatar */}
                            <div className="shrink-0">
                              {doctor.user.avatarUrl ? (
                                <img
                                  src={doctor.user.avatarUrl}
                                  alt={doctor.user.fullName}
                                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-blue-500  flex items-center justify-center border-2 border-gray-200">
                                  <User className="w-8 h-8 text-white" />
                                </div>
                              )}
                            </div>

                            {/* Doctor Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-lg text-gray-900">
                                      {doctor.user.fullName}
                                    </h3>
                                    <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                                      <Stethoscope className="w-3 h-3 mr-1" />
                                      {doctor.specialization}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                    {/* Consultation Fee */}
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="w-4 h-4 text-gray-600" />
                                      <span className="font-medium">
                                        {doctor.consultationFee.toLocaleString('en-RW', {
                                          style: 'currency',
                                          currency: 'RWF',
                                        })}
                                      </span>
                                    </div>
                                    {/* Availability */}
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-blue-600" />
                                      <span className="text-xs">
                                        {formatAvailability(doctor.availabilitySlots)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Book Appointment Button */}
                                <div className="shrink-0">
                                  <Button
                                    onClick={() => handleBookAppointment(doctor, hospital)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    size="sm"
                                  >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Book
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      {selectedDoctor && (
        <BookAppointmentModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedDoctor(null);
          }}
          onAppointmentBooked={handleBookingSuccess}
          preselectedDoctorId={selectedDoctor.id}
          preselectedHospitalId={selectedDoctor.hospitalId}
        />
      )}
    </div>
  );
};

export default BrowseHospitalsPage;

