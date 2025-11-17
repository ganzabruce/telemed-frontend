import axios from "axios";

const api = axios.create({
  baseURL: "https://telemedicine-be.onrender.com",
});

const getAuthToken = () => {
  const stored = localStorage.getItem("user");
  if (stored) {
    const user = JSON.parse(stored);
    return user?.token;
  }
  return null;
};

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

export interface AvailabilitySlot {
  id: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SetAvailabilityRequest {
  slots: Omit<AvailabilitySlot, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>[];
}

/**
 * Get current doctor's availability
 */
export const getMyAvailability = async (): Promise<AvailabilitySlot[]> => {
  const response = await api.get("/availability/me");
  return response.data.data;
};

/**
 * Set current doctor's availability (replaces all existing slots)
 */
export const setAvailability = async (slots: SetAvailabilityRequest['slots']): Promise<AvailabilitySlot[]> => {
  const response = await api.post("/availability/me", { slots });
  return response.data.data;
};

/**
 * Add a single availability slot
 */
export const addAvailabilitySlot = async (slot: Omit<AvailabilitySlot, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>): Promise<AvailabilitySlot> => {
  const response = await api.post("/availability/me/slots", slot);
  return response.data.data;
};

/**
 * Delete an availability slot
 */
export const deleteAvailabilitySlot = async (slotId: string): Promise<void> => {
  await api.delete(`/availability/slots/${slotId}`);
};

/**
 * Check if a doctor is available at a specific date/time
 */
export const checkAvailability = async (doctorId: string, appointmentDate: string): Promise<{ available: boolean }> => {
  const response = await api.get("/availability/check", {
    params: { doctorId, appointmentDate },
  });
  return response.data.data;
};

/**
 * Get a doctor's availability
 */
export const getDoctorAvailability = async (doctorId: string): Promise<AvailabilitySlot[]> => {
  const response = await api.get(`/availability/doctor/${doctorId}`);
  return response.data.data;
};

