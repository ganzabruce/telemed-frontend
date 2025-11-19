import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Sparkles, X, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
  type Service,
} from '../../api/landingApi';

// Available icon options (matching lucide-react icons used in landing page)
const ICON_OPTIONS = [
  { value: 'Search', label: 'Search' },
  { value: 'ShoppingBag', label: 'Shopping Bag' },
  { value: 'MessageSquare', label: 'Message' },
  { value: 'ClipboardList', label: 'Clipboard' },
  { value: 'Package', label: 'Package' },
  { value: 'Truck', label: 'Truck' },
  { value: 'Heart', label: 'Heart' },
  { value: 'Stethoscope', label: 'Stethoscope' },
  { value: 'Phone', label: 'Phone' },
  { value: 'Video', label: 'Video' },
];

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: '',
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await getAllServices();
      setServices(data);
    } catch (error) {
      toast.error('Failed to fetch services');
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await updateService(editingService.id, formData);
        toast.success('Service updated successfully');
      } else {
        await createService(formData);
        toast.success('Service created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchServices();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      await deleteService(id);
      toast.success('Service deleted successfully');
      fetchServices();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete service');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      icon: '',
      order: 0,
      isActive: true,
    });
    setEditingService(null);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description,
      icon: service.icon || '',
      order: service.order,
      isActive: service.isActive,
    });
    setShowModal(true);
  };

  const filteredServices = services.filter(
    (s) =>
      s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = services.filter((s) => s.isActive).length;
  const inactiveCount = services.filter((s) => !s.isActive).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="text-white" size={24} />
              </div>
              Services Management
            </h1>
            <p className="text-gray-600 mt-1">Manage services displayed on the landing page</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Service
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              </div>
              <Sparkles className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-500">{inactiveCount}</p>
              </div>
              <XCircle className="text-gray-500" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Icon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Sparkles className="mx-auto text-gray-400 mb-3" size={48} />
                        <p className="text-gray-600">No services found</p>
                        <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{service.title}</p>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {service.description}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700 font-mono">
                            {service.icon || 'None'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{service.order}</span>
                        </td>
                        <td className="px-6 py-4">
                          {service.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(service)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(service.id)}
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
          </div>

          <div className="md:hidden space-y-4">
            {filteredServices.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Sparkles className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-gray-600">No services found</p>
              </div>
            ) : (
              filteredServices.map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{service.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">Icon: {service.icon || 'None'}</span>
                    <span className="text-gray-600">Order: {service.order}</span>
                    {service.isActive ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {showModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <div
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="text-white" size={20} />
                    </div>
                    {editingService ? 'Edit Service' : 'Add New Service'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Best Quality HealthCare"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Service description..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Icon</label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">None</option>
                    {ICON_OPTIONS.map((icon) => (
                      <option key={icon.value} value={icon.value}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Order</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.isActive ? 'true' : 'false'}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.value === 'true' })
                      }
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingService ? 'Update Service' : 'Create Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Services;

