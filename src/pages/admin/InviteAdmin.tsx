// import PagePlaceholder from "../../components/common/PagePlaceholder"
// export default function InviteAdmin() {
//   return <PagePlaceholder title="Invite Hospital Admin" description="Invite and onboard hospital administrators." />
// }


import  { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Building2, Users, Mail, Phone, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5003';

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

const AdminDashboard = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h1 className="text-3xl font-bold text-blue-600 mb-2">Admin Dashboard</h1>
      <p className="text-gray-500 text-lg">This page is under development.</p>
    </div>
  );
};

// const HospitalsManagement = () => {
//   const [hospitals, setHospitals] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [showModal, setShowModal] = useState(false);
//   const [editingHospital, setEditingHospital] = useState(null);
//   const [toast, setToast] = useState(null);
//   const [formData, setFormData] = useState({
//     name: '',
//     licenseNumber: '',
//     address: '',
//     contactEmail: '',
//     contactPhone: '',
//     adminId: ''
//   });

//   useEffect(() => {
//     fetchHospitals();
//   }, []);

//   const fetchHospitals = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`${API_BASE_URL}/hospitals`, {
//         headers: getAuthHeaders()
//       });
//       const data = await response.json();
//       setHospitals(data);
//     } catch (error) {
//       showToast('Failed to fetch hospitals', 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const showToast = (message, type) => {
//     setToast({ message, type });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const url = editingHospital 
//         ? `${API_BASE_URL}/hospitals/${editingHospital.id}`
//         : `${API_BASE_URL}/hospitals`;
      
//       const response = await fetch(url, {
//         method: editingHospital ? 'PATCH' : 'POST',
//         headers: getAuthHeaders(),
//         body: JSON.stringify(formData)
//       });

//       if (!response.ok) throw new Error('Operation failed');
      
//       showToast(editingHospital ? 'Hospital updated successfully' : 'Hospital created successfully', 'success');
//       setShowModal(false);
//       resetForm();
//       fetchHospitals();
//     } catch (error) {
//       showToast(error.message || 'Operation failed', 'error');
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!confirm('Are you sure you want to delete this hospital?')) return;
    
//     try {
//       const response = await fetch(`${API_BASE_URL}/hospitals/${id}`, {
//         method: 'DELETE',
//         headers: getAuthHeaders()
//       });
      
//       if (!response.ok) throw new Error('Failed to delete');
      
//       showToast('Hospital deleted successfully', 'success');
//       fetchHospitals();
//     } catch (error) {
//       showToast('Failed to delete hospital', 'error');
//     }
//   };

//   const resetForm = () => {
//     setFormData({
//       name: '',
//       licenseNumber: '',
//       address: '',
//       contactEmail: '',
//       contactPhone: '',
//       adminId: ''
//     });
//     setEditingHospital(null);
//   };

//   const openEditModal = (hospital) => {
//     setEditingHospital(hospital);
//     setFormData({
//       name: hospital.name,
//       licenseNumber: hospital.licenseNumber || '',
//       address: hospital.address || '',
//       contactEmail: hospital.contactEmail || '',
//       contactPhone: hospital.contactPhone || '',
//       adminId: hospital.adminId || ''
//     });
//     setShowModal(true);
//   };

//   const filteredHospitals = hospitals.filter(h =>
//     h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     h.address?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="p-6">
//       {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-800">Hospitals Management</h1>
//           <p className="text-gray-600 mt-1">Manage all hospitals in the system</p>
//         </div>
//         <button
//           onClick={() => { resetForm(); setShowModal(true); }}
//           className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
//         >
//           <Plus size={20} />
//           Add Hospital
//         </button>
//       </div>

//       <div className="mb-6">
//         <div className="relative">
//           <Search className="absolute left-3 top-3 text-gray-400" size={20} />
//           <input
//             type="text"
//             placeholder="Search hospitals..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           />
//         </div>
//       </div>

//       {loading ? (
//         <div className="text-center py-12">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading hospitals...</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredHospitals.map((hospital) => (
//             <div key={hospital.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
//               <div className="flex items-start justify-between mb-4">
//                 <div className="flex items-center gap-3">
//                   <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
//                     <Building2 className="text-blue-600" size={24} />
//                   </div>
//                   <div>
//                     <h3 className="font-semibold text-lg text-gray-800">{hospital.name}</h3>
//                     <span className="text-xs text-gray-500">{hospital.licenseNumber}</span>
//                   </div>
//                 </div>
//               </div>
              
//               <div className="space-y-2 mb-4">
//                 {hospital.address && (
//                   <div className="flex items-center gap-2 text-sm text-gray-600">
//                     <MapPin size={16} />
//                     <span>{hospital.address}</span>
//                   </div>
//                 )}
//                 {hospital.contactEmail && (
//                   <div className="flex items-center gap-2 text-sm text-gray-600">
//                     <Mail size={16} />
//                     <span>{hospital.contactEmail}</span>
//                   </div>
//                 )}
//                 {hospital.contactPhone && (
//                   <div className="flex items-center gap-2 text-sm text-gray-600">
//                     <Phone size={16} />
//                     <span>{hospital.contactPhone}</span>
//                   </div>
//                 )}
//               </div>

