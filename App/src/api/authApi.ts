import { apiClient } from './client';
import { User } from '../types';

export interface LoginParams {
  email?: string;
  mobile?: string;
  password?: string;
}

export interface RegisterParams {
  name: string;
  email: string;
  mobile?: string;
  password?: string;
  city?: string;
}

export interface AuthResponse {
  token: string;
  _id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  user?: User;
  message?: string;
}

export const authApi = {
  login: async (credentials: LoginParams): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return res.data;
  },

  register: async (data: RegisterParams): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  getProfile: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/profile');
    return res.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const res = await apiClient.put<User>('/auth/profile', data);
    return res.data;
  },

  sendPublicOtp: async (email: string) => {
    const res = await apiClient.post('/auth/send-public-otp', { email });
    return res.data;
  },

  verifyPublicOtp: async (email: string, otp: string) => {
    const res = await apiClient.post('/auth/verify-public-otp', { email, otp });
    return res.data;
  },
};
