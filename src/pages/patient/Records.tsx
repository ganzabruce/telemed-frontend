import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Pill, Download, Eye, AlertCircle, Search } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5002';

const RecordsPage = () => {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = user.token;

      if (!token) {
        setError('Please log in to view medical records');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/appointments?status=COMPLETED`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch records');

      const data = await response.json();
      const appointmentsWithConsultations = (data.data || []).filter(
        (apt: any) => apt.consultation
      );
      
      setConsultations(appointmentsWithConsultations);
      setError(null);
    } catch (err) {
      setError('Failed to load medical records. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredRecords = consultations.filter(record => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      record.doctor?.user?.fullName?.toLowerCase().includes(search) ||
      record.doctor?.specialization?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading medical records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
        <p className="text-gray-600 mt-1">View your consultation history and prescriptions</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by doctor or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRecords.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No medical records found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search' : 'Your consultation records will appear here after appointments'}
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all hover:shadow-md p-6 cursor-pointer"
              onClick={() => setSelectedRecord(record)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {record.doctor?.user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'DR'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Dr. {record.doctor?.user?.fullName || 'Unknown Doctor'}
                    </h3>
                    <p className="text-sm text-gray-600">{record.doctor?.specialization || 'General Practice'}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{formatDate(record.appointmentDate)}</span>
              </div>

              <div className="space-y-3">
                {record.consultation?.doctorNotes && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Notes</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {record.consultation.doctorNotes}
                    </p>
                  </div>
                )}

                {record.consultation?.prescription && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Prescription</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {record.consultation.prescription}
                    </p>
                  </div>
                )}
              </div>

              <button className="mt-4 w-full py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                View Full Record
              </button>
            </div>
          ))
        )}
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRecord(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Medical Record</h2>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                  {selectedRecord.doctor?.user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'DR'}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Dr. {selectedRecord.doctor?.user?.fullName || 'Unknown Doctor'}
                  </h3>
                  <p className="text-gray-600">{selectedRecord.doctor?.specialization || 'General Practice'}</p>
                  <p className="text-sm text-gray-500 mt-1">{selectedRecord.hospital?.name || 'Hospital'}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Appointment Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formatDate(selectedRecord.appointmentDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{selectedRecord.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-green-600">{selectedRecord.status}</span>
                  </div>
                </div>
              </div>

              {selectedRecord.consultation?.doctorNotes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Doctor's Notes
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.consultation.doctorNotes}</p>
                  </div>
                </div>
              )}

              {selectedRecord.consultation?.prescription && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Pill className="w-5 h-5" />
                    Prescription
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.consultation.prescription}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordsPage;