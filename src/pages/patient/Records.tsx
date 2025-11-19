import { useState, useEffect } from 'react';
import { FileText, Calendar, Pill, Download, Eye, AlertCircle, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/apiConfig';

const RecordsPage = () => {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

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

      const response = await fetch(`${API_BASE_URL}/appointments?status=COMPLETED&orderBy=appointmentDate&order=desc`, {
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadImageAsBase64 = (imagePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imagePath;
    });
  };

  const downloadPDF = async (record: any) => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-download' });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Load and add logo with title
      try {
        const logoBase64 = await loadImageAsBase64('/telemed.png');
        const logoSize = 15; // Size in mm
        pdf.addImage(logoBase64, 'PNG', margin, yPosition, logoSize, logoSize);
        
        // Add "Telemedicine" title next to logo in blue
        pdf.setTextColor(37, 99, 235); // Blue color (RGB)
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Telemedicine', margin + logoSize + 5, yPosition + (logoSize / 2) + 2);
        pdf.setTextColor(0, 0, 0); // Reset to black
        
        yPosition += logoSize + 5; // Add space after logo
      } catch (logoError) {
        console.warn('Could not load logo:', logoError);
        // Continue without logo if it fails to load
      }

      // Helper function to add a new page if needed
      const checkPageBreak = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          
          // Add logo to new page as well
          try {
            loadImageAsBase64('/telemed.png').then(logoBase64 => {
              const logoSize = 15;
              pdf.addImage(logoBase64, 'PNG', margin, margin, logoSize, logoSize);
            });
          } catch (err) {
            // Silently fail
          }
          
          return true;
        }
        return false;
      };

      // Title
   

      // Line separator
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Medical Record:', margin, yPosition);
      yPosition += 8;

      // Doctor Information
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Doctor Information', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Name: Dr. ${record.doctor?.user?.fullName || 'Unknown Doctor'}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Specialization: ${record.doctor?.specialization || 'General Practice'}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Hospital: ${record.hospital?.name || 'Unknown Hospital'}`, margin, yPosition);
      yPosition += 10;

      // Appointment Details
      checkPageBreak(25);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Appointment Details', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Date: ${formatDateTime(record.appointmentDate)}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Type: ${record.type}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Status: ${record.status}`, margin, yPosition);
      yPosition += 10;

      // Doctor's Notes
      if (record.consultation?.doctorNotes) {
        checkPageBreak(30);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Doctor\'s Notes', margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const notesLines = pdf.splitTextToSize(record.consultation.doctorNotes, pageWidth - 2 * margin);
        notesLines.forEach((line: string) => {
          checkPageBreak(6);
          pdf.text(line, margin, yPosition);
          yPosition += 6;
        });
        yPosition += 5;
      }

      // Prescription
      if (record.consultation?.prescription) {
        checkPageBreak(30);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Prescription', margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const prescriptionLines = pdf.splitTextToSize(record.consultation.prescription, pageWidth - 2 * margin);
        prescriptionLines.forEach((line: string) => {
          checkPageBreak(6);
          pdf.text(line, margin, yPosition);
          yPosition += 6;
        });
        yPosition += 5;
      }

      // Footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.text(
          `Generated on ${new Date().toLocaleDateString()} - using TeleMedecine - Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Generate filename
      const doctorName = record.doctor?.user?.fullName?.replace(/\s+/g, '_') || 'Unknown';
      const dateStr = new Date(record.appointmentDate).toISOString().split('T')[0];
      const filename = `Medical_Record_${doctorName}_${dateStr}.pdf`;

      // Save PDF
      pdf.save(filename);
      
      toast.success('PDF downloaded successfully!', { id: 'pdf-download' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.', { id: 'pdf-download' });
    }
  };

  const filteredRecords = consultations.filter(record => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      record.doctor?.user?.fullName?.toLowerCase().includes(search) ||
      record.doctor?.specialization?.toLowerCase().includes(search)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading medical records...</p>
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
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No medical records found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search' : 'Your consultation records will appear here after appointments'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prescription</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                            {record.doctor?.user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'DR'}
                          </div>
                          <span className="text-sm font-medium text-gray-900">Dr. {record.doctor?.user?.fullName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{record.doctor?.specialization || 'General Practice'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{record.hospital?.name || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(record.appointmentDate)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{record.type || '-'}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                        <div className="truncate" title={record.consultation?.doctorNotes || 'No notes'}>
                          {record.consultation?.doctorNotes ? (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3 text-gray-400" />
                              {record.consultation.doctorNotes.length > 50 
                                ? record.consultation.doctorNotes.substring(0, 50) + '...' 
                                : record.consultation.doctorNotes}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                        <div className="truncate" title={record.consultation?.prescription || 'No prescription'}>
                          {record.consultation?.prescription ? (
                            <span className="flex items-center gap-1">
                              <Pill className="w-3 h-3 text-blue-400" />
                              {record.consultation.prescription.length > 50 
                                ? record.consultation.prescription.substring(0, 50) + '...' 
                                : record.consultation.prescription}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors text-xs font-medium flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                          <button
                            onClick={() => downloadPDF(record)}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors text-xs font-medium flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredRecords.length)}</span> of{' '}
                <span className="font-medium">{filteredRecords.length}</span> records
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm font-medium rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}  

      {selectedRecord && (
        <div className="fixed inset-0 bg-transparent shadow-lg shadow-black/20  rounded-lg border-gray-200 backdrop-blur-sm bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRecord(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl shadow-black/20" onClick={(e) => e.stopPropagation()}>
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
                <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
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
                <button 
                  onClick={() => downloadPDF(selectedRecord)}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
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