/**
 * Reset password using token
 */
export const resetPassword = async (token: string, newPassword: string): Promise<AxiosResponse<any>> => {
  return post('/api/auth/reset-password', { token, newPassword });
};
/**
 * Request password reset (forgot password)
 */
export const forgotPassword = async (emailOrMobile: string): Promise<AxiosResponse<any>> => {
  // Try to detect if input is email or mobile, send as email for now
  // Backend expects { email }
  return post('/api/auth/forgot-password', { email: emailOrMobile });
};
import axios, { type AxiosRequestConfig, type AxiosInstance, type AxiosResponse } from 'axios';

// Get bearer token from localStorage (set during login)
const getAuthToken = (): string => {
  return localStorage.getItem('auth_token') || '';
};

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: 'http://13.201.53.176:8080/',
  // 'http://127.0.0.1:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`,
  },
});

// Add request interceptor to include the latest token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

/**
 * Set authorization token
 */
export const setAuthToken = (token: string) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

/**
 * Make a POST request
 */
export const post = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.post<T>(url, data, config);
};

/**
 * Make a GET request
 */
export const get = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.get<T>(url, config);
};

/**
 * Make a PUT request
 */
export const put = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.put<T>(url, data, config);
};

/**
 * Make a DELETE request
 */
export const del = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.delete<T>(url, config);
};

/**
 * Create a profile (staff member)
 */
export const createProfile = async (profileData: any): Promise<AxiosResponse<any>> => {
  return post('/api/profile', profileData);
};

/**
 * Get all profiles
 */
export const getAllProfiles = async (): Promise<AxiosResponse<any>> => {
  return get('/api/profile');
};

/**
 * Get profile by ID with optional filters
 */
export const getProfileById = async (id: string): Promise<AxiosResponse<any>> => {
  return get(`/api/profile/${id}`);
};

/**
 * Update profile
 */
export const updateProfile = async (id: string, data: any): Promise<AxiosResponse<any>> => {
  return put(`/api/profile/${id}`, data);
};


/**
 * Delete profile
 */
export const deleteProfile = async (id: string): Promise<AxiosResponse<any>> => {
  return del(`/api/profile/${id}`);
};

/**
 * Get doctor slots (availability and slot_duration_minutes)
 */
export const getProfileSlots = async (doctorId: string): Promise<AxiosResponse<any>> => {
  return get(`/api/profile/${doctorId}/slots`);
};



/**
 * Get all clinic panels
 */
export const getAllClinicPanels = async (clinicId: string, params?: any): Promise<AxiosResponse<any>> => {
  return get(`/api/clinic-panels?clinic_id=${clinicId}`, { params });
};

/**
 * Get all clinic panels
 */
export const getClinicPanels = async (clinicId: string): Promise<AxiosResponse<any>> => {
  return get(`/api/clinic-panels?clinic_id=${clinicId}`);
};

/**
 * Get active clinic panels
 */
export const getActiveClinicPanels = async (clinicId: string): Promise<AxiosResponse<any>> => {
  return get(`/api/clinic-panels/active?clinic_id=${clinicId}`);
};

/**
 * Get clinic panel by ID
 */
export const getClinicPanelById = async (panelId: string): Promise<AxiosResponse<any>> => {
  return get(`/api/clinic-panels/${panelId}`);
};

/**
 * Get clinic panels by specialization
 */
export const getClinicPanelsBySpecialization = async (clinicId: string, specialization: string): Promise<AxiosResponse<any>> => {
  return get(`/api/clinic-panels/specialization?clinic_id=${clinicId}&specialization=${encodeURIComponent(specialization)}`);
};

/**
 * Create clinic panel
 */
export const createClinicPanel = async (panelData: any): Promise<AxiosResponse<any>> => {
  return post('/api/clinic-panels', panelData);
};

/**
 * Update clinic panel
 */
export const updateClinicPanel = async (panelId: string, panelData: any): Promise<AxiosResponse<any>> => {
  return put(`/api/clinic-panels/${panelId}`, panelData);
};

/**
 * Delete clinic panel
 */
export const deleteClinicPanel = async (panelId: string): Promise<AxiosResponse<any>> => {
  return del(`/api/clinic-panels/${panelId}`);
};

/**
 * Add dentist to clinic panel
 */
export const addDentistToPanel = async (panelId: string, dentistId: string): Promise<AxiosResponse<any>> => {
  return post(`/api/clinic-panels/${panelId}/dentist/add`, { dentistId });
};

