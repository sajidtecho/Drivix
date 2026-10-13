import axios from 'axios';
import { storage } from './storage';
import { API_BASE_URL, ENV_CONFIG } from '../config';

export { API_BASE_URL };

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: ENV_CONFIG.timeoutMs,
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
