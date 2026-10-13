import axios, { AxiosError } from 'axios';
import { storage } from '../services/storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

const getBackendUrl = (): string => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (hostUri) {
    if (hostUri.includes('ngrok')) {
      return 'https://drivix-backend-0qvx.onrender.com/api/v1';
    }
    const cleanedUri = hostUri.replace(/^exp:\/\//, '').replace(/^http:\/\//, '');
    const ip = cleanedUri.split(':')[0];
    if (ip && ip !== 'exp') {
      return `http://${ip}:5000/api/v1`;
    }
  }

  if (Device.isDevice) {
    return 'https://drivix-backend-0qvx.onrender.com/api/v1';
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};

export const API_BASE_URL = __DEV__
  ? getBackendUrl()
  : 'https://drivix-backend-0qvx.onrender.com/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await storage.removeToken();
    }
    return Promise.reject(error);
  }
);
