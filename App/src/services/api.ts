import axios from 'axios';
import { storage } from './storage';

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

// Helper to determine the local backend URL dynamically
const getLocalBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (hostUri) {
    if (hostUri.includes('ngrok')) {
      // Tunnel mode: local backend on port 5000 is not automatically exposed,
      // fallback to the live production API URL
      return 'https://drivix-backend-0qvx.onrender.com/api/v1';
    }
    
    // Clean scheme prefix exp:// or http:// if present
    const cleanedUri = hostUri.replace(/^exp:\/\//, '').replace(/^http:\/\//, '');
    const ip = cleanedUri.split(':')[0];
    if (ip && ip !== 'exp') {
      return `http://${ip}:5000/api/v1`;
    }
  }
  
  // If it's a physical device and no host IP was successfully parsed,
  // we fallback to the production API (since localhost / 10.0.2.2 will fail)
  if (Device.isDevice) {
    return 'https://drivix-backend-0qvx.onrender.com/api/v1';
  }
  
  // Fallback values if hostUri is not available (for simulators/emulators)
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1'; // standard emulator loopback
  }
  return 'http://localhost:5000/api/v1';
};

// Connect to Local Backend dynamically or fallback to Live Production Backend
export const API_BASE_URL = __DEV__
  ? getLocalBackendUrl()
  : 'https://drivix-backend-0qvx.onrender.com/api/v1';

console.log('🔌 Mobile API Base URL:', API_BASE_URL);

// eslint-disable-next-line import/no-named-as-default-member
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token to all outgoing requests automatically
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors (like unauthorized tokens)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token has expired or is invalid, remove it from storage to force re-auth
      await storage.removeToken();
    }
    return Promise.reject(error);
  }
);
