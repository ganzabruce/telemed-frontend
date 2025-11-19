import axios from "axios";

// Get API URL from environment variable, fallback to local backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003";

// Create an Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
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

export default api;