/**
 * Remove dentist from clinic panel
 */
export const removeDentistFromPanel = async (panelId: string, dentistId: string): Promise<AxiosResponse<any>> => {
  return post(`/api/clinic-panels/${panelId}/dentist/remove`, { dentistId });
};

/**
 * Get panels with specific dentist
 */
export const getPanelsWithDentist = async (clinicId: string, dentistId: string): Promise<AxiosResponse<any>> => {
  return get(`/api/clinic-panels/dentist/${dentistId}?clinic_id=${clinicId}`);
};

/**
 * Get all patients with filters and pagination
 */
export const getAllPatients = async (params?: any): Promise<AxiosResponse<any>> => {
  return get('/api/patient', { params });
};

/**
 * Search clinic patients by term (name, UHID, phone, email)
 */
export const searchClinicPatients = async (clinicId: string, term: string): Promise<AxiosResponse<any>> => {
  return get('/api/patient', {
    params: {
      clinic_id: clinicId,
      search: term,
      limit: 100
    }
  });
};

/**
 * Get all patients for a clinic with pagination
 */
export const getClinicPatients = async (clinicId: string, limit: number = 1000): Promise<AxiosResponse<any>> => {
  return get('/api/patient', {
    params: {
      clinic_id: clinicId,
      limit
    }
  });
};

/**
 * Get patient by ID
 */
export const getPatientById = async (id: string): Promise<AxiosResponse<any>> => {
  return get(`/api/patient/${id}`);
};

/**
 * Get patient by UHID
 */
export const getPatientByUhid = async (uhid: string): Promise<AxiosResponse<any>> => {
  return get(`/api/patient/uhid/${uhid}`);
};

/**
 * Get patient by phone number
 */
export const getPatientByPhone = async (phone: string): Promise<AxiosResponse<any>> => {
  return get('/api/patient/phone', { params: { phone } });
};

/**
 * Get patient by email
 */
export const getPatientByEmail = async (email: string): Promise<AxiosResponse<any>> => {
  return get(`/api/patient/email/${email}`);
};

/**
 * Check if patient exists
 */
export const checkPatientExists = async (email: string): Promise<AxiosResponse<any>> => {
  return get('/api/patient/check-exists', { params: { email } });
};

/**
 * Create a new patient
 */
export const createPatient = async (patientData: any): Promise<AxiosResponse<any>> => {
  return post('/api/patient', patientData);
};

/**
 * Update patient
 */
export const updatePatient = async (id: string, patientData: any): Promise<AxiosResponse<any>> => {
  return put(`/api/patient/${id}`, patientData);
};

/**
 * Delete patient
 */
export const deletePatient = async (id: string): Promise<AxiosResponse<any>> => {
  return del(`/api/patient/${id}`);
};

/**
 * Bulk delete patients
 */
export const bulkDeletePatients = async (ids: string[]): Promise<AxiosResponse<any>> => {
  return post('/api/patient/bulk-delete', { ids });
};

/**
 * ==================== MEDICAL CONDITIONS ====================
 */

/**
 * Get all medical conditions for a clinic
 */
export const getMedicalConditions = async (clinicId: string): Promise<AxiosResponse<any>> => {
  return get('/api/medical-condition', { params: { clinic_id: clinicId } });
};

/**
 * Get single medical condition by ID
 */
export const getMedicalConditionById = async (id: string): Promise<AxiosResponse<any>> => {
  return get(`/api/medical-condition/${id}`);
};

/**
 * Create new medical condition
 */
export const createMedicalCondition = async (data: any): Promise<AxiosResponse<any>> => {
  return post('/api/medical-condition', data);
};

/**
 * Update medical condition
 */
export const updateMedicalCondition = async (id: string, data: any): Promise<AxiosResponse<any>> => {
  return put(`/api/medical-condition/${id}`, data);
};

/**
 * Delete medical condition
 */
export const deleteMedicalCondition = async (id: string): Promise<AxiosResponse<any>> => {
  return del(`/api/medical-condition/${id}`);
};

/**
 * ==================== APPOINTMENTS ====================
 */

/**
 * Book a new appointment
 */
export const bookAppointmentAPI = async (payload: any): Promise<AxiosResponse<any>> => {
  return post('/api/appointments', payload);
};

/**
 * Get booked slots for a doctor on a specific date
 */
