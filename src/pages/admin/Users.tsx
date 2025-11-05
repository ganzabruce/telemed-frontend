import { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, UserCircle, CheckCircle, XCircle, AlertCircle, Eye, Send, Shield, Building2, Stethoscope, Users, UserCheck, Calendar } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5002';

const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json'
  };
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2`}>
      {type === 'success' && <CheckCircle size={20} />}
      {type === 'error' && <XCircle size={20} />}
      {type === 'info' && <AlertCircle size={20} />}
      <span>{message}</span>
    </div>
  );
};

const RoleBadge = ({ role }) => {
  const roleConfig = {
    ADMIN: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Shield },
    HOSPITAL_ADMIN: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Building2 },
    DOCTOR: { color: 'bg-green-100 text-green-700 border-green-200', icon: Stethoscope },
    RECEPTIONIST: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: UserCheck },
    PATIENT: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Users }
  };

  const config = roleConfig[role] || roleConfig.PATIENT;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon size={14} />
      {role?.replace('_', ' ')}
    </span>
  );
};

const StatusBadge = ({ isVerified }) => {
  return isVerified ? (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle size={14} />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
      <AlertCircle size={14} />
      Unverified
    </span>
  );
};

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [inviteType, setInviteType] = useState('HOSPITAL_ADMIN');
  const [inviteForm, setInviteForm] = useState({
    email: '',
    fullName: '',
    phone: '',
    role: 'DOCTOR'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/all_users`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        setUsers(data.data);
      }
    } catch (error) {
      showToast('Failed to fetch users', 'error');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    try {
      let endpoint = '';
      let payload = {};

      if (inviteType === 'HOSPITAL_ADMIN') {
        endpoint = `${API_BASE_URL}/users/invite-hospital-admin`;
        payload = {
          email: inviteForm.email,
          fullName: inviteForm.fullName,
          phone: inviteForm.phone
        };
      } else if (inviteType === 'STAFF') {
        endpoint = `${API_BASE_URL}/users/invite-staff`;
        payload = {
          email: inviteForm.email,
          fullName: inviteForm.fullName,
          phone: inviteForm.phone,
          role: inviteForm.role
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }

      showToast('Invitation sent successfully!', 'success');
      setShowInviteModal(false);
      resetInviteForm();
      fetchUsers();
    } catch (error) {
      showToast(error.message || 'Failed to send invitation', 'error');
    }
  };

  const handleResendInvite = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/resend-invite`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email, fullName: selectedUser?.fullName || 'User' })
      });

      if (!response.ok) throw new Error('Failed to resend invitation');
      
      showToast('Invitation resent successfully!', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to resend invitation', 'error');
    }
  };

  const resetInviteForm = () => {
    setInviteForm({
      email: '',
      fullName: '',
      phone: '',
      role: 'DOCTOR'
    });
    setInviteType('HOSPITAL_ADMIN');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesVerification = verificationFilter === 'ALL' || 
      (verificationFilter === 'VERIFIED' && user.isEmailVerified) ||
      (verificationFilter === 'UNVERIFIED' && !user.isEmailVerified);
    
    return matchesSearch && matchesRole && matchesVerification;
  });

  const stats = {
    total: users.length,
    verified: users.filter(u => u.isEmailVerified).length,
    unverified: users.filter(u => !u.isEmailVerified).length,
    admins: users.filter(u => u.role === 'ADMIN' || u.role === 'HOSPITAL_ADMIN').length,
    doctors: users.filter(u => u.role === 'DOCTOR').length,
    patients: users.filter(u => u.role === 'PATIENT').length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Users Management</h1>
          <p className="text-gray-600 mt-1">Manage and monitor all registered users</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Invite User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <Users className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Doctors</p>
              <p className="text-2xl font-bold text-green-600">{stats.doctors}</p>
            </div>
            <Stethoscope className="text-green-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Patients</p>
              <p className="text-2xl font-bold text-gray-600">{stats.patients}</p>
            </div>
            <Users className="text-gray-600" size={32} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="HOSPITAL_ADMIN">Hospital Admin</option>
            <option value="DOCTOR">Doctor</option>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="PATIENT">Patient</option>
          </select>

          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="VERIFIED">Verified</option>
            <option value="UNVERIFIED">Unverified</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <Users className="mx-auto text-gray-400 mb-3" size={48} />
                      <p className="text-gray-600">No users found</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserCircle className="text-blue-600" size={24} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.fullName}</p>
                            <p className="text-xs text-gray-500 font-mono">{user.id.substring(0, 13)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail size={14} />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge isVerified={user.isEmailVerified} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowViewModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {!user.isEmailVerified && (
                            <button
                              onClick={() => handleResendInvite(user.email)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Resend Invitation"
                            >
                              <Send size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{filteredUsers.length}</span> of <span className="font-medium">{users.length}</span> users
              </p>
            </div>
          )}
        </div>
      )}

      {showInviteModal && (
        <div 
          className="fixed inset-0 bg-transparent bg-opacity-10 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => { setShowInviteModal(false); resetInviteForm(); }}
        >
          <div 
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Invite New User</h2>
              <p className="text-gray-600 mt-1">Send an invitation email to onboard a new user</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setInviteType('HOSPITAL_ADMIN')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    inviteType === 'HOSPITAL_ADMIN'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  Hospital Admin
                </button>
                <button
                  type="button"
                  onClick={() => setInviteType('STAFF')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    inviteType === 'STAFF'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  Staff Member
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteForm.fullName}
                    onChange={(e) => setInviteForm({...inviteForm, fullName: e.target.value})}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm({...inviteForm, phone: e.target.value})}
                    placeholder="0781234567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {inviteType === 'STAFF' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="DOCTOR">Doctor</option>
                      <option value="RECEPTIONIST">Receptionist</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The invited user will receive an email with instructions to complete their profile setup.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowInviteModal(false); resetInviteForm(); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-transparent bg-opacity-10 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">User Details</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserCircle className="text-blue-600" size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{selectedUser.fullName}</h3>
                  <div className="flex gap-2 mt-1">
                    <RoleBadge role={selectedUser.role} />
                    <StatusBadge isVerified={selectedUser.isEmailVerified} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-800 flex items-center gap-2 mt-1">
                    <Mail size={16} />
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-800 flex items-center gap-2 mt-1">
                    <Calendar size={16} />
                    {formatDate(selectedUser.createdAt)}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">User ID</label>
                  <p className="text-gray-800 font-mono text-sm mt-1 bg-gray-50 p-2 rounded">{selectedUser.id}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-6 border-t">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {!selectedUser.isEmailVerified && (
                  <button
                    onClick={() => {
                      handleResendInvite(selectedUser.email);
                      setShowViewModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Resend Invitation
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;