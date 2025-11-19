import { api } from './client';

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  bio: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== SERVICES ====================

/**
 * Get all active services (public)
 */
export const getServices = async (): Promise<Service[]> => {
  const response = await api.get('/landing/services');
  return response.data.data;
};

/**
 * Get all services including inactive (admin only)
 */
export const getAllServices = async (): Promise<Service[]> => {
  const response = await api.get('/landing/services/all');
  return response.data.data;
};

/**
 * Create a new service (admin only)
 */
export const createService = async (data: {
  title: string;
  description: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}): Promise<Service> => {
  const response = await api.post('/landing/services', data);
  return response.data.data;
};

/**
 * Update a service (admin only)
 */
export const updateService = async (
  id: string,
  data: {
    title?: string;
    description?: string;
    icon?: string;
    order?: number;
    isActive?: boolean;
  }
): Promise<Service> => {
  const response = await api.patch(`/landing/services/${id}`, data);
  return response.data.data;
};

/**
 * Delete a service (admin only)
 */
export const deleteService = async (id: string): Promise<void> => {
  await api.delete(`/landing/services/${id}`);
};

// ==================== TEAM MEMBERS ====================

/**
 * Get all active team members (public)
 */
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  const response = await api.get('/landing/team');
  return response.data.data;
};

/**
 * Get all team members including inactive (admin only)
 */
export const getAllTeamMembers = async (): Promise<TeamMember[]> => {
  const response = await api.get('/landing/team/all');
  return response.data.data;
};

/**
 * Create a new team member (admin only)
 */
export const createTeamMember = async (data: {
  name: string;
  role: string;
  imageUrl?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  bio?: string;
  order?: number;
  isActive?: boolean;
}): Promise<TeamMember> => {
  const response = await api.post('/landing/team', data);
  return response.data.data;
};

/**
 * Update a team member (admin only)
 */
export const updateTeamMember = async (
  id: string,
  data: {
    name?: string;
    role?: string;
    imageUrl?: string;
    linkedinUrl?: string;
    facebookUrl?: string;
    bio?: string;
    order?: number;
    isActive?: boolean;
  }
): Promise<TeamMember> => {
  const response = await api.patch(`/landing/team/${id}`, data);
  return response.data.data;
};

/**
 * Delete a team member (admin only)
 */
export const deleteTeamMember = async (id: string): Promise<void> => {
  await api.delete(`/landing/team/${id}`);
};

/**
 * Upload a team member image (admin only)
 */
export const uploadTeamMemberImage = async (id: string, file: File): Promise<{ imageUrl: string }> => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await api.post(`/landing/team/${id}/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

// ==================== INSURANCE PARTNERS ====================

export interface InsurancePartner {
  id: string;
  name: string;
  description: string;
  logoUrl: string | null;
  logoInitial: string | null;
  websiteUrl: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all active insurance partners (public)
 */
export const getInsurancePartners = async (): Promise<InsurancePartner[]> => {
  const response = await api.get('/landing/insurance');
  return response.data.data;
};

/**
 * Get all insurance partners including inactive (admin only)
 */
export const getAllInsurancePartners = async (): Promise<InsurancePartner[]> => {
  const response = await api.get('/landing/insurance/all');
  return response.data.data;
};

/**
 * Create a new insurance partner (admin only)
 */
export const createInsurancePartner = async (data: {
  name: string;
  description: string;
  logoUrl?: string;
  logoInitial?: string;
  websiteUrl?: string;
  order?: number;
  isActive?: boolean;
}): Promise<InsurancePartner> => {
  const response = await api.post('/landing/insurance', data);
  return response.data.data;
};

/**
 * Update an insurance partner (admin only)
 */
export const updateInsurancePartner = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    logoUrl?: string;
    logoInitial?: string;
    websiteUrl?: string;
    order?: number;
    isActive?: boolean;
  }
): Promise<InsurancePartner> => {
  const response = await api.patch(`/landing/insurance/${id}`, data);
  return response.data.data;
};

/**
 * Delete an insurance partner (admin only)
 */
export const deleteInsurancePartner = async (id: string): Promise<void> => {
  await api.delete(`/landing/insurance/${id}`);
};

/**
 * Upload an insurance partner logo (admin only)
 */
export const uploadInsurancePartnerLogo = async (id: string, file: File): Promise<{ logoUrl: string }> => {
  const formData = new FormData();
  formData.append('logo', file);
  
  const response = await api.post(`/landing/insurance/${id}/logo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

