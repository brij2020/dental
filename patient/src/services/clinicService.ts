/**
 * Clinic Service
 * API service for clinic-related operations
 */

import * as apiClient from '@/lib/apiClient';

export interface ClinicAddress {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface ClinicLocation {
  floor?: string;
  room_number?: string;
  wing?: string;
}

export interface Clinic {
  id?: string;
  _id?: string;
  clinic_id?: string;
  name: string;
  phone: string;
  contact_number?: string;
  address?: ClinicAddress;
  admin_staff?: string;
  admin_staff_name?: string;

  status?: 'Active' | 'Inactive' | 'Pending';
  logo?: string;
  branding_moto?: string;
  location?: ClinicLocation;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClinicSearchFilters {
  name?: string;
  state?: string;
  city?: string;
  pin?: string;
  location?: string;
}

export interface DoctorSchedule {
  id?: string;
  _id?: string;
  clinic_id: string;
  doctor_id: string;
  doctor_name: string;
  specialization?: string;
  qualification?: string;
  experience?: number;
  years_of_experience?: number;
  availability?: string;
  slot_duration_minutes?: number;
  working_days?: string[];
  working_hours?: {
    start: string;
    end: string;
  };
  consultation_fee?: number;
  status?: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminSchedule {
  id?: string;
  _id?: string;
  clinic_id: string;
  user_id: string;
  user_name: string;
  role: string;
  availability?: string;
  working_days?: string[];
  working_hours?: {
    start: string;
    end: string;
  };
  status?: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetch all clinics from the backend
 */
export const fetchAllClinics = async (): Promise<Clinic[]> => {
  try {
    const response = await apiClient.get<any>('/api/clinics');
    const payload = response.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  } catch (error) {
    console.error('Error fetching clinics:', error);
    throw new Error('Failed to fetch clinics');
  }
};

/**
 * Fetch only active clinics
 */
export const fetchActiveClinics = async (): Promise<Clinic[]> => {
  try {
    const response = await apiClient.get<any>('/api/clinics/active');
    const payload = response.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  } catch (error) {
    console.error('Error fetching active clinics:', error);
    throw new Error('Failed to fetch active clinics');
  }
};

/**
 * Search clinics by multiple filters
 * @param filters - Search filters (name, state, city, pin, location)
 */
export const searchClinics = async (filters: ClinicSearchFilters): Promise<Clinic[]> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.name) queryParams.append('name', filters.name);
    if (filters.state) queryParams.append('state', filters.state);
    if (filters.city) queryParams.append('city', filters.city);
    if (filters.pin) queryParams.append('pin', filters.pin);
    if (filters.location) queryParams.append('location', filters.location);

