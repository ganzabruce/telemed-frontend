import { api } from "./client";

export interface Consultation {
  id: string;
  appointmentId: string;
  doctorNotes: string | null;
  prescription: string | null;
  consultationType: "VIDEO" | "AUDIO" | "CHAT";
  createdAt: string;
  appointment?: {
    id: string;
    patient?: {
      id: string;
      user?: {
        id: string;
        fullName: string;
      };
    };
    doctor?: {
      id: string;
      user?: {
        id: string;
        fullName: string;
      };
    };
  };
}

export interface RecordConsultationData {
  appointmentId: string;
  doctorNotes: string;
  prescription?: string;
  consultationType: "VIDEO" | "AUDIO" | "CHAT";
}

/**
 * Record a consultation (Doctor only)
 */
export const recordConsultation = async (
  data: RecordConsultationData
): Promise<Consultation> => {
  const response = await api.post("/consultations", data);
  return response.data.data;
};

/**
 * Get consultation details by ID
 */
export const getConsultationById = async (id: string): Promise<Consultation> => {
  const response = await api.get(`/consultations/${id}`);
  return response.data.data;
};

