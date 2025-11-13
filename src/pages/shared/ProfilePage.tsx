// src/pages/shared/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Mail, 
  Phone, 
  Calendar, 
  Briefcase, 
  User, 
  Edit2, 
  Save, 
  X,
  Shield,
  Stethoscope,

  Heart,
  Building2,
  RefreshCw,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

interface ProfileData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  isEmailVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  roleSpecific?: any;
}

const ProfilePage: React.FC = () => {
  const { state, dispatch } = useAuth();
  const user = state.user;
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Form states for editing user profile
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    email: ''
  });

  // Role-specific form states
  const [roleSpecificForm, setRoleSpecificForm] = useState<any>({});

  const API_BASE_URL = 'http://localhost:5003';

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch basic user profile
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch profile');

      const userData = await response.json();

      // Fetch role-specific data
      let roleSpecificData: any = {};
      if (user.role === 'DOCTOR') {
        const doctorResponse = await fetch(`${API_BASE_URL}/doctors`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        if (doctorResponse.ok) {
          const doctorData = await doctorResponse.json();
          roleSpecificData = doctorData.data.find((d: any) => d.userId === user.id) || {};
        }
      } else if (user.role === 'PATIENT') {
        const patientResponse = await fetch(`${API_BASE_URL}/patients`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        if (patientResponse.ok) {
          const patientData = await patientResponse.json();
          roleSpecificData = patientData.data.find((p: any) => p.userId === user.id) || {};
        }
      }

      const completeProfile: ProfileData = { ...userData, roleSpecific: roleSpecificData };
      setProfileData(completeProfile);
      
      // Initialize edit form
      setEditForm({
        fullName: userData.fullName || '',
        phone: userData.phone || '',
        email: userData.email || ''
      });

      if (user.role === 'DOCTOR' && roleSpecificData.id) {
        setRoleSpecificForm({
          specialization: roleSpecificData.specialization || '',
          availability: roleSpecificData.availability || '',
          consultationFee: roleSpecificData.consultationFee || '',
          status: roleSpecificData.status || 'OFFLINE'
        });
      }

    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.token) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      setError(null);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(
        `${API_BASE_URL}/users/${user.id}/avatar`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.token}`
          },
          body: formData
        }
      );

      if (!response.ok) throw new Error('Failed to upload avatar');

      const data = await response.json();

      // Update profile data with new avatar URL
      setProfileData(prev => prev ? {
        ...prev,
        avatarUrl: data.data.avatarUrl
      } : null);

      // Update localStorage user data
      const updatedUser = { ...user, avatarUrl: data.data.avatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccessMessage('Profile picture updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.token || !profileData) return;

    try {
      setSaving(true);
      setError(null);

      // Update basic user profile (fullName, phone)
      const userResponse = await fetch(
        `${API_BASE_URL}/users/${user.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fullName: editForm.fullName,
            phone: editForm.phone
          })
        }
      );

      if (!userResponse.ok) {
        const errorData = await userResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const userData = await userResponse.json();
      
      // Update localStorage and AuthContext with new user data
      if (userData.data && user) {
        const updatedUser = { ...user, fullName: userData.data.fullName, phone: userData.data.phone };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Update AuthContext using RESTORE action
        dispatch({ type: 'RESTORE', payload: updatedUser });
      }

      // Update role-specific data if applicable
      if (user.role === 'DOCTOR' && profileData.roleSpecific?.id) {
        const doctorResponse = await fetch(
          `${API_BASE_URL}/doctors/${profileData.roleSpecific.id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(roleSpecificForm)
          }
        );

        if (!doctorResponse.ok) {
          console.warn('User profile updated but doctor profile update failed');
        }
      }

      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      fetchProfileData();
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      console.error('Error saving profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile. Please try again.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'ADMIN': 'System Administrator',
      'HOSPITAL_ADMIN': 'Hospital Administrator',
      'DOCTOR': 'Doctor',
      'PATIENT': 'Patient'
    };
    return roleMap[role] || role;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'DOCTOR':
        return <Stethoscope className="w-6 h-6 text-white " />;
      case 'PATIENT':
        return <Heart className="w-6 h-6 text-white" />;
      case 'HOSPITAL_ADMIN':
        return <Building2 className="w-6 h-6 text-white" />;
      case 'ADMIN':
        return <Shield className="w-6 h-6 text-white" />;
      default:
        return <User className="w-6 h-6" />;
    }
  };

  const getDashboardPath = (role: string) => {
    const roleMap: Record<string, string> = {
      'ADMIN': '/admin-dashboard',
      'HOSPITAL_ADMIN': '/hospital-admin-dashboard',
      'DOCTOR': '/doctor-dashboard',
      'PATIENT': '/patient-dashboard'
    };
    return roleMap[role] || '/';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 font-medium text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="text-red-600 font-medium mb-2">Error loading profile</p>
            <p className="text-red-500 text-sm mb-4">{error || 'Failed to load profile data'}</p>
            <button 
              onClick={fetchProfileData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gray-500 p-3 rounded-xl">
                {getRoleIcon(profileData.role)}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-600 mt-1">Manage your account information</p>
              </div>
            </div>
            <Link
              to={getDashboardPath(profileData.role)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            <div className="flex items-center gap-2">
              <X className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          {/* Cover Image */}
          <div className="h-32 bg-blue-500 "></div>
          
          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-12">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-blue-500 flex items-center justify-center overflow-hidden shadow-lg">
                  {profileData.avatarUrl ? (
                    <img 
                      src={profileData.avatarUrl} 
                      alt={profileData.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-white">
                      {getInitials(profileData.fullName)}
                    </span>
                  )}
                </div>
                
                {/* Upload Avatar Button */}
                <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors border-2 border-gray-200">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar ? (
                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-gray-600" />
                  )}
                </label>
              </div>

              {/* Name and Role */}
              <div className="flex-1 text-center sm:text-left sm:ml-4 mt-4 sm:mt-0">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="text-2xl md:text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 pb-1 w-full max-w-md"
                    placeholder="Enter your name"
                  />
                ) : (
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{profileData.fullName}</h1>
                )}
                <p className="text-blue-600 font-medium mt-1">{getRoleDisplay(profileData.role)}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    profileData.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  }`}>
                    {profileData.status}
                  </span>
                  {profileData.isEmailVerified && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                      Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Button */}
              {!isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setError(null);
                    // Initialize edit form with current values
                    setEditForm({
                      fullName: profileData.fullName || '',
                      phone: profileData.phone || '',
                      email: profileData.email || ''
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="0781234567"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                  placeholder="Email cannot be changed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed for security reasons</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setError(null);
                    // Reset form to original values
                    setEditForm({
                      fullName: profileData.fullName || '',
                      phone: profileData.phone || '',
                      email: profileData.email || ''
                    });
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{profileData.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="text-sm font-semibold text-gray-900">{profileData.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Role-Specific Information */}
        {user?.role === 'DOCTOR' && profileData.roleSpecific && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Professional Information</h2>
            
            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={roleSpecificForm.specialization || ''}
                    onChange={(e) => setRoleSpecificForm((prev: any) => ({
                      ...prev,
                      specialization: e.target.value
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="e.g., Cardiology, Pediatrics"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Availability
                  </label>
                  <input
                    type="text"
                    value={roleSpecificForm.availability || ''}
                    onChange={(e) => setRoleSpecificForm((prev: any) => ({
                      ...prev,
                      availability: e.target.value
                    }))}
                    placeholder="e.g., Mon-Fri 9am-5pm"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Consultation Fee (RWF)
                  </label>
                  <input
                    type="number"
                    value={roleSpecificForm.consultationFee || ''}
                    onChange={(e) => setRoleSpecificForm((prev: any) => ({
                      ...prev,
                      consultationFee: e.target.value
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="20000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={roleSpecificForm.status || 'OFFLINE'}
                    onChange={(e) => setRoleSpecificForm((prev: any) => ({
                      ...prev,
                      status: e.target.value
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-white"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="BUSY">Busy</option>
                    <option value="OFFLINE">Offline</option>
                  </select>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Specialization</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {profileData.roleSpecific.specialization || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Availability</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {profileData.roleSpecific.availability || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">License Number</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {profileData.roleSpecific.licenseNumber || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl"><DollarSign /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Consultation Fee</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {profileData.roleSpecific.consultationFee 
                        ? `${Number(profileData.roleSpecific.consultationFee).toLocaleString()} RWF`
                        : 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    profileData.roleSpecific.status === 'AVAILABLE' 
                      ? 'bg-green-100'
                      : profileData.roleSpecific.status === 'BUSY'
                      ? 'bg-yellow-100'
                      : 'bg-gray-100'
                  }`}>
                    <div className={`w-4 h-4 rounded-full ${
                      profileData.roleSpecific.status === 'AVAILABLE' 
                        ? 'bg-green-500'
                        : profileData.roleSpecific.status === 'BUSY'
                        ? 'bg-yellow-500'
                        : 'bg-gray-500'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {profileData.roleSpecific.status || 'OFFLINE'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Patient-Specific Information */}
        {user?.role === 'PATIENT' && profileData.roleSpecific && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Patient Information</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {profileData.roleSpecific.dateOfBirth && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(profileData.roleSpecific.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {profileData.roleSpecific.gender && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-pink-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Gender</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {profileData.roleSpecific.gender}
                    </p>
                  </div>
                </div>
              )}

              {profileData.roleSpecific.bloodType && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Blood Type</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {profileData.roleSpecific.bloodType}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Details</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">User ID</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 font-mono">{profileData.id}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Member Since</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {new Date(profileData.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Last Updated</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {new Date(profileData.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