    const response = await apiClient.get<any>(
      `/api/clinics/search/filter?${queryParams.toString()}`
    );
    const payload = response.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  } catch (error) {
    console.error('Error searching clinics:', error);
    throw new Error('Failed to search clinics');
  }
};

/**
 * Fetch a single clinic by ID
 * @param clinicId - MongoDB ObjectId or clinic_id
 */
export const fetchClinicById = async (clinicId: string): Promise<Clinic> => {
  try {
    const response = await apiClient.get<Clinic>(`/api/clinics/${clinicId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching clinic:', error);
    throw new Error('Failed to fetch clinic details');
  }
};

/**
 * Fetch clinic information for authenticated user
 */
export const fetchClinicInformation = async (): Promise<Clinic> => {
  try {
    const response = await apiClient.get<Clinic>('/api/clinics/information');
    return response.data;
  } catch (error) {
    console.error('Error fetching clinic information:', error);
    throw new Error('Failed to fetch clinic information');
  }
};

/**
 * Create a new clinic
 * @param clinicData - Clinic data to create
 */
export const createClinic = async (clinicData: Clinic): Promise<Clinic> => {
  try {
    const response = await apiClient.post<Clinic>('/api/clinics', clinicData);
    return response.data;
  } catch (error) {
    console.error('Error creating clinic:', error);
    throw new Error('Failed to create clinic');
  }
};

/**
 * Update a clinic
 * @param clinicId - MongoDB ObjectId or clinic_id
 * @param clinicData - Updated clinic data
 */
export const updateClinic = async (clinicId: string, clinicData: Partial<Clinic>): Promise<Clinic> => {
  try {
    const response = await apiClient.put<Clinic>(`/api/clinics/${clinicId}`, clinicData);
    return response.data;
  } catch (error) {
    console.error('Error updating clinic:', error);
    throw new Error('Failed to update clinic');
  }
};

/**
 * Delete a clinic
 * @param clinicId - MongoDB ObjectId or clinic_id
 */
export const deleteClinic = async (clinicId: string): Promise<void> => {
  try {
    await apiClient.del(`/api/clinics/${clinicId}`);
  } catch (error) {
    console.error('Error deleting clinic:', error);
    throw new Error('Failed to delete clinic');
  }
};

/**
 * Fetch doctor schedules for a clinic
 * @param clinicId - Clinic ID (ObjectId or clinic_id)
 */
/**
 * Fetch doctor schedules with slots for a clinic
 * @param clinicId - Clinic ID (ObjectId or clinic_id)
 */
export const fetchDoctorSchedules = async (clinicId: string): Promise<DoctorSchedule[]> => {
  try {
    const response = await apiClient.get<DoctorSchedule[]>(
      `/api/clinics/${clinicId}/doctors`
    );
    const doctors = response.data || [];

    // Fetch slots for each doctor
    const doctorsWithSlots = await Promise.all(
      doctors.map(async (doctor) => {
        try {
          const slotsResponse = await apiClient.get(
            `/api/profile/${doctor._id || doctor.id}/slots`
          );
          return {
            ...doctor,
            slots: slotsResponse.data?.data || null
          };
        } catch (error) {
          console.log(`Could not fetch slots for doctor ${doctor._id}`);
          return doctor;
        }
      })
    );

    return doctorsWithSlots;
  } catch (error) {
    console.error('Error fetching doctor schedules:', error);
    throw new Error('Failed to fetch doctor schedules');
  }
};



/**
 * Fetch doctor schedule by doctor ID
 * @param clinicId - Clinic ID
 * @param doctorId - Doctor ID
 */
export const fetchDoctorScheduleById = async (
  clinicId: string,
  doctorId: string
): Promise<DoctorSchedule> => {
  try {
    const response = await apiClient.get<DoctorSchedule>(
      `/api/clinics/${clinicId}/doctors/${doctorId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching doctor schedule:', error);
    throw new Error('Failed to fetch doctor schedule');
  }
};

/**
 * Create doctor schedule
 * @param clinicId - Clinic ID
 * @param scheduleData - Doctor schedule data
 */
export const createDoctorSchedule = async (
  clinicId: string,
  scheduleData: Partial<DoctorSchedule>
): Promise<DoctorSchedule> => {
  try {
    const response = await apiClient.post<DoctorSchedule>(
      `/api/clinics/${clinicId}/doctors`,
      scheduleData
    );
    return response.data;
  } catch (error) {
    console.error('Error creating doctor schedule:', error);
    throw new Error('Failed to create doctor schedule');
  }
};

/**
 * Update doctor schedule
 * @param clinicId - Clinic ID
 * @param doctorId - Doctor ID
 * @param scheduleData - Updated schedule data
 */
export const updateDoctorSchedule = async (
  clinicId: string,
  doctorId: string,
  scheduleData: Partial<DoctorSchedule>
): Promise<DoctorSchedule> => {
  try {
    const response = await apiClient.put<DoctorSchedule>(
      `/api/clinics/${clinicId}/doctors/${doctorId}`,
      scheduleData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating doctor schedule:', error);
    throw new Error('Failed to update doctor schedule');
  }
};

/**
 * Delete doctor schedule
 * @param clinicId - Clinic ID
 * @param doctorId - Doctor ID
 */
export const deleteDoctorSchedule = async (
  clinicId: string,
  doctorId: string
): Promise<void> => {
  try {
    await apiClient.del(`/api/clinics/${clinicId}/doctors/${doctorId}`);
  } catch (error) {
    console.error('Error deleting doctor schedule:', error);
    throw new Error('Failed to delete doctor schedule');
  }
};

/**
 * Fetch profile by ID
 * @param profileId - Profile ID (MongoDB ObjectId)
 */
export const fetchProfileById = async (profileId: string): Promise<any> => {
  try {
    const response = await apiClient.get(`/api/profile/${profileId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching profile by ID:', error);
    throw new Error('Failed to fetch profile details');
  }
};
