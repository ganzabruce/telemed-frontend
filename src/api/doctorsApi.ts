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

export interface Doctor {
  id: string;
  userId: string;
  specialization: string;
  licenseNumber: string;
  availability?: string;
  consultationFee: number;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatarUrl?: string | null;
  };
  hospital?: {
    id: string;
    name: string;
  };
}

/**
 * Fetch a list of all doctors
 * Can be filtered by hospitalId or specialization
 */
export const getDoctors = async (
  hospitalId?: string,
  specialization?: string
): Promise<Doctor[]> => {
  const params: any = {};
  if (hospitalId) {
    params.hospitalId = hospitalId;
  }
  if (specialization) {
    params.specialization = specialization;
  }

  const response = await api.get("/doctors", { params });
  return response.data.data;
};

/**
 * Get a single doctor by ID
 */
export const getDoctorById = async (id: string): Promise<Doctor> => {
  const response = await api.get(`/doctors/${id}`);
  return response.data.data;
};

