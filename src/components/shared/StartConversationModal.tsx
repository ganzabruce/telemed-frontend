import React, { useState, useEffect } from 'react';
import { X, Search, MessageSquare, User, Loader2, AlertCircle } from 'lucide-react';
import { getOrCreateConversation } from '../../api/chatApi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/apiConfig';

interface StartConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'PATIENT' | 'DOCTOR';
  preselectedUserId?: string; // If provided, will auto-select this user
}

interface UserOption {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  specialization?: string; // For doctors
  hospital?: string; // For doctors
}

const StartConversationModal: React.FC<StartConversationModalProps> = ({
  isOpen,
  onClose,
  userRole,
  preselectedUserId,
}) => {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(preselectedUserId || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (preselectedUserId) {
        setSelectedUserId(preselectedUserId);
      } else {
        setSelectedUserId(null);
      }
    } else {
      // Reset state when modal closes
      setSearchQuery('');
      setSelectedUserId(null);
      setError(null);
    }
  }, [isOpen, preselectedUserId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(
        (user) =>
          user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.specialization && user.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);


  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = state.user?.token;
      if (!token) {
        throw new Error('Authentication required');
      }

      let userList: UserOption[] = [];

      if (userRole === 'PATIENT') {
        // Fetch doctors for patients using the doctorsApi
        try {
          const { getDoctors } = await import('../../api/doctorsApi');
          const doctors = await getDoctors();
          
          // Extract doctors from response - ensure we only include doctors with valid user data
          userList = doctors
            .filter((doctor) => doctor.user?.id) // Only include doctors with valid user IDs
            .map((doctor) => ({
              id: doctor.user!.id,
              fullName: doctor.user!.fullName || 'Unknown Doctor',
              email: doctor.user!.email || '',
              avatarUrl: doctor.user!.avatarUrl || null,
              specialization: doctor.specialization,
              hospital: doctor.hospital?.name,
            }));
        } catch (apiError: any) {
          const errorMessage = apiError?.response?.data?.message || apiError?.message || 'Failed to fetch doctors';
          throw new Error(errorMessage);
        }
      } else if (userRole === 'DOCTOR') {
        // Fetch patients for doctors from appointments
        const response = await fetch(`${API_BASE_URL}/appointments?limit=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch appointments');
        }

        const data = await response.json();
        // Extract unique patients from appointments
        const appointments = data.data || [];
        const patientMap = new Map<string, UserOption>();

        appointments.forEach((appt: any) => {
          if (appt.patient?.user?.id) {
            const userId = appt.patient.user.id;
            if (!patientMap.has(userId)) {
              patientMap.set(userId, {
                id: userId,
                fullName: appt.patient.user.fullName || 'Unknown Patient',
                email: appt.patient.user.email || '',
                avatarUrl: appt.patient.user.avatarUrl,
              });
            }
          }
        });

        userList = Array.from(patientMap.values());
      }
      
      setUsers(userList);
      setFilteredUsers(userList);
      
      // If preselectedUserId is provided and exists in the list, select it
      if (preselectedUserId && userList.some(u => u.id === preselectedUserId)) {
        setSelectedUserId(preselectedUserId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartConversation = async () => {
    if (!selectedUserId) {
      setError('Please select a user to start a conversation');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await getOrCreateConversation(selectedUserId);
      
      // Close modal first
      onClose();
      
      // Navigate to consultation page
      const consultationPath = userRole === 'PATIENT' ? '/patient/consultations' : '/doctor/consultations';
      navigate(consultationPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
      setIsCreating(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Start New Conversation</h2>
              <p className="text-sm text-gray-500">
                {userRole === 'PATIENT' ? 'Select a doctor to chat with' : 'Select a patient to chat with'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isCreating}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={`Search ${userRole === 'PATIENT' ? 'doctors' : 'patients'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">
                  {searchQuery ? 'No users found matching your search' : `No ${userRole === 'PATIENT' ? 'doctors' : 'patients'} available`}
                </p>
                {userRole === 'PATIENT' && !searchQuery && (
                  <p className="text-xs text-gray-400">
                    Doctors will appear here once they are registered in the system.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUserId === user.id;
                  return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedUserId(user.id);
                    }}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white font-semibold text-sm">{getInitials(user.fullName)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{user.fullName}</h3>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        {user.specialization && (
                          <p className="text-xs text-blue-600 mt-1">{user.specialization}</p>
                        )}
                        {user.hospital && (
                          <p className="text-xs text-gray-400 mt-1">{user.hospital}</p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            {!error && selectedUserId && (
              <div className="text-sm text-gray-600">
                Selected: {filteredUsers.find(u => u.id === selectedUserId)?.fullName || 'Unknown'}
              </div>
            )}
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={isCreating}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStartConversation}
                disabled={!selectedUserId || isCreating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title={!selectedUserId ? 'Please select a user first' : 'Start conversation'}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Start Conversation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartConversationModal;

