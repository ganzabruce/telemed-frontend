import React, { useState, useEffect } from 'react';
import { X, Pill, FileText, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { recordConsultation } from '../../api/consultationsApi';

interface PrescriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  appointmentType: 'VIDEO' | 'AUDIO' | 'CHAT';
  patientName: string;
  onSuccess?: () => void;
}

const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  isOpen,
  onClose,
  appointmentId,
  appointmentType,
  patientName,
  onSuccess,
}) => {
  const [doctorNotes, setDoctorNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDoctorNotes('');
      setPrescription('');
      setIsSubmitting(false);
    }
  }, [isOpen, appointmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedNotes = doctorNotes.trim();
    if (!trimmedNotes || trimmedNotes.length < 10) {
      toast.error('Doctor notes must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await recordConsultation({
        appointmentId,
        doctorNotes: trimmedNotes,
        prescription: prescription.trim() || undefined,
        consultationType: appointmentType,
      });

      toast.success('Consultation and prescription saved successfully!');
      setDoctorNotes('');
      setPrescription('');
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save consultation';
      toast.error(errorMessage);
      console.error('Error saving consultation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-50 p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Record Consultation</h2>
            <p className="text-sm text-gray-600 mt-1">Patient: {patientName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Doctor's Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Enter consultation notes, diagnosis, observations, and recommendations..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={6}
              required
              minLength={10}
            />
            <p className={`text-xs mt-1 ${
              doctorNotes.trim().length >= 10 
                ? 'text-green-600' 
                : doctorNotes.trim().length > 0 
                  ? 'text-orange-600' 
                  : 'text-gray-500'
            }`}>
              Minimum 10 characters required. {doctorNotes.trim().length}/10
              {doctorNotes.trim().length > 0 && doctorNotes.trim().length < 10 && (
                <span className="ml-1">({10 - doctorNotes.trim().length} more needed)</span>
              )}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Pill className="w-4 h-4 inline mr-2" />
              Prescription (Optional)
            </label>
            <textarea
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              placeholder="Enter prescribed medications, dosage, frequency, and instructions..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              Include medication names, dosages, frequency, and special instructions.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200 space-y-3">
            {/* Helper message when button is disabled */}
            {(!doctorNotes.trim() || doctorNotes.trim().length < 10) && !isSubmitting && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Please enter at least 10 characters in the doctor's notes field to enable the save button.
                  {doctorNotes.trim().length > 0 && doctorNotes.trim().length < 10 && (
                    <span className="block mt-1">You need {10 - doctorNotes.trim().length} more character{10 - doctorNotes.trim().length !== 1 ? 's' : ''}.</span>
                  )}
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !doctorNotes.trim() || doctorNotes.trim().length < 10}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
                title={
                  !doctorNotes.trim() 
                    ? 'Please enter doctor notes (minimum 10 characters)' 
                    : doctorNotes.trim().length < 10 
                      ? `Please enter at least ${10 - doctorNotes.trim().length} more characters`
                      : 'Save consultation'
                }
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Consultation
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrescriptionForm;

