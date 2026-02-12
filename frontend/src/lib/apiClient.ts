/**
 * Get today's appointment count for a clinic
 */
export const getTodaysAppointmentCount = async (clinicId: string, today: string): Promise<number> => {
  const response = await get(`/api/appointments/clinic/${clinicId}`, { params: { date: today } });
  return response.data?.data?.length ?? 0;
};

/**
 * Get monthly appointment count for a clinic
 */
export const getMonthlyAppointmentCount = async (clinicId: string, startDate: string, endDate: string): Promise<number> => {
  const response = await get(`/api/appointments/clinic/${clinicId}`, { params: { startDate, endDate } });
  return response.data?.data?.length ?? 0;
};

/**
 * Get clinic slot/schedule info (admin)
 */
export const  getAdminDoctorSlot = async (clinicId: string): Promise<any> => {
  const response = await get(`/api/profile/${clinicId}`);
  return response.data;
};
import axios, { type AxiosRequestConfig, type AxiosInstance, type AxiosResponse } from 'axios';
import { environment } from '../config/environment';

// Get bearer token from localStorage (set during login)
const getAuthToken = (): string => {
  return localStorage.getItem('auth_token') || '';
};

// Create axios instance with environment-based config
const apiClient: AxiosInstance = axios.create({
  baseURL: environment.getApiUrl(),
  timeout: environment.getApiTimeout(),
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
export const getAllProfiles = async (pagefrom?: any): Promise<AxiosResponse<any>> => {
  return get('/api/profile', { params: pagefrom });
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
 * Admin reset another user's password
 */
export const adminResetPassword = async (profileId: string, adminCurrentPassword: string, newPassword: string): Promise<AxiosResponse<any>> => {
  return put(`/api/profile/${profileId}/reset-password`, { admin_current_password: adminCurrentPassword, new_password: newPassword });
};

/**
 * Get doctor slots (availability and slot_duration_minutes)
 */
export const getProfileSlots = async (
  doctorId: string,
  params?: { consultation_type?: 'in_person' | 'video' }
): Promise<AxiosResponse<any>> => {
  return get(`/api/profile/${doctorId}/slots`, { params });
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
  return get('/api/patients', { params });
};

/**
 * Search clinic patients by term (name, UHID, phone, email)
 */
export const searchClinicPatients = async (clinicId: string, term: string): Promise<AxiosResponse<any>> => {
  return get('/api/patients', {
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
  return get('/api/patients', {
    params: {
      clinic_id: clinicId,
      limit
    }
  });
};

/**
 * Get patient by ID
 */


/**
 * Get patient by UHID
 */
export const getPatientByUhid = async (uhid: string): Promise<AxiosResponse<any>> => {
  return get(`/api/patients/uhid/${uhid}`);
};

/**
 * Get patient by phone number
 */
export const getPatientByPhone = async (phone: string): Promise<AxiosResponse<any>> => {
  return get('/api/patients/phone', { params: { phone } });
};

/**
 * Get patient by email
 */
export const getPatientByEmail = async (email: string): Promise<AxiosResponse<any>> => {
  return get(`/api/patients/email/${email}`);
};

/**
 * Get patient by ID (MongoDB _id or id)
 */
export const getPatientById = async (id: string): Promise<AxiosResponse<any>> => {
  return get(`/api/patients/${id}`);
};

/**
 * Check if patient exists
 */
export const checkPatientExists = async (email: string): Promise<AxiosResponse<any>> => {
  return get('/api/patients/check-exists', { params: { email } });
};

/**
 * Create a new patient
 */
export const createPatient = async (patientData: any): Promise<AxiosResponse<any>> => {
  return post('/api/patients', patientData);
};

/**
 * Update patient
 */
export const updatePatient = async (id: string, patientData: any): Promise<AxiosResponse<any>> => {
  return put(`/api/patients/${id}`, patientData);
};

/**
 * Delete patient
 */
export const deletePatient = async (id: string): Promise<AxiosResponse<any>> => {
  return del(`/api/patients/${id}`);
};

/**
 * Bulk delete patients
 */
export const bulkDeletePatients = async (ids: string[]): Promise<AxiosResponse<any>> => {
  return post('/api/patients/bulk-delete', { ids });
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
 * Get all fees by clinic ID
 */
export const getAllFeesByClinicId = async (clinicId: string): Promise<AxiosResponse<any>> => {
  return get(`/api/fees/clinic/${clinicId}/all`);
};

/**
 * Get fee by clinic ID (backward compatibility)
 */
export const getFeeByClinicId = async (clinicId: string, doctorId?: string): Promise<AxiosResponse<any>> => {
  const params = doctorId ? { doctor_id: doctorId } : {};
  return get(`/api/fees/clinic/${clinicId}`, { params });
};

/**
 * Get fee by ID
 */
export const getFeeById = async (feeId: string): Promise<AxiosResponse<any>> => {
  return get(`/api/fees/${feeId}`);
};

/**
 * Create new fee
 */
export const createFee = async (feeData: any): Promise<AxiosResponse<any>> => {
  return post('/api/fees', feeData);
};

/**
 * Update fee by ID
 */
export const updateFee = async (feeId: string, feeData: any): Promise<AxiosResponse<any>> => {
  return put(`/api/fees/${feeId}`, feeData);
};

/**
 * Delete fee by ID
 */
export const deleteFee = async (feeId: string): Promise<AxiosResponse<any>> => {
  return del(`/api/fees/${feeId}`);
};

/**
 * Create or update fee for a clinic (backward compatibility)
 */
export const saveFee = async (feeData: any): Promise<AxiosResponse<any>> => {
  return post('/api/fees/save', feeData);
};

/**
 * Update fee by clinic ID (backward compatibility)
 */
export const updateFeeByClinicId = async (clinicId: string, feeData: any): Promise<AxiosResponse<any>> => {
  return put(`/api/fees/clinic/${clinicId}`, feeData);
};

/**
 * Delete fee by clinic ID (backward compatibility)
 */
export const deleteFeeByClinicId = async (clinicId: string, doctorId?: string): Promise<AxiosResponse<any>> => {
  const params = doctorId ? { doctor_id: doctorId } : {};
  return del(`/api/fees/clinic/${clinicId}`, { params });
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
 * ==================== TREATMENT PROCEDURES ====================
 */

/**
 * Create a new treatment procedure
 */
export const createTreatmentProcedure = async (procedureData: any): Promise<AxiosResponse<any>> => {
  return post('/api/treatment-procedures', procedureData);
};

/**
 * Create multiple treatment procedures
 */
export const createMultipleTreatmentProcedures = async (procedures: any[]): Promise<AxiosResponse<any>> => {
  return post('/api/treatment-procedures/bulk', { procedures });
};

/**
 * Get treatment procedure by ID
 */
export const getTreatmentProcedureById = async (id: string): Promise<AxiosResponse<any>> => {
  return get(`/api/treatment-procedures/${id}`);
};

/**
 * Get all treatment procedures by consultation ID
 */
export const getTreatmentProceduresByConsultationId = async (consultationId: string): Promise<AxiosResponse<any>> => {
  return get(`/api/treatment-procedures/consultation/${consultationId}`);
};

/**
 * Get all treatment procedures by clinic ID
 */
export const getTreatmentProceduresByClinicId = async (clinicId: string, filters?: any): Promise<AxiosResponse<any>> => {
  return get(`/api/treatment-procedures/clinic/${clinicId}`, { params: filters });
};

/**
 * Update treatment procedure
 */
export const updateTreatmentProcedure = async (id: string, procedureData: any): Promise<AxiosResponse<any>> => {
  return put(`/api/treatment-procedures/${id}`, procedureData);
};

/**
 * Delete treatment procedure
 */
export const deleteTreatmentProcedure = async (id: string): Promise<AxiosResponse<any>> => {
  return del(`/api/treatment-procedures/${id}`);
};

/**
 * Delete all treatment procedures by consultation ID
 */
export const deleteTreatmentProceduresByConsultationId = async (consultationId: string): Promise<AxiosResponse<any>> => {
  return del(`/api/treatment-procedures/consultation/${consultationId}`);
};

/**
 * ==================== CONSULTATIONS ====================
 */

/**
 * Create a new consultation
 */
export const createConsultation = async (consultationData: any): Promise<AxiosResponse<any>> => {
  return post('/api/consultations', consultationData);
};

/**
 * Get consultation by ID
 */
export const getConsultationById = async (id: string): Promise<AxiosResponse<any>> => {
  return get(`/api/consultations/${id}`);
};

/**
 * Get consultation by appointment ID
 */
export const getConsultationByAppointmentId = async (appointmentId: string): Promise<AxiosResponse<any>> => {
  return get(`/api/consultations/appointment/${appointmentId}`);
};

/**
 * Get or create consultation by appointment ID
 */
export const getOrCreateConsultation = async (appointmentId: string, consultationData: any): Promise<AxiosResponse<any>> => {
  return post(`/api/consultations/appointment/${appointmentId}/get-or-create`, consultationData);
};

/**
 * Update consultation
 */
export const updateConsultation = async (id: string, consultationData: any): Promise<AxiosResponse<any>> => {
  return put(`/api/consultations/${id}`, consultationData);
};

/**
 * Get consultations by clinic ID
 */
export const getConsultationsByClinicId = async (clinicId: string, filters?: any): Promise<AxiosResponse<any>> => {
  return get(`/api/consultations/clinic/${clinicId}`, { params: filters });
};

/**
 * Get analytics overview for a clinic (aggregated KPIs)
 */
export const getAnalyticsOverview = async (clinicId: string, date?: string): Promise<AxiosResponse<any>> => {
  const params: any = { clinic_id: clinicId };
  if (date) params.date = date;
  return get('/api/analytics/overview', { params });
};

/**
 * Get analytics trends
 */
export const getAnalyticsTrends = async (clinicId: string, metric: string, start: string, end: string, group_by = 'day'): Promise<AxiosResponse<any>> => {
  return get('/api/analytics/trends', { params: { clinic_id: clinicId, metric, start, end, group_by } });
};

/**
 * Get doctor leaves for a clinic
 */
export const getDoctorLeavesByClinic = async (clinicId: string): Promise<AxiosResponse<any>> => {
  return get(`/api/doctor-leave/clinic/${clinicId}`);
};

/**
 * Get consultations by patient ID
 */
export const getConsultationsByPatientId = async (patientId: string, filters?: any): Promise<AxiosResponse<any>> => {
  return get(`/api/consultations/patient/${patientId}`, { params: filters });
};

/**
 * Delete consultation
 */
export const deleteConsultation = async (id: string): Promise<AxiosResponse<any>> => {
  return del(`/api/consultations/${id}`);
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


/**
 * ==================== CHIEF COMPLAINTS ====================
 */

/**
 * Get all chief complaints for a clinic
 */
export const getChiefComplaints = async (): Promise<AxiosResponse<any>> => {
  return get('/api/chief-complaints');
};

/**
 * Get chief complaint by ID
 */
export const getChiefComplaintById = async (id: string): Promise<AxiosResponse<any>> => {
  return get(`/api/chief-complaints/${id}`);
};

/**
 * Create a new chief complaint
 */
export const createChiefComplaint = async (data: any): Promise<AxiosResponse<any>> => {
  return post('/api/chief-complaints', data);
};

/**
 * Update chief complaint
 */
export const updateChiefComplaint = async (id: string, data: any): Promise<AxiosResponse<any>> => {
  return put(`/api/chief-complaints/${id}`);
};

/**
 * Delete chief complaint
 */
export const deleteChiefComplaint = async (id: string): Promise<AxiosResponse<any>> => {
  return del(`/api/chief-complaints/${id}`);
};

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
  return post('/api/auth/forgot-password', { email: emailOrMobile });
};

export default apiClient;
