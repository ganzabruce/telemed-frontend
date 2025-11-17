import axios from "axios";

// Create an Axios instance
const api = axios.create({
  baseURL: "https://telemedicine-be.onrender.com",
});

// Function to get the auth token
const getAuthToken = () => {
  const stored = localStorage.getItem("user");
  if (stored) {
    const user = JSON.parse(stored);
    return user?.token;
  }
  return null;
};

// Add an interceptor to include the auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

