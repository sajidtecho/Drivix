import axios from 'axios';
import { storage } from './storage';

// Export API_BASE_URL pointing to the authoritative backend
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://drivix-backend-0qvx.onrender.com/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('Could not read auth token:', e);
  }
  return config;
});
