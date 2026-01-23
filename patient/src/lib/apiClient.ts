import axios, { type AxiosRequestConfig, type AxiosInstance, type AxiosResponse } from 'axios';
import { environment } from '@/config/environment';

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
    
    // Only logout if explicitly unauthorized (401) AND user is authenticated
    if (error.response?.status === 401) {
      const token = localStorage.getItem('auth_token');
      
      // Only logout if we have a token (meaning user was previously logged in)
      // If no token, user was already logged out
      if (token) {
        console.warn('Token expired or invalid. Logging out...');
        localStorage.removeItem('auth_token');
        // Use setTimeout to prevent blocking the current navigation
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
    }
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

export default apiClient;
