// new/src/api/patientService.ts

import {
  type ApiAppointment,
  type ApiDoctor,
  type ApiHospital,
  type BookAppointmentData,
  type InitiatePaymentData,
} from "../types/api" // We will create this file next

import { api } from "./client"

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
export const getDoctors = async (hospitalId?: string, specialization?: string, includeAvailability: boolean = false): Promise<ApiDoctor[]> => {
  const params: any = {};
  if (hospitalId) {
    params.hospitalId = hospitalId;
  }
  if (specialization) {
    params.specialization = specialization;
  }
  if (includeAvailability) {
    params.includeAvailability = 'true';
  }
  const response = await api.get("/doctors", { params });
  return response.data.data;
};

/**
 * Fetches a list of all hospitals.
 */
export const getHospitals = async (includeDoctors: boolean = false): Promise<ApiHospital[]> => {
  const params: any = {};
  if (includeDoctors) {
    params.includeDoctors = 'true';
  }
  const response = await api.get("/hospitals", { params });
  return response.data.data;
};

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