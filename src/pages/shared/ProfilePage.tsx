// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { Camera, Mail, Phone, Calendar, Briefcase, User, Edit2, Save, X } from 'lucide-react';
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
  const { state } = useAuth();
  const user = state.user;
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Form states for editing
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    email: ''
  });

  // Role-specific form states
  const [roleSpecificForm, setRoleSpecificForm] = useState<any>({});

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
      const response = await fetch('http://localhost:5002/auth/me', {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch profile');

      const userData = await response.json();

      // Fetch role-specific data
      let roleSpecificData: any = {};
      if (user.role === 'DOCTOR') {
        const doctorResponse = await fetch('http://localhost:5001/doctors', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        if (doctorResponse.ok) {
          const doctorData = await doctorResponse.json();
          roleSpecificData = doctorData.data.find((d: any) => d.userId === user.id) || {};
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
          consultationFee: roleSpecificData.consultationFee || ''
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
        `http://localhost:5001/users/${user.id}/avatar`,
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

      if (user.role === 'DOCTOR' && profileData.roleSpecific?.id) {
        const response = await fetch(
          `http://localhost:5001/doctors/${profileData.roleSpecific.id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(roleSpecificForm)
          }
        );

        if (!response.ok) throw new Error('Failed to update profile');
      }

      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      fetchProfileData();
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to update profile. Please try again.');
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
      'RECEPTIONIST': 'Receptionist',
      'PATIENT': 'Patient'
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Failed to load profile</p>
          <button 
            onClick={fetchProfileData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          
          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-12">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
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
                <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  ) : (
                    <Camera className="w-5 h-5 text-gray-600" />
                  )}
                </label>
              </div>

              {/* Name and Role */}
              <div className="flex-1 text-center sm:text-left sm:ml-4 mt-4 sm:mt-0">
                <h1 className="text-2xl font-bold text-gray-900">{profileData.fullName}</h1>
                <p className="text-blue-600 font-medium mt-1">{getRoleDisplay(profileData.role)}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    profileData.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {profileData.status}
                  </span>
                  {profileData.isEmailVerified && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{profileData.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-900">{profileData.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Role-Specific Information */}
        {user?.role === 'DOCTOR' && profileData.roleSpecific && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Information</h2>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={roleSpecificForm.specialization}
                    onChange={(e) => setRoleSpecificForm((prev: any) => ({
                      ...prev,
                      specialization: e.target.value
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <input
                    type="text"
                    value={roleSpecificForm.availability}
                    onChange={(e) => setRoleSpecificForm((prev: any) => ({
                      ...prev,
                      availability: e.target.value
                    }))}
                    placeholder="e.g., Mon-Fri 9am-5pm"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consultation Fee (RWF)
                  </label>
                  <input
                    type="number"
                    value={roleSpecificForm.consultationFee}
                    onChange={(e) => setRoleSpecificForm((prev: any) => ({
                      ...prev,
                      consultationFee: e.target.value
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Specialization</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profileData.roleSpecific.specialization || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Availability</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profileData.roleSpecific.availability || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">License Number</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profileData.roleSpecific.licenseNumber || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xl">💰</span>
                  <div>
                    <p className="text-xs text-gray-500">Consultation Fee</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profileData.roleSpecific.consultationFee 
                        ? `${Number(profileData.roleSpecific.consultationFee).toLocaleString()} RWF`
                        : 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${
                    profileData.roleSpecific.status === 'AVAILABLE' 
                      ? 'bg-green-500'
                      : profileData.roleSpecific.status === 'BUSY'
                      ? 'bg-yellow-500'
                      : 'bg-gray-500'
                  }`}></div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profileData.roleSpecific.status || 'OFFLINE'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Account Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Details</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">User ID</span>
              <span className="text-sm font-medium text-gray-900 font-mono">{profileData.id}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Member Since</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(profileData.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Last Updated</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(profileData.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
                <Link to={`/${state.user?.role.toLowerCase().replace('_', '-')}-dashboard`} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-blue-700 transition-colors">  Go Back to Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;