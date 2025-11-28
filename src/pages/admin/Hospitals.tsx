import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Building2, Mail, Phone, MapPin, AlertCircle, Download, Eye } from 'lucide-react'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { API_BASE_URL } from '../../utils/apiConfig'

// Add custom styles for animations


interface Hospital {
  id: string
  name: string
  licenseNumber: string
  address: string
  contactEmail: string
  contactPhone: string
  adminId: string
}


const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json'
  }
}


export const Hospitals: React.FC = () => {

  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null)
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
      setHospitals(data.data || [])
    } catch (error) {
      toast.error('Failed to fetch hospitals')
      console.error('Error fetching hospitals:', error)
    } finally {
      setLoading(false)
    }
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
      
      toast.success(editingHospital ? 'Hospital updated successfully' : 'Hospital created successfully')
      setShowModal(false)
      resetForm()
      fetchHospitals()
    } catch (error) {
      toast.error('Operation failed')
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
      
      toast.success('Hospital deleted successfully')
      fetchHospitals()
    } catch (error) {
      toast.error('Failed to delete hospital')
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
    h.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleExportExcel = () => {
    if (filteredHospitals.length === 0) {
      toast.error('No data to export')
      return
    }

    // Prepare data for Excel
    const excelData = filteredHospitals.map(hospital => ({
      'Name': hospital.name || '',
      'License Number': hospital.licenseNumber || '',
      'Address': hospital.address || '',
      'Contact Email': hospital.contactEmail || '',
      'Contact Phone': hospital.contactPhone || '',
      'Admin ID': hospital.adminId || ''
    }))

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hospitals')

    // Set column widths
    const columnWidths = [
      { wch: 25 }, // Name
      { wch: 18 }, // License Number
      { wch: 35 }, // Address
      { wch: 30 }, // Contact Email
      { wch: 15 }, // Contact Phone
      { wch: 38 }  // Admin ID
    ]
    worksheet['!cols'] = columnWidths

    // Generate Excel file and download
    const fileName = `hospitals-export-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
    
    toast.success(`Exported ${filteredHospitals.length} hospitals to Excel`)
  }

  const handleViewDetails = (hospital: Hospital) => {
    setSelectedHospital(hospital)
    setShowViewModal(true)
  }

  const stats = {
    total: hospitals.length
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Hospitals Management</h1>
          <p className="text-gray-600 mt-1">Manage all hospitals in the system</p>
        </div>
        <div className="flex flex-wrap  gap-3 ">
          <button
            onClick={handleExportExcel}
            className="bg-white  text-gray-700 px-2 py-1 md:px-4 lg:px-4 md:py-2 lg:py-2 rounded-lg flex items-center gap-2 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Download size={20} />
            Export
          </button>
          <button
            onClick={() => { resetForm(); setShowModal(true) }}
            className="bg-blue-600 text-white px-1 py-1 md:px-4 lg:px-4 md:py-2 lg:py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Hospital
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Total Hospitals</h3>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, address, license number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hospitals...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredHospitals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Building2 className="mx-auto text-gray-400 mb-3" size={48} />
                        <p className="text-gray-600">No hospitals found</p>
                        <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
                      </td>
                    </tr>
                  ) : (
                    filteredHospitals.map((hospital) => (
                      <tr key={hospital.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Building2 className="text-blue-600" size={24} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{hospital.name}</p>
                              <p className="text-xs text-gray-500 font-mono">{hospital.id.substring(0, 13)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail size={14} />
                              {hospital.contactEmail || 'N/A'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone size={14} />
                              {hospital.contactPhone || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin size={14} />
                            <span className="max-w-xs truncate">{hospital.address || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700 font-mono">{hospital.licenseNumber || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 ">
                            <button
                              onClick={() => handleViewDetails(hospital)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => openEditModal(hospital)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(hospital.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {filteredHospitals.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium">{filteredHospitals.length}</span> of <span className="font-medium">{hospitals.length}</span> hospitals
                </p>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredHospitals.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Building2 className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-gray-600">No hospitals found</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
              </div>
            ) : (
              filteredHospitals.map((hospital) => (
                <div key={hospital.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <Building2 className="text-blue-600" size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{hospital.name}</p>
                        <p className="text-xs text-gray-500 font-mono truncate">{hospital.id.substring(0, 13)}...</p>
                      </div>
                    </div>
                    <div className="flex -gap-2 shrink-0">
                      <button
                        onClick={() => handleViewDetails(hospital)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => openEditModal(hospital)}
                        className=" text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(hospital.id)}
                        className=" text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 border-t pt-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} className="shrink-0" />
                      <span className="truncate">{hospital.contactEmail || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="shrink-0" />
                      <span className="truncate">{hospital.contactPhone || 'N/A'}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin size={14} className="shrink-0 mt-0.5" />
                      <span className="break-words">{hospital.address || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">License:</span>
                      <span className="font-mono">{hospital.licenseNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {filteredHospitals.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium">{filteredHospitals.length}</span> of <span className="font-medium">{hospitals.length}</span> hospitals
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedHospital && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowViewModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Hospital Details</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="text-blue-600" size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{selectedHospital.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">License: {selectedHospital.licenseNumber || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Email</label>
                  <p className="text-gray-800 flex items-center gap-2 mt-1">
                    <Mail size={16} />
                    {selectedHospital.contactEmail || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                  <p className="text-gray-800 flex items-center gap-2 mt-1">
                    <Phone size={16} />
                    {selectedHospital.contactPhone || 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-800 flex items-center gap-2 mt-1">
                    <MapPin size={16} />
                    {selectedHospital.address || 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Hospital ID</label>
                  <p className="text-gray-800 font-mono text-sm mt-1 bg-gray-50 p-2 rounded">{selectedHospital.id}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Admin ID</label>
                  <p className="text-gray-800 font-mono text-sm mt-1 bg-gray-50 p-2 rounded">{selectedHospital.adminId || 'N/A'}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-6 border-t">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    openEditModal(selectedHospital)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit size={18} />
                  Edit Hospital
                </button>
              </div>
            </div>
          </div>
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
              <div className="p-6 border-b bg-linear-to-r from-blue-50 to-indigo-50">
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
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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