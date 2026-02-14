import apiClient from "../../lib/apiClient";

export interface ClinicFormData {
  name: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  logo?: string;
  branding_moto: string;
  location: {
    latitude: number;
    longitude: number;
  };
  description: string;
  status: string;
  adminProfile: {
    email: string;
    mobile_number: string;
    password: string;
    full_name: string;
    role: string;
    status: string;
    slot_duration_minutes: number;
    profile_pic?: string;
    education?: string[];
    years_of_experience?: number;
    specialization?: string;
    qualification?: string;
    bio?: string;
    availability?: {
      [key: string]: string[];
    };
  };
}

export interface ClinicResponse {
  id: string;
  _id?: string;
  name: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  logo?: string;
  branding_moto: string;
  location: {
    latitude: number;
    longitude: number;
  };
  description: string;
  status: string;
  current_plan?: {
    subscription_id?: string | null;
    name?: string;
    price?: number;
    currency?: string;
    updated_at?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface ClinicsListResponse {
  data: ClinicResponse[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Create a new clinic with admin profile
 */
export const createClinic = async (data: ClinicFormData): Promise<ClinicResponse> => {
  const response = await apiClient.post("/api/clinics/create", data);
  return response.data;
};

/**
 * Get all clinics for super admin
 */
export const getAllClinics = async (
  options?: { page?: number; limit?: number }
): Promise<ClinicsListResponse> => {
  const response = await apiClient.get("/api/clinics", { params: options });
  const payload = response.data;
  if (Array.isArray(payload)) {
    return { data: payload };
  }
  return {
    data: payload?.data || [],
    pagination: payload?.pagination,
  };
};

/**
 * Get clinic information by ID
 */
export const getClinicInfo = async (clinicId: string): Promise<ClinicResponse> => {
  const response = await apiClient.get(`/api/clinics/${clinicId}`);
  return response.data;
};

/**
 * Get clinic by ID
 */
export const getClinicById = async (clinicId: string): Promise<ClinicResponse> => {
  const response = await apiClient.get(`/api/clinics/${clinicId}`);
  return response.data;
};

/**
 * Update clinic details
 */
export const updateClinic = async (
  clinicId: string,
  data: Partial<ClinicFormData>
): Promise<ClinicResponse> => {
  const response = await apiClient.put(`/api/clinics/${clinicId}`, data);
  return response.data;
};

/**
 * Deactivate clinic (set status to Inactive)
 */
export const deactivateClinic = async (clinicId: string): Promise<ClinicResponse> => {
  const response = await apiClient.put(`/api/clinics/${clinicId}`, { status: "Inactive" });
  return response.data;
};

/**
 * Delete clinic
 */
export const deleteClinic = async (clinicId: string): Promise<void> => {
  await apiClient.delete(`/api/clinics/${clinicId}`);
};
