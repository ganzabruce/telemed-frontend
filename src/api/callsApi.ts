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

export interface CallRoomInfo {
  id: string;
  occupants: number;
  createdAt: string;
}

/**
 * Create a call room for a confirmed appointment
 */
export const createCallRoom = async (
  appointmentId: string
): Promise<{ roomId: string }> => {
  const response = await api.post("/calls/create", { appointmentId });
  // Backend returns { success: true, roomId }
  return { roomId: response.data.roomId };
};

/**
 * Get information about an existing call room
 */
export const getCallRoomInfo = async (
  roomId: string
): Promise<CallRoomInfo> => {
  const response = await api.get(`/calls/${roomId}`);
  return response.data.data;
};

