import axios, { type AxiosRequestConfig, type AxiosInstance, type AxiosResponse } from 'axios';
import { environment } from '@/config/environment';

// Get bearer token from localStorage (set during login)
// Supports both 'authToken' (new) and 'auth_token' (legacy) keys
const getAuthToken = (): string => {
  return localStorage.getItem('authToken') || localStorage.getItem('auth_token') || '';
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
    // Support both 'authToken' (new) and 'auth_token' (legacy) keys
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log request details for debugging
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
      data: config.data,
      headers: config.headers,
    });
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    // Only logout if explicitly unauthorized (401) AND token exists AND error indicates token issue
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    if (
      error.response?.status === 401 &&
      token &&
      (
        error.response?.data?.code === 'TOKEN_EXPIRED' ||
        error.response?.data?.code === 'INVALID_TOKEN' ||
        (typeof error.response?.data?.message === 'string' && error.response?.data?.message.toLowerCase().includes('token'))
      )
    ) {
      console.warn('Token expired or invalid. Logging out...');
      localStorage.removeItem('authToken');
      localStorage.removeItem('auth_token');
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    }
    throw error;
  }
);

/**
 * Set authorization token
 * Stores in localStorage with 'authToken' key
 */
export const setAuthToken = (token: string) => {
  if (token) {
    localStorage.setItem('authToken', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('authToken');
    delete apiClient.defaults.headers.common['Authorization'];
  }
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
 * Enhanced API methods with built-in error handling
 */
export const api = {
  get: async <T = any>(url: string, config?: AxiosRequestConfig) => {
    try {
      const response = await apiClient.get<T>(url, config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return handleApiError(error);
    }
  },

  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    try {
      const response = await apiClient.post<T>(url, data, config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return handleApiError(error);
    }
  },

  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    try {
      const response = await apiClient.put<T>(url, data, config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return handleApiError(error);
    }
  },

  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    try {
      const response = await apiClient.patch<T>(url, data, config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return handleApiError(error);
    }
  },

  delete: async <T = any>(url: string, config?: AxiosRequestConfig) => {
    try {
      const response = await apiClient.delete<T>(url, config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return handleApiError(error);
    }
  },
};

/**
 * Handle API errors with standardized format
 */
function handleApiError(error: any) {
  let message = 'An error occurred';
  let code = 'UNKNOWN_ERROR';
  let status = null;

  if (axios.isAxiosError(error)) {
    message = error.response?.data?.message || error.response?.data?.error || error.message;
    code = error.response?.data?.code || `HTTP_${error.response?.status}`;
    status = error.response?.status;
    
    // Log detailed error info for debugging
    console.error('❌ API Error Response:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      error: error.response?.data?.error,
      code: error.response?.data?.code,
      fullResponse: error.response?.data,
    });
  } else if (error instanceof Error) {
    message = error.message;
    console.error('❌ API Error:', error.message);
  }

  return {
    success: false,
    error: message,
    code,
    status,
  };
}

/**
 * Get doctor profile by ID
 * @param doctorId MongoDB ObjectID of the doctor
 * @returns Doctor profile with availability and schedule info
 */
export const getDoctorProfile = async (doctorId: string) => {
  try {
    const response = await apiClient.get(`/api/profile/${doctorId}`);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get all doctor profiles by clinic ID
 * @param clinicId The clinic ID to fetch profiles for
 * @returns Array of doctor profiles for the clinic
 */
export const getClinicProfiles = async (clinicId: string) => {
  try {
    const response = await apiClient.get(`/api/profile/clinic/${clinicId}`);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return handleApiError(error);
  }
};

export default apiClient;
