import axios, { AxiosError } from 'axios';
import { storage } from '../services/storage';
import { API_BASE_URL, ENV_CONFIG } from '../config';

export { API_BASE_URL };

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: ENV_CONFIG.timeoutMs,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT authentication token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Could not retrieve token for API request:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await storage.removeToken();
    }
    return Promise.reject(error);
  }
);
