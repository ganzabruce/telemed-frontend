import React, { useState, useEffect } from 'react';
import {
  Settings,
  Lock,
  User,
  Mail,
  Phone,
  Calendar,
  Heart,
  FileText,
  Shield,
  Building2,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/apiConfig';

interface PatientProfile {
  id: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  medicalHistory: any;
  insuranceProvider?: string;
  insuranceNumber?: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
  hospital?: {
    id: string;
    name: string;
  };
}



const formatBloodType = (bloodType: string): string => {
  return bloodType
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
};

const SettingsPage = () => {
  const { state } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = state.user?.token;

      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Fetch user info
      const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserInfo(userResponse.data);

      // Fetch patient profile if user is a patient
      if (state.user?.role === 'PATIENT') {
        try {
          const patientResponse = await axios.get(`${API_BASE_URL}/patients/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPatientProfile(patientResponse.data.data);
        } catch (error: any) {
          if (error.response?.status !== 404) {
            console.error('Error fetching patient profile:', error);
            toast.error('Failed to load patient profile');
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      const token = state.user?.token;

      await axios.patch(
        `${API_BASE_URL}/auth/change-password`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Password changed successfully');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      let errorMessage = 'Failed to change password';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      toast.error(errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatGender = (gender: string) => {
    return gender ? gender.charAt(0) + gender.slice(1).toLowerCase() : 'Not set';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-600" />
          Settings
        </h1>
        <p className="text-gray-600 text-lg">Manage your account settings and profile information</p>
      </div>

      {/* User Information Card */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gray-400 text-white">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <User className="w-6 h-6" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <p className="text-lg text-gray-900">{userInfo?.fullName || 'Not set'}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <p className="text-lg text-gray-900">{userInfo?.email || 'Not set'}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone
              </Label>
              <p className="text-lg text-gray-900">{userInfo?.phone || 'Not set'}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Role
              </Label>
              <p className="text-lg text-gray-900 capitalize">
                {userInfo?.role?.replace('_', ' ').toLowerCase() || 'Not set'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Profile Information */}
      {state.user?.role === 'PATIENT' && patientProfile && (
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r bg-gray-400 text-white">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Heart className="w-6 h-6" />
              Medical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date of Birth
                </Label>
                <p className="text-lg text-gray-900">{formatDate(patientProfile.dateOfBirth)}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Gender
                </Label>
                <p className="text-lg text-gray-900">{formatGender(patientProfile.gender)}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Blood Type
                </Label>
                <p className="text-lg text-gray-900">
                  {patientProfile.bloodType
                    ? formatBloodType(patientProfile.bloodType)
                    : 'Not set'}
                </p>
              </div>

              {patientProfile.hospital && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Hospital
                  </Label>
                  <p className="text-lg text-gray-900">{patientProfile.hospital.name}</p>
                </div>
              )}

              {patientProfile.insuranceProvider && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Insurance Provider
                  </Label>
                  <p className="text-lg text-gray-900">{patientProfile.insuranceProvider}</p>
                </div>
              )}

              {patientProfile.insuranceNumber && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Insurance Number
                  </Label>
                  <p className="text-lg text-gray-900">{patientProfile.insuranceNumber}</p>
                </div>
              )}

              {patientProfile.medicalHistory && (
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Medical History
                  </Label>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {typeof patientProfile.medicalHistory === 'string'
                        ? patientProfile.medicalHistory
                        : JSON.stringify(patientProfile.medicalHistory, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Password Change Card */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gray-400 text-white">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Lock className="w-6 h-6" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {!showPasswordForm ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Password</h3>
                <p className="text-sm text-gray-600">Change your account password</p>
              </div>
              <Button onClick={() => setShowPasswordForm(true)} variant="outline">
                Change Password
              </Button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={changingPassword || newPassword !== confirmPassword || newPassword.length < 6}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  disabled={changingPassword}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;

