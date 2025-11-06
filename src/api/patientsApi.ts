// new/src/api/patientService.ts

import axios from "axios"
import {
  type ApiAppointment,
  type ApiDoctor,
  type ApiHospital,
  type BookAppointmentData,
  type InitiatePaymentData,
} from "../types/api" // We will create this file next

// Create an Axios instance
const api = axios.create({
  baseURL: "http://localhost/5003", // From your swagger.json
})

// Function to get the auth token
const getAuthToken = () => {
  const stored = localStorage.getItem("user")
  if (stored) {
    const user = JSON.parse(stored)
    return user?.token
  }
  return null
}

// Add an interceptor to include the auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

/**
 * Fetches the current patient's appointments.
 * The backend automatically filters by the patient's ID from the token.
 */
export const getAppointments = async (
  status?: string,
): Promise<ApiAppointment[]> => {
  const params = new URLSearchParams()
  if (status) {
    params.append("status", status)
  }
  // Add an assumption that we fetch consultation data for completed appointments
  params.append("includeConsultation", "true")

  const response = await api.get(`/appointments`, { params })
  return response.data.data
}

/**
 * Fetches a list of all doctors.
 */
export const getDoctors = async (): Promise<ApiDoctor[]> => {
  const response = await api.get("/doctors")
  return response.data.data
}

/**
 * Fetches a list of all hospitals.
 */
export const getHospitals = async (): Promise<ApiHospital[]> => {
  const response = await api.get("/hospitals")
  return response.data.data
}

/**
 * Books a new appointment for the current patient.
 */
export const bookAppointment = async (
  data: BookAppointmentData,
): Promise<ApiAppointment> => {
  const response = await api.post("/appointments", data)
  return response.data.data
}

/**
 * Initiates a mobile money payment for an appointment.
 */
export const initiatePayment = async (
  data: InitiatePaymentData,
): Promise<{ paymentId: string }> => {
  const response = await api.post("/payments/initiate", data)
  return response.data.data
}