//               <div className="flex gap-2 pt-4 border-t">
//                 <button
//                   onClick={() => openEditModal(hospital)}
//                   className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2"
//                 >
//                   <Edit size={16} />
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => handleDelete(hospital.id)}
//                   className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2"
//                 >
//                   <Trash2 size={16} />
//                   Delete
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//             <div className="p-6 border-b">
//               <h2 className="text-2xl font-bold text-gray-800">
//                 {editingHospital ? 'Edit Hospital' : 'Add New Hospital'}
//               </h2>
//             </div>
            
//             <div className="p-6 space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Hospital Name *
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.name}
//                     onChange={(e) => setFormData({...formData, name: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     License Number *
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.licenseNumber}
//                     onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Address *
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.address}
//                     onChange={(e) => setFormData({...formData, address: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Contact Email *
//                   </label>
//                   <input
//                     type="email"
//                     value={formData.contactEmail}
//                     onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Contact Phone *
//                   </label>
//                   <input
//                     type="tel"
//                     value={formData.contactPhone}
//                     onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Admin ID *
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.adminId}
//                     onChange={(e) => setFormData({...formData, adminId: e.target.value})}
//                     placeholder="UUID of Hospital Admin user"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                   <p className="text-xs text-gray-500 mt-1">Enter the UUID of an existing user with HOSPITAL_ADMIN role</p>
//                 </div>
//               </div>

//               <div className="flex gap-3 pt-4">
//                 <button
//                   onClick={() => { setShowModal(false); resetForm(); }}
//                   className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSubmit}
//                   className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//                 >
//                   {editingHospital ? 'Update Hospital' : 'Create Hospital'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// const UsersManagement = () => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [toast, setToast] = useState(null);

//   return (
//     <div className="p-6">
//       {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-800">Users Management</h1>
//           <p className="text-gray-600 mt-1">Manage and monitor all registered users</p>
//         </div>
//       </div>

//       <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
//         <div className="flex items-center gap-2">
//           <AlertCircle className="text-yellow-600" size={20} />
//           <p className="text-yellow-800">
//             User management features are available through individual role-specific endpoints. 
//             Use the "Invite Admin" page to add new hospital administrators.
//           </p>
//         </div>
//       </div>

//       <div className="mb-6">
//         <div className="relative">
//           <Search className="absolute left-3 top-3 text-gray-400" size={20} />
//           <input
//             type="text"
//             placeholder="Search users..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           />
//         </div>
//       </div>

//       <div className="bg-white rounded-lg shadow-md p-8 text-center">
//         <Users className="mx-auto text-gray-400 mb-4" size={48} />
//         <h3 className="text-xl font-semibold text-gray-800 mb-2">User List Coming Soon</h3>
//         <p className="text-gray-600">
//           This section will display all system users with filtering and management capabilities.
//         </p>
//       </div>
//     </div>
//   );
// };

export const InviteAdmin = () => {
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: ''
  });

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/invite-hospital-admin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }

      showToast('Invitation sent successfully!', 'success');
      setFormData({ email: '', fullName: '', phone: '' });
    } catch (error) {
      showToast(error.message || 'Failed to send invitation', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Invite Hospital Admin</h1>
        <p className="text-gray-600 mt-1">Invite and onboard hospital administrators</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Send Invitation</h2>
                <p className="text-sm text-gray-600">The invited user will receive an email with setup instructions</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="admin@hospital.rw"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
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
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="0781234567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The invited admin will be able to:
              </p>
              <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
                <li>Manage their hospital's staff (doctors, receptionists)</li>
                <li>View and manage patients</li>
                <li>Access hospital-specific reports</li>
              </ul>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={20} />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// export default function AdminApp() {
//   const [currentPage, setCurrentPage] = useState('dashboard');

//   const renderPage = () => {
//     switch(currentPage) {
//       case 'dashboard':
//         return <AdminDashboard />;
//       case 'hospitals':
//         return <HospitalsManagement />;
//       case 'users':
//         return <UsersManagement />;
//       case 'invite-admin':
//         return <InviteAdmin />;
//       default:
//         return <AdminDashboard />;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <nav className="bg-white shadow-sm border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between h-16">
//             <div className="flex space-x-8">
//               <button
//                 onClick={() => setCurrentPage('dashboard')}
//                 className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
//                   currentPage === 'dashboard'
//                     ? 'border-blue-500 text-gray-900'
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                 }`}
//               >
//                 Dashboard
//               </button>
//               <button
//                 onClick={() => setCurrentPage('hospitals')}
//                 className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
//                   currentPage === 'hospitals'
//                     ? 'border-blue-500 text-gray-900'
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                 }`}
//               >
//                 Hospitals
//               </button>
//               <button
//                 onClick={() => setCurrentPage('users')}
//                 className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
//                   currentPage === 'users'
//                     ? 'border-blue-500 text-gray-900'
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                 }`}
//               >
//                 Users
//               </button>
//               <button
//                 onClick={() => setCurrentPage('invite-admin')}
//                 className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
//                   currentPage === 'invite-admin'
//                     ? 'border-blue-500 text-gray-900'
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                 }`}
//               >
//                 Invite Admin
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       <main className="max-w-7xl mx-auto py-6">
//         {renderPage()}
//       </main>
//     </div>
//   );
// }