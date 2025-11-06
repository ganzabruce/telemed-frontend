// src/pages/admin/Hospitals.tsx
import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Building2, Mail, Phone, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const API_BASE_URL = 'http://localhost:5003'

// Add custom styles for animations
const styles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
`

interface Hospital {
  id: string
  name: string
  licenseNumber: string
  address: string
  contactEmail: string
  contactPhone: string
  adminId: string
}

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
}

const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json'
  }
}

const Toast: React.FC<ToastProps & { onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2`}>
      {type === 'success' && <CheckCircle size={20} />}
      {type === 'error' && <XCircle size={20} />}
      <span>{message}</span>
    </div>
  )
}

export const Hospitals: React.FC = () => {

  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null)
  const [toast, setToast] = useState<ToastProps | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    adminId: ''
  })

  useEffect(() => {
    fetchHospitals()
  }, [])

  const fetchHospitals = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/hospitals`, {
        headers: getAuthHeaders()
      })
      const data = await response.json()
      setHospitals(data.data)
    } catch (error) {
      showToast('Failed to fetch hospitals', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingHospital 
        ? `${API_BASE_URL}/hospitals/${editingHospital.id}`
        : `${API_BASE_URL}/hospitals`
      
      const response = await fetch(url, {
        method: editingHospital ? 'PATCH' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Operation failed')
      
      showToast(editingHospital ? 'Hospital updated successfully' : 'Hospital created successfully', 'success')
      setShowModal(false)
      resetForm()
      fetchHospitals()
    } catch (error) {
      showToast('Operation failed', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this hospital?')) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/hospitals/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) throw new Error('Failed to delete')
      
      showToast('Hospital deleted successfully', 'success')
      fetchHospitals()
    } catch (error) {
      showToast('Failed to delete hospital', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      licenseNumber: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
      adminId: ''
    })
    setEditingHospital(null)
  }

  const openEditModal = (hospital: Hospital) => {
    setEditingHospital(hospital)
    setFormData({
      name: hospital.name,
      licenseNumber: hospital.licenseNumber || '',
      address: hospital.address || '',
      contactEmail: hospital.contactEmail || '',
      contactPhone: hospital.contactPhone || '',
      adminId: hospital.adminId || ''
    })
    setShowModal(true)
  }

  const filteredHospitals = hospitals.filter(h =>
    h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Hospitals Management</h1>
          <p className="text-gray-600 mt-1">Manage all hospitals in the system</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Hospital
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search hospitals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hospitals...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHospitals.map((hospital) => (
            <div key={hospital.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{hospital.name}</h3>
                    <span className="text-xs text-gray-500">{hospital.licenseNumber}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {hospital.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} />
                    <span>{hospital.address}</span>
                  </div>
                )}
                {hospital.contactEmail && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={16} />
                    <span>{hospital.contactEmail}</span>
                  </div>
                )}
                {hospital.contactPhone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} />
                    <span>{hospital.contactPhone}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => openEditModal(hospital)}
                  className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(hospital.id)}
                  className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <>
          {/* Backdrop with animation */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
            onClick={() => { setShowModal(false); resetForm() }}
          />
          
          {/* Modal with slide and scale animation */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <div 
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl pointer-events-auto animate-slideUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient */}
              <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Building2 className="text-white" size={20} />
                  </div>
                  {editingHospital ? 'Edit Hospital' : 'Add New Hospital'}
                </h2>
                <p className="text-sm text-gray-600 mt-1 ml-12">
                  {editingHospital ? 'Update hospital information' : 'Register a new hospital in the system'}
                </p>
              </div>
              
              {/* Form content with scroll */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="transform transition-all hover:scale-[1.01]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Hospital Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter hospital name"
                    />
                  </div>

                  <div className="transform transition-all hover:scale-[1.01]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      License Number *
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g., HSP-2024-001"
                    />
                  </div>

                  <div className="md:col-span-2 transform transition-all hover:scale-[1.01]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter full address"
                    />
                  </div>

                  <div className="transform transition-all hover:scale-[1.01]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="contact@hospital.rw"
                    />
                  </div>

                  <div className="transform transition-all hover:scale-[1.01]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="0781234567"
                    />
                  </div>

                  <div className="md:col-span-2 transform transition-all hover:scale-[1.01]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Admin ID *
                    </label>
                    <input
                      type="text"
                      value={formData.adminId}
                      onChange={(e) => setFormData({...formData, adminId: e.target.value})}
                      placeholder="UUID of Hospital Admin user"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Enter the UUID of an existing user with HOSPITAL_ADMIN role
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer with actions */}
              <div className="p-6 border-t bg-gray-50 flex gap-3">
                <button
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-medium text-gray-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {editingHospital ? 'Update Hospital' : 'Create Hospital'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}