export const getBookedSlotsAPI = async (doctorId: string, date: string): Promise<AxiosResponse<any>> => {
  return get('/api/appointments/booked-slots', {
    params: { doctor_id: doctorId, appointment_date: date }
  });
};

/**
 * Get all appointments for a clinic
 */
export const getClinicAppointments = async (clinicId: string, filters?: any): Promise<AxiosResponse<any>> => {
  return get(`/api/appointments/clinic/${clinicId}`, { params: filters });
};

/**
 * Get appointment by ID
 */
export const getAppointmentById = async (id: string): Promise<AxiosResponse<any>> => {
  return get(`/api/appointments/${id}`);
};

/**
 * Update appointment
 */
export const updateAppointment = async (id: string, data: any): Promise<AxiosResponse<any>> => {
  return put(`/api/appointments/${id}`, data);
};

/**
 * Delete appointment
 */
export const deleteAppointment = async (id: string): Promise<AxiosResponse<any>> => {
  return del(`/api/appointments/${id}`);
};

/**
 * ==================== FEES ====================
 */

/**
 * Get fee by clinic ID
 */
export const getFeeByClinicId = async (clinicId: string): Promise<AxiosResponse<any>> => {
  return get(`/api/fees/clinic/${clinicId}`);
};

/**
 * Create or update fee for a clinic
 */
export const saveFee = async (feeData: any): Promise<AxiosResponse<any>> => {
  const { clinic_id } = feeData;
  // If fee already exists, use PUT; otherwise POST
  // Server handles upsert logic
  return post('/api/fees', feeData);
};

/**
 * Update fee by clinic ID
 */
export const updateFeeByClinicId = async (clinicId: string, feeData: any): Promise<AxiosResponse<any>> => {
  return put(`/api/fees/clinic/${clinicId}`, feeData);
};

/**
 * Delete fee by clinic ID
 */
export const deleteFeeByClinicId = async (clinicId: string): Promise<AxiosResponse<any>> => {
  return del(`/api/fees/clinic/${clinicId}`);
};



/**
 * Get clinic by ID
 */
export const getClinicById = async (): Promise<AxiosResponse<any>> => {
  return get(`/api/clinics/information`);
};

/**
 * Update clinic by ID
 */
export const updateClinicById = async (id: string, data: any): Promise<AxiosResponse<any>> => {
  return put(`/api/clinics/${id}`, data);
};

/**
 * Change user password
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<AxiosResponse<any>> => {
  return put('/api/auth/change-password', { currentPassword, newPassword });
};

/**
 * ==================== PROCEDURES ====================
 */

/**
 * Get all procedures for a clinic
 */
export const getProcedures = async (clinicId: string): Promise<AxiosResponse<any>> => {
  return get('/api/procedures', {
    params: { clinic_id: clinicId }
  });
};

/**
 * Get procedure by ID
 */
export const getProcedureById = async (id: string): Promise<AxiosResponse<any>> => {
  return get(`/api/procedures/${id}`);
};

/**
 * Create a new procedure
 */
export const createProcedure = async (procedureData: any): Promise<AxiosResponse<any>> => {
  return post('/api/procedures', procedureData);
};

/**
 * Update procedure
 */
export const updateProcedure = async (id: string, procedureData: any): Promise<AxiosResponse<any>> => {
  return put(`/api/procedures/${id}`, procedureData);
};

/**
 * Delete procedure
 */
export const deleteProcedure = async (id: string): Promise<AxiosResponse<any>> => {
  return del(`/api/procedures/${id}`);
};

/**
 * ==================== PROBLEMS ====================
 */

/**
 * Get all problems for a clinic
 */
export const getProblems = async (): Promise<AxiosResponse<any>> => {
  return get('/api/problems');
};

/**
 * Get problem by ID
 */
export const getProblemById = async (id: string): Promise<AxiosResponse<any>> => {
  return get(`/api/problems/${id}`);
};

/**
 * Create a new problem
 */
export const createProblem = async (problemData: any): Promise<AxiosResponse<any>> => {
  return post('/api/problems', problemData);
};

/**
 * Update problem
 */
export const updateProblem = async (id: string, problemData: any): Promise<AxiosResponse<any>> => {
  return put(`/api/problems/${id}`, problemData);
};

/**
 * Delete problem
 */
export const deleteProblem = async (id: string): Promise<AxiosResponse<any>> => {
  return del(`/api/problems/${id}`);
};

export default apiClient;
