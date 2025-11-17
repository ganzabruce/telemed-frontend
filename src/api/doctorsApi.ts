import { api } from "./client";

